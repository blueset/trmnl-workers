import { DOMParser } from '@xmldom/xmldom';

// TTL Configuration (in milliseconds)
const RESPONSE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const TITLE_CACHE_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

// KV key for the cache
const CACHE_KV_KEY = "slickdeals_cache";

// Cache structure stored in KV
interface CacheData {
    // Response cache: keyed by mode value
    responseCache: Record<string, {
        data: DealResult[];
        timestamp: number;
    }>;
    // Title cache: keyed by input title string
    titleCache: Record<string, {
        parsed: ParsedTitle;
        timestamp: number;
    }>;
}

interface DealResult {
    name: string;
    price: string | undefined;
    note: string | undefined;
    image: string;
    thumbScore: string | undefined;
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
    AI: Ai;
    TRMNL_WORKERS_KV: KVNamespace;
}

async function getCache(kv: KVNamespace): Promise<CacheData> {
    const data = await kv.get(CACHE_KV_KEY);
    if (data) {
        return JSON.parse(data) as CacheData;
    }
    return { responseCache: {}, titleCache: {} };
}

async function setCache(kv: KVNamespace, cache: CacheData): Promise<void> {
    await kv.put(CACHE_KV_KEY, JSON.stringify(cache));
}

function isResponseCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < RESPONSE_CACHE_TTL_MS;
}

function isTitleCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < TITLE_CACHE_TTL_MS;
}

// Clean expired items only when we need to write new values
function cleanExpiredItems(cache: CacheData): void {
    const now = Date.now();
    
    // Clean expired response cache entries
    for (const mode of Object.keys(cache.responseCache)) {
        if (now - cache.responseCache[mode].timestamp >= RESPONSE_CACHE_TTL_MS) {
            delete cache.responseCache[mode];
        }
    }
    
    // Clean expired title cache entries
    for (const title of Object.keys(cache.titleCache)) {
        if (now - cache.titleCache[title].timestamp >= TITLE_CACHE_TTL_MS) {
            delete cache.titleCache[title];
        }
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const mode = url.searchParams.get('mode') || 'popdeals';
        const bypassResponseCache = url.searchParams.get('bypass_response_cache') === 'true';
        const bypassTitleCache = url.searchParams.get('bypass_title_cache') === 'true';
        
        // Load cache from KV
        const cache = await getCache(env.TRMNL_WORKERS_KV);
        
        // Check if we have a valid cached response for this mode
        const responseCacheEntry = cache.responseCache[mode];
        if (!bypassResponseCache && responseCacheEntry && isResponseCacheValid(responseCacheEntry.timestamp)) {
            return new Response(JSON.stringify(responseCacheEntry.data), {
                headers: { 
                    "content-type": "application/json",
                    "x-cache": "HIT"
                }
            });
        }
        
        const feedUrl = `https://slickdeals.net/newsearch.php?mode=${mode}&searcharea=deals&searchin=first&rss=1`;
        const response = await fetch(feedUrl);
        const text = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/xml");
        const items = doc.getElementsByTagName("item");
        
        const result: DealResult[] = [];
        const originalTitles: string[] = [];

        for (let i = 0; i < Math.min(15, items.length); i++) {
            const item = items[i];
            const title = item.getElementsByTagName("title")[0]?.textContent || "";
            originalTitles.push(title);
            
            // Use getElementsByTagNameNS for content:encoded if possible, otherwise fallback to tag name search
            let contentEncoded = "";
            const contentEncodedNode = item.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded")[0] 
                                    || item.getElementsByTagName("content:encoded")[0];
            if (contentEncodedNode) {
                contentEncoded = contentEncodedNode.textContent || "";
            }
            
            // Parse content for image and thumbScore
            const imgMatch = contentEncoded.match(/<img src="([^"]+)"/);
            const image = imgMatch ? imgMatch[1] : "";
            
            const scoreMatch = contentEncoded.match(/Thumb Score:\s*([+-]?\d+)/);
            const thumbScore = scoreMatch ? scoreMatch[1] : undefined;
            
            // Remove image tags and thumb score from HTML content
            let cleanedHtml = contentEncoded.replace(/<img[^>]*>/gi, "");
            cleanedHtml = cleanedHtml.replace(/Thumb Score:\s*[+-]?\d+/gi, "");
            
            // Content text (strip tags)
            const contentText = cleanedHtml.replace(/<[^>]+>/g, "").trim();
            
            result.push({
                name: title,
                price: undefined,
                note: undefined,
                image,
                thumbScore,
                content: {
                    html: cleanedHtml,
                    text: contentText
                }
            });
        }

        // Check title cache and determine which titles need AI parsing
        const titlesToParseWithAI: string[] = [];
        const titleIndexMap: Map<string, number[]> = new Map(); // Map title to result indices
        const cachedParsedTitles: Map<string, ParsedTitle> = new Map();
        
        for (let i = 0; i < originalTitles.length; i++) {
            const title = originalTitles[i];
            const titleCacheEntry = cache.titleCache[title];
            
            if (!bypassTitleCache && titleCacheEntry && isTitleCacheValid(titleCacheEntry.timestamp)) {
                // Use cached parsed title
                cachedParsedTitles.set(title, titleCacheEntry.parsed);
            } else {
                // Need to parse this title with AI
                if (!titleIndexMap.has(title)) {
                    titlesToParseWithAI.push(title);
                    titleIndexMap.set(title, []);
                }
                titleIndexMap.get(title)!.push(i);
            }
        }
        
        // Parse titles with AI if needed
        let needsKVWrite = false;
        if (titlesToParseWithAI.length > 0) {
            const aiParsedTitles = await parseTitleAI(titlesToParseWithAI, env.AI);
            
            // Update title cache with new parsed titles
            const now = Date.now();
            for (let j = 0; j < titlesToParseWithAI.length; j++) {
                const title = titlesToParseWithAI[j];
                const parsed = aiParsedTitles[j];
                cache.titleCache[title] = {
                    parsed,
                    timestamp: now
                };
                cachedParsedTitles.set(title, parsed);
            }
            needsKVWrite = true;
        }

        // Merge parsed titles into result
        for (let i = 0; i < result.length; i++) {
            const title = originalTitles[i];
            const parsed = cachedParsedTitles.get(title);
            if (parsed) {
                result[i].name = parsed.name;
                result[i].price = parsed.price || undefined;
                result[i].note = parsed.note || undefined;
            }
        }
        
        // Update response cache
        cache.responseCache[mode] = {
            data: result,
            timestamp: Date.now()
        };
        needsKVWrite = true;
        
        // Clean expired items before writing to KV
        if (needsKVWrite) {
            cleanExpiredItems(cache);
            await setCache(env.TRMNL_WORKERS_KV, cache);
        }
        
        return new Response(JSON.stringify(result), {
            headers: { 
                "content-type": "application/json",
                "x-cache": "MISS"
            }
        });
    }
}

const prompt = `You are a data extraction assistant. Your task is to parse a list of deal title strings into structured JSON objects containing \`name\`, \`price\`, and \`note\`.

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
[
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
\`\`\`

### Task:
Parse the following JSON input array into the corresponding JSON output array.`;

async function parseTitleAI(titles: string[], ai: Ai) {
    const result = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast" as "@cf/meta/llama-3.1-8b-instruct-fp8", {
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: JSON.stringify(titles, null, 2) }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        price: { type: "string" },
                        note: { type: "string" }
                    },
                    required: ["name", "price", "note"]
                }
            }
        }
    });
    return result.response as unknown as Array<{ name: string; price: string; note: string }>;
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