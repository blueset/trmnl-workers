import { DOMParser } from '@xmldom/xmldom';

const RESPONSE_FRESH_TTL_SECONDS = 6 * 60 * 60;
const RESPONSE_STALE_TTL_SECONDS = 18 * 60 * 60;
const RESPONSE_RETENTION_TTL_SECONDS = RESPONSE_FRESH_TTL_SECONDS + RESPONSE_STALE_TTL_SECONDS;
const TITLE_CACHE_TTL_SECONDS = 72 * 60 * 60;
const KV_EDGE_CACHE_TTL_SECONDS = 60;
const STALE_EDGE_CACHE_TTL_SECONDS = 60;
const RESPONSE_CACHE_KEY_PREFIX = "slickdeals:response:";
const TITLE_CACHE_KEY_PREFIX = "slickdeals:title:";
const FRESH_CACHE_CONTROL = `public, max-age=300, s-maxage=${RESPONSE_FRESH_TTL_SECONDS}, stale-while-revalidate=${RESPONSE_STALE_TTL_SECONDS}`;
const STALE_CACHE_CONTROL = `public, max-age=0, s-maxage=${STALE_EDGE_CACHE_TTL_SECONDS}, must-revalidate`;

interface CachedResponse {
    body: string;
    timestamp: number;
    etag: string;
}

interface DealResult {
    name: string;
    link: string;
    price?: string;
    note?: string;
    image?: string;
    thumbScore?: string;
    content: {
        html: string;
        text: string;
    };
}

interface ParsedTitle {
    name: string;
    price: string;
    note: string;
}

interface Env {
    OPENROUTER_API_KEY: string;
    TRMNL_WORKERS_KV: KVNamespace;
}

interface CloudflareCacheStorage extends CacheStorage {
    readonly default: Cache;
}

function responseCacheKey(mode: string): string {
    return `${RESPONSE_CACHE_KEY_PREFIX}${mode}`;
}

async function titleCacheKey(title: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(title));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    return `${TITLE_CACHE_KEY_PREFIX}${hash}`;
}

function edgeCacheKey(request: Request, mode: string): Request {
    const url = new URL(request.url);
    url.search = "";
    url.searchParams.set("mode", mode);
    return new Request(url.toString(), { method: "GET" });
}

function isCachedResponse(value: unknown): value is CachedResponse {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.body === "string"
        && typeof candidate.timestamp === "number"
        && typeof candidate.etag === "string";
}

function isParsedTitle(value: unknown): value is ParsedTitle {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.name === "string"
        && typeof candidate.price === "string"
        && typeof candidate.note === "string";
}

async function getCachedResponse(kv: KVNamespace, mode: string): Promise<CachedResponse | null> {
    const value = await kv.get<unknown>(responseCacheKey(mode), {
        type: "json",
        cacheTtl: KV_EDGE_CACHE_TTL_SECONDS,
    });

    if (!isCachedResponse(value)) {
        return null;
    }

    return value;
}

async function putCachedResponse(kv: KVNamespace, mode: string, value: CachedResponse): Promise<void> {
    await kv.put(responseCacheKey(mode), JSON.stringify(value), {
        expirationTtl: RESPONSE_RETENTION_TTL_SECONDS,
    });
}

async function getCachedTitles(
    kv: KVNamespace,
    titles: string[],
): Promise<Map<string, ParsedTitle>> {
    if (titles.length === 0) {
        return new Map();
    }

    const titleKeyPairs = await Promise.all(
        titles.map(async title => [title, await titleCacheKey(title)] as const)
    );
    const values = await kv.get<unknown>(
        titleKeyPairs.map(([, key]) => key),
        { type: "json", cacheTtl: KV_EDGE_CACHE_TTL_SECONDS }
    );

    const parsedTitles = new Map<string, ParsedTitle>();
    for (const [title, key] of titleKeyPairs) {
        const value = values.get(key);
        if (isParsedTitle(value)) {
            parsedTitles.set(title, value);
        }
    }

    return parsedTitles;
}

async function putCachedTitle(kv: KVNamespace, title: string, parsed: ParsedTitle): Promise<void> {
    await kv.put(await titleCacheKey(title), JSON.stringify(parsed), {
        expirationTtl: TITLE_CACHE_TTL_SECONDS,
    });
}

function isResponseFresh(timestamp: number): boolean {
    return Date.now() - timestamp < RESPONSE_FRESH_TTL_SECONDS * 1000;
}

function shortDurationFromNow(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    if (diffMinutes < 1) return "just now";
    const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (diffMinutes < 60) {
        return format.format(-diffMinutes, 'minute');
    } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        return format.format(-hours, 'hour');
    } else {
        const days = Math.floor(diffMinutes / 1440);
        return format.format(-days, 'day');
    }
}

async function getFeedText(mode: string): Promise<string> {
    try {
        const feedUrl = `https://slickdeals.net/newsearch.php?mode=${mode}&searcharea=deals&searchin=first&rss=1`;
        const response = await fetch(feedUrl);
        const text = await response.text();
        // console.log(`Fetched feed for mode=${mode}, http=${response.status}, text=${text}`);
        if (!response.ok) {
            console.error(`Failed to fetch feed: ${response.status} ${response.statusText}, text=${text}`);
            throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}, text=${text}`);
        }
        return text;
    } catch (error) {
        console.error("Error fetching feed:", error);
        return "";
    }
}

async function createEtag(body: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    return `"${hash}"`;
}

function buildCacheableResponse(cached: CachedResponse, stale = false): Response {
    return new Response(cached.body, {
        headers: {
            "content-type": "application/json",
            "cache-control": stale ? STALE_CACHE_CONTROL : FRESH_CACHE_CONTROL,
            "etag": cached.etag,
        },
    });
}

function etagMatches(request: Request, etag: string | null): boolean {
    const ifNoneMatch = request.headers.get("if-none-match");
    if (!ifNoneMatch || !etag) {
        return false;
    }

    const normalizedEtag = etag.replace(/^W\//, "");
    return ifNoneMatch.split(",").some(value => {
        const candidate = value.trim();
        return candidate === "*" || candidate.replace(/^W\//, "") === normalizedEtag;
    });
}

function respond(
    request: Request,
    response: Response,
    cacheStatus: string,
    cacheLayer?: string,
): Response {
    const headers = new Headers(response.headers);
    headers.set("x-cache", cacheStatus);
    if (cacheLayer) {
        headers.set("x-cache-layer", cacheLayer);
    }

    if (etagMatches(request, headers.get("etag"))) {
        return new Response(null, { status: 304, headers });
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

function getCachedDeals(cached: CachedResponse | null): DealResult[] {
    if (!cached) {
        return [];
    }

    try {
        const value: unknown = JSON.parse(cached.body);
        return Array.isArray(value) ? value as DealResult[] : [];
    } catch {
        return [];
    }
}

function buildErrorFallback(cached: CachedResponse | null): Response {
    const cachedDeals = getCachedDeals(cached);
    return new Response(JSON.stringify([
        {
            name: cached?.timestamp ? `Data from ${shortDurationFromNow(cached.timestamp)}` : "No data available",
            link: "",
            content: {
                html: "<p>Error fetching data from Slickdeals.</p>",
                text: "Error fetching data from Slickdeals."
            },
        } satisfies DealResult,
        ...cachedDeals,
    ]), {
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "x-cache": "ERROR_FALLBACK",
        },
    });
}

async function refreshDeals(
    mode: string,
    bypassTitleCache: boolean,
    env: Env,
): Promise<CachedResponse | null> {
    const text = await getFeedText(mode);
    if (!text) {
        return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    const items = doc.getElementsByTagName("item");

    const result: DealResult[] = [];
    const originalTitles: string[] = [];

    for (let i = 0; i < Math.min(15, items.length); i++) {
        const item = items[i];
        const title = item.getElementsByTagName("title")[0]?.textContent || "";
        originalTitles.push(title);

        let contentEncoded = "";
        const contentEncodedNode = item.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded")[0]
            || item.getElementsByTagName("content:encoded")[0];
        if (contentEncodedNode) {
            contentEncoded = contentEncodedNode.textContent || "";
        }

        const imgMatch = contentEncoded.match(/<img src="([^"]+)"/);
        const image = imgMatch ? imgMatch[1] : "";

        const scoreMatch = contentEncoded.match(/Thumb Score:\s*([+-]?\d+)/);
        const thumbScore = scoreMatch ? scoreMatch[1] : undefined;

        let cleanedHtml = contentEncoded.replace(/<img[^>]*>/gi, "");
        cleanedHtml = cleanedHtml.replace(/Thumb Score:\s*[+-]?\d+/gi, "");
        const contentText = cleanedHtml.replace(/<[^>]+>/g, "").trim();

        const link = item.getElementsByTagName("link")[0]?.textContent || "";

        result.push({
            name: title,
            price: undefined,
            note: undefined,
            image,
            thumbScore,
            link,
            content: {
                html: cleanedHtml,
                text: contentText
            }
        });
    }

    const uniqueTitles = Array.from(new Set(originalTitles));
    const cachedParsedTitles = bypassTitleCache
        ? new Map<string, ParsedTitle>()
        : await getCachedTitles(env.TRMNL_WORKERS_KV, uniqueTitles);
    const titlesToParseWithAI = uniqueTitles.filter(title => !cachedParsedTitles.has(title));
    const titleWrites: Promise<void>[] = [];

    if (titlesToParseWithAI.length > 0) {
        const aiParsedTitles = await parseTitleAI(titlesToParseWithAI, env.OPENROUTER_API_KEY);

        if (aiParsedTitles && aiParsedTitles.length === titlesToParseWithAI.length) {
            for (let i = 0; i < titlesToParseWithAI.length; i++) {
                const title = titlesToParseWithAI[i];
                const parsed = aiParsedTitles[i];
                cachedParsedTitles.set(title, parsed);
                titleWrites.push(putCachedTitle(env.TRMNL_WORKERS_KV, title, parsed));
            }
        } else {
            for (const title of titlesToParseWithAI) {
                cachedParsedTitles.set(title, parseTitle(title));
            }
        }
    }

    for (let i = 0; i < result.length; i++) {
        const parsed = cachedParsedTitles.get(originalTitles[i]);
        if (parsed) {
            result[i].name = parsed.name;
            result[i].price = parsed.price || undefined;
            result[i].note = parsed.note || undefined;
        }
    }

    const body = JSON.stringify(result);
    const cachedResponse: CachedResponse = {
        body,
        timestamp: Date.now(),
        etag: await createEtag(body),
    };

    await Promise.all([
        ...titleWrites,
        putCachedResponse(env.TRMNL_WORKERS_KV, mode, cachedResponse),
    ]);

    return cachedResponse;
}

async function refreshAndPopulateEdgeCache(
    cache: Cache,
    cacheKey: Request,
    mode: string,
    bypassTitleCache: boolean,
    env: Env,
): Promise<void> {
    const refreshed = await refreshDeals(mode, bypassTitleCache, env);
    if (refreshed) {
        await cache.put(cacheKey, buildCacheableResponse(refreshed));
    }
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const mode = url.searchParams.get('mode') || 'popdeals';
        const bypassResponseCache = url.searchParams.get('bypass_response_cache') === 'true';
        const bypassTitleCache = url.searchParams.get('bypass_title_cache') === 'true';

        const cache = (caches as CloudflareCacheStorage).default;
        const cacheKey = edgeCacheKey(request, mode);

        if (!bypassResponseCache) {
            const edgeResponse = await cache.match(cacheKey);
            if (edgeResponse) {
                return respond(request, edgeResponse, "HIT", "EDGE");
            }
        }

        const cachedResponse = await getCachedResponse(env.TRMNL_WORKERS_KV, mode);

        if (!bypassResponseCache && cachedResponse) {
            if (isResponseFresh(cachedResponse.timestamp)) {
                const response = buildCacheableResponse(cachedResponse);
                ctx.waitUntil(cache.put(cacheKey, response.clone()));
                return respond(request, response, "HIT", "KV");
            }

            const staleResponse = buildCacheableResponse(cachedResponse, true);
            ctx.waitUntil((async () => {
                try {
                    await cache.put(cacheKey, staleResponse.clone());
                } catch (error) {
                    console.error("Failed to put stale Slickdeals response in edge cache", error);
                }
                await refreshAndPopulateEdgeCache(cache, cacheKey, mode, bypassTitleCache, env);
            })());
            return respond(request, staleResponse, "STALE", "KV");
        }

        const refreshed = await refreshDeals(mode, bypassTitleCache, env);
        if (!refreshed) {
            return buildErrorFallback(cachedResponse);
        }

        const response = buildCacheableResponse(refreshed);
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return respond(request, response, "MISS", "ORIGIN");
    }
}

const prompt = `You are a data extraction assistant. Your task is to parse a list of deal title strings into structured JSON objects containing \`name\`, \`price\`, and \`note\`. Return a JSON object with a single key \`deals\` whose value is the array of parsed objects.

### Extraction Rules:
1.  **Note**: Extract trailing information starting with \`+\`, \`&\`, or \`w/\` (e.g., \`+ Free Shipping\`, \`& More\`, \`w/ Subscribe & Save\`). Also include specific parenthetical notes at the end like \`(Email Delivery)\` or \`(In-Store Only)\` if they appear after the price.
2.  **Price**: Identify the price information immediately preceding the notes. Common formats include:
    *   Simple: \`$28\`, \`Free\`
    *   Range/Start: \`from $3.80\`, \`$1300 or Less\`
    *   Quantity: \`2 for $6\`, \`1 Pack for $14\`
    *   Subscription: \`$1/month\`, \`$225/yr\`
    *   Discount: \`50% Off\`, \`20% Off\`
    *   Complex: \`$750 + 20% Back in PayPal Rewards\`
    *   Special: \`(See Official Rules)\`
    *   **Important**: If multiple prices appear, usually the last one before the notes is the main price, and earlier ones are part of the product name (e.g., "Game A $20, Game B $10" -> Price is "$10").
3.  **Name**: Everything before the extracted price is the product name.

### Examples:

**Input:**
\`\`\`json
[
  "adidas Men's Lite Racer Adapt 7.0 Shoes (3 colors) $28",
  "Sony WH-1000XM4 Noise Cancelling Wireless Over-the-Ear Headphones (3 Colors) $160 + Free Shipping",
  "11-Ounce Tree Hut Serum Infused Hand Wash (Various Scents) from $3.80 w/ Subscribe & Save",
  "Hasbro Winning Moves Scrabble Slam Card Game 2 for $6",
  "Select PayPal Accts: 512GB Galaxy S25 Ultra 5G Unlocked Smartphone (Titanium Gray) $750 + 20% Back in PayPal Rewards + Free Shipping",
  "Warhammer: Vermintide 2 (PC Digital Download) Free",
  "Columbia Sportswear: Select Styles on Men's, Women's, & Kids' Apparel & Shoes 50% Off + Free Shipping",
  "12-Month Xbox Game Pass Core Membership $60 (Email Delivery)",
  "Slickdeals Daily Draw Giveaway – Enter Now for a Chance to Win! (See Official Rules)",
  "PC Digital Games: Shin Megami Tensei V: Vengeance $20.10, Judgment $10 & More",
  "Costco Members: 5-Count PUMA Men's Boxer Briefs: 5 Packs for $50 or 1 Pack for $14 & More + Free Shipping"
]
\`\`\`

**Output:**
\`\`\`json
{
  "deals": [
  {
    "name": "adidas Men's Lite Racer Adapt 7.0 Shoes (3 colors)",
    "price": "$28",
    "note": ""
  },
  {
    "name": "Sony WH-1000XM4 Noise Cancelling Wireless Over-the-Ear Headphones (3 Colors)",
    "price": "$160",
    "note": "+ Free Shipping"
  },
  {
    "name": "11-Ounce Tree Hut Serum Infused Hand Wash (Various Scents)",
    "price": "from $3.80",
    "note": "w/ Subscribe & Save"
  },
  {
    "name": "Hasbro Winning Moves Scrabble Slam Card Game",
    "price": "2 for $6",
    "note": ""
  },
  {
    "name": "Select PayPal Accts: 512GB Galaxy S25 Ultra 5G Unlocked Smartphone (Titanium Gray)",
    "price": "$750 + 20% Back in PayPal Rewards",
    "note": "+ Free Shipping"
  },
  {
    "name": "Warhammer: Vermintide 2 (PC Digital Download)",
    "price": "Free",
    "note": ""
  },
  {
    "name": "Columbia Sportswear: Select Styles on Men's, Women's, & Kids' Apparel & Shoes",
    "price": "50% Off",
    "note": "+ Free Shipping"
  },
  {
    "name": "12-Month Xbox Game Pass Core Membership",
    "price": "$60",
    "note": "(Email Delivery)"
  },
  {
    "name": "Slickdeals Daily Draw Giveaway – Enter Now for a Chance to Win!",
    "price": "(See Official Rules)",
    "note": ""
  },
  {
    "name": "PC Digital Games: Shin Megami Tensei V: Vengeance $20.10, Judgment",
    "price": "$10",
    "note": "& More"
  },
  {
    "name": "Costco Members: 5-Count PUMA Men's Boxer Briefs: 5 Packs for $50 or",
    "price": "1 Pack for $14",
    "note": "& More + Free Shipping"
  }
  ]
}
\`\`\`

### Task:
Parse the following JSON input array into the corresponding JSON output object.`;

async function parseTitleAI(titles: string[], apiKey: string): Promise<Array<{ name: string; price: string; note: string }> | null> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: JSON.stringify(titles, null, 2) }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "deals",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                deals: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            price: { type: "string" },
                                            note: { type: "string" }
                                        },
                                        required: ["name", "price", "note"],
                                        additionalProperties: false
                                    }
                                }
                            },
                            required: ["deals"],
                            additionalProperties: false
                        }
                    }
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`OpenRouter request failed: ${response.status} ${response.statusText}, body=${errText}`);
            return null;
        }

        const data = await response.json() as {
            model?: string;
            choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            console.error("OpenRouter response missing content:", JSON.stringify(data));
            return null;
        }

        const parsed = JSON.parse(content) as { deals?: Array<{ name: string; price: string; note: string }> };
        if (!parsed.deals || !Array.isArray(parsed.deals)) {
            console.error("OpenRouter response missing deals array:", content);
            return null;
        }
        return parsed.deals;
    } catch (error) {
        // If OpenRouter fails (network error, JSON parse error, etc.), return null
        // to signal that AI parsing failed - caller should use regex fallback without caching
        console.error("AI title parsing failed:", error);
        return null;
    }
}


export function parseTitle(title: string) {
    let name = title;
    let price = "";
    let note = "";

    let remainingText = title;
    
    // Step 1: Extract ONLY specific trailing notes (shipping, deals)
    // DO NOT extract parentheticals or w/ patterns - those are part of the product name!
    const trailingNotePatterns = [
        // Free shipping variants
        /\s+\+\s+Free\s+(?:Shipping|S\/H|S&H|Store\s+Pickup)(?:\s+(?:w\/|on)(?:(?:Amazon\s+)?\s+Prime(?:\s+or\s+on)?)?\s+[^$+&]+)?$/i,
        // & More (sometimes with shipping)
        /\s+&\s+More(?:\s+\+\s+Free\s+[^$]+)?$/i,
        // Subscribe & Save
        /\s+w\/\s+Subscribe\s+&\s+Save$/i,
        // Other specific deal terms that are NOTES not product features
        /\s+w\/\s+\d+-Yr\s+[\w\s]+(?:Care\+?)?$/i, // w/ 2-Yr Samsung Care+
        /\s+w\/\s+Amazon\s+Prime$/i,
        /\s+w\/\s+Text\s+Signup$/i,
        // Shipping costs (not free)
        /\s+\+\s+(?:\$[\d.]+\s+)?Shipping$/i,
        // Shipping thresholds
        /\s+\+\s+Free\s+S\/H\s+(?:Orders|on)\s+\$[\d+]+$/i,
    ];
    
    // Apply trailing note patterns repeatedly to extract all
    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of trailingNotePatterns) {
            const match = remainingText.match(pattern);
            if (match) {
                const extractedNote = match[0].trim();
                note = note ? `${extractedNote} ${note}` : extractedNote;
                remainingText = remainingText.slice(0, match.index).trim();
                changed = true;
                break;
            }
        }
    }
    
    // Step 2: Find the price position (but don't extract yet)
    const pricePatterns = [
        // Multi-item bundle prices "X for $Y"
        /\s+(\d+\s+(?:Pack|Packs)\s+for\s+\$[\d,]+)$/i,
        /\s+(\d+\s+for\s+\$[\d,]+)$/i,
        // Complex monthly prices
        /\s+(from\s+\$[\d,]+(?:\.\d{2})?\/mos\s+for\s+\d+\s+mos)$/i,
        // "$X + extras" (price with additional info like cash back)
        /\s+(\$[\d,]+(?:\.\d{2})?\s+\+\s+\d+%\s+[^$&+()\s]+(?:\s+[^$&+()\s]+)*)$/i,
        // "$X per Month", "$X/month", "$X/yr"
        /\s+(\$\d+(?:\.\d{2})?\s+per\s+\w+)$/i,
        /\s+(\$[\d,]+(?:\.\d{2})?\/(?:month|yr|mos))$/i,
        // "$X Each"
        /\s+(\$[\d,]+(?:\.\d{2})?\s+Each)$/i,
        // "from $X each"
        /\s+(from\s+\$[\d,]+(?:\.\d{2})?\s+each)$/i,
        // "$X or Less"
        /\s+(\$[\d,]+(?:\.\d{2})?\s+or\s+(?:Less|less))$/i,
        // "from $X" (must come after "from $X each")
        /\s+(from\s+\$[\d,]+(?:\.\d{2})?)$/i,
        // "$X Off", "$X Statement Credit"
        /\s+(\$\d+\s+(?:Off|Statement\s+Credit))$/i,
        // "Up to X% Off", "X% Off"
        /\s+((?:[Uu]p\s+to\s+)?(?:\$[\d,]+(?:\.\d{2})?|\d+%)\s+Off(?:\s+[^$()\s]+(?:\s+[^$()\s]+)*)?)$/i,
        /\s+(\d+%\s+Off(?:\s+[^$()\s]+(?:\s+[^$()\s]+)*)?)$/i,
        // "X% Cash Back"
        /\s+(\d+%\s+Cash\s+Back)$/i,
        // Special phrases "$X in Walmart Cash", "Get $X..."
        /\s+(\$\d+\s+in\s+[^$&()+]+)$/i,
        /\s+(Get\s+\$\d+\s+[^$&()+]+)$/i,
        // Basic "$X" - MUST come after all more complex patterns
        /\s+(\$[\d,]+(?:\.\d{2})?)$/,
        // Special case patterns that look like prices
        /\s+(\(See\s+Official\s+Rules\))$/i,
        // "Free"
        /\s+(Free(?:\s+to\s+Claim)?)$/i,
    ];
    
    let priceStartIndex = -1;
    let priceMatch: RegExpMatchArray | null = null;
    
    for (const pattern of pricePatterns) {
        priceMatch = remainingText.match(pattern);
        if (priceMatch && priceMatch.index !== undefined) {
            priceStartIndex = priceMatch.index;
            price = priceMatch[1].trim();
            break;
        }
    }
    
    // Step 3: Extract post-price content (parenthetical notes, restrictions after the price)
    if (priceStartIndex >= 0) {
        // Extract the text before price position - this becomes the product name
        const beforePrice = remainingText.slice(0, priceStartIndex).trim();
        // Extract text after price position - these could be notes/restrictions
        const afterPriceText = remainingText.slice(priceStartIndex + (priceMatch?.[0].length || 0)).trim();
        
        // Extract post-price notes from the middle zone (between price and trailing notes)
        // These are typically parentheticals or restrictions
        const postPriceNotePatterns = [
            /^(\([^)]+\))/,  // Parenthetical at start (after price was removed)
            /^(In-Store\s+(?:Only|Pick\s+Up\s+Only))/i,
            /^(Digital\s+Delivery)/i,
            /^(Valid\s+[^$+&]+)/i,
        ];
        
        let postPriceNote = "";
        for (const pattern of postPriceNotePatterns) {
            const match = afterPriceText.match(pattern);
            if (match) {
                postPriceNote = match[1].trim();
                break;
            }
        }
        
        if (postPriceNote) {
            note = note ? `${postPriceNote} ${note}` : postPriceNote;
        }
        
        remainingText = beforePrice;
    }
    
    // Step 4: Everything remaining is the product name
    name = remainingText || title;

    return {
        name,
        price,
        note,
    };
}