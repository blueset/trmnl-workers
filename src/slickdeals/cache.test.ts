import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import slickdeals from "./index";

const RESPONSE_CACHE_KEY = "slickdeals:response:popdeals";
const FRESH_BODY = JSON.stringify([
    {
        name: "Test Product",
        link: "https://example.com/deal",
        price: "$10",
        content: { html: "Deal content", text: "Deal content" },
    },
]);
const FRESH_ETAG = '"fresh-etag"';

interface MockKV {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    storage: Map<string, string>;
}

interface MockCache {
    match: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    storage: Map<string, Response>;
}

function createMockKV(initialValues: Record<string, string> = {}): MockKV {
    const storage = new Map(Object.entries(initialValues));

    return {
        get: vi.fn(async (key: string | string[], options?: { type?: string }) => {
            if (Array.isArray(key)) {
                return new Map(key.map(item => {
                    const value = storage.get(item);
                    return [item, options?.type === "json" && value ? JSON.parse(value) : value ?? null];
                }));
            }

            const value = storage.get(key);
            return options?.type === "json" && value ? JSON.parse(value) : value ?? null;
        }),
        put: vi.fn(async (key: string, value: string) => {
            storage.set(key, value);
        }),
        storage,
    };
}

function createMockCache(initialResponse?: Response): MockCache {
    const storage = new Map<string, Response>();
    const cacheUrl = "https://example.com/slickdeals?mode=popdeals";

    if (initialResponse) {
        storage.set(cacheUrl, initialResponse);
    }

    return {
        match: vi.fn(async (request: Request) => storage.get(request.url)?.clone()),
        put: vi.fn(async (request: Request, response: Response) => {
            storage.set(request.url, response.clone());
        }),
        storage,
    };
}

function createExecutionContext() {
    const scheduled: Promise<unknown>[] = [];

    return {
        waitUntil: vi.fn((promise: Promise<unknown>) => {
            scheduled.push(promise);
        }),
        passThroughOnException: vi.fn(),
        scheduled,
    } as unknown as ExecutionContext & {
        scheduled: Promise<unknown>[];
        waitUntil: ReturnType<typeof vi.fn>;
    };
}

function createCachedResponse(timestamp: number) {
    return JSON.stringify({
        body: FRESH_BODY,
        timestamp,
        etag: FRESH_ETAG,
    });
}

function createFeedResponse(): Response {
    return new Response(
        `<?xml version="1.0"?>
        <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
            <channel>
                <item>
                    <title>Test Product $10</title>
                    <link>https://example.com/deal</link>
                    <content:encoded><![CDATA[<img src="https://example.com/image.jpg">Thumb Score: +5 Deal content]]></content:encoded>
                </item>
            </channel>
        </rss>`,
        { status: 200 }
    );
}

function createAiResponse(): Response {
    return Response.json({
        choices: [
            {
                message: {
                    content: JSON.stringify({
                        deals: [{ name: "Test Product", price: "$10", note: "" }],
                    }),
                },
            },
        ],
    });
}

describe("slickdeals caching", () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
        fetchMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns an edge cache hit without reading KV", async () => {
        const cachedResponse = new Response(FRESH_BODY, {
            headers: {
                "content-type": "application/json",
                "cache-control": "public, s-maxage=21600",
                "etag": FRESH_ETAG,
            },
        });
        const cache = createMockCache(cachedResponse);
        const kv = createMockKV();
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });

        const response = await slickdeals.fetch(
            new Request("https://example.com/slickdeals"),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test" },
            ctx
        );

        expect(response.headers.get("x-cache")).toBe("HIT");
        expect(response.headers.get("x-cache-layer")).toBe("EDGE");
        expect(response.headers.get("etag")).toBe(FRESH_ETAG);
        expect(await response.text()).toBe(FRESH_BODY);
        expect(kv.get).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns 304 when the request ETag matches", async () => {
        const cache = createMockCache(new Response(FRESH_BODY, {
            headers: {
                "content-type": "application/json",
                "cache-control": "public, s-maxage=21600",
                "etag": FRESH_ETAG,
            },
        }));
        const kv = createMockKV();
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });

        const response = await slickdeals.fetch(
            new Request("https://example.com/slickdeals", {
                headers: { "if-none-match": FRESH_ETAG },
            }),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test" },
            ctx
        );

        expect(response.status).toBe(304);
        expect(response.headers.get("x-cache")).toBe("HIT");
        expect(response.headers.get("x-cache-layer")).toBe("EDGE");
        expect(await response.text()).toBe("");
    });

    it("promotes a fresh per-mode KV response into the edge cache", async () => {
        const cache = createMockCache();
        const kv = createMockKV({
            [RESPONSE_CACHE_KEY]: createCachedResponse(Date.now()),
        });
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });

        const response = await slickdeals.fetch(
            new Request("https://example.com/slickdeals"),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test" },
            ctx
        );

        expect(response.headers.get("x-cache")).toBe("HIT");
        expect(response.headers.get("x-cache-layer")).toBe("KV");
        expect(response.headers.get("cache-control")).toContain("s-maxage=21600");
        expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

        await Promise.all(ctx.scheduled);

        expect(cache.put).toHaveBeenCalledTimes(1);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("serves a stale response while refreshing split KV entries", async () => {
        const staleTimestamp = Date.now() - 7 * 60 * 60 * 1000;
        const cache = createMockCache();
        const kv = createMockKV({
            [RESPONSE_CACHE_KEY]: createCachedResponse(staleTimestamp),
        });
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });
        fetchMock
            .mockResolvedValueOnce(createFeedResponse())
            .mockResolvedValueOnce(createAiResponse());

        const response = await slickdeals.fetch(
            new Request("https://example.com/slickdeals"),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test" },
            ctx
        );

        expect(response.headers.get("x-cache")).toBe("STALE");
        expect(response.headers.get("cache-control")).toContain("s-maxage=60");
        expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

        await Promise.all(ctx.scheduled);

        const writtenKeys = kv.put.mock.calls.map(call => call[0] as string);
        expect(writtenKeys).toContain(RESPONSE_CACHE_KEY);
        expect(writtenKeys.some(key => key.startsWith("slickdeals:title:"))).toBe(true);
        expect(kv.put.mock.calls.every(call => call[2]?.expirationTtl !== undefined)).toBe(true);
        expect(cache.put).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("writes a cold miss to per-mode KV and the edge cache", async () => {
        const cache = createMockCache();
        const kv = createMockKV();
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });
        fetchMock
            .mockResolvedValueOnce(createFeedResponse())
            .mockResolvedValueOnce(createAiResponse());

        const response = await slickdeals.fetch(
            new Request("https://example.com/slickdeals"),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test" },
            ctx
        );

        expect(response.headers.get("x-cache")).toBe("MISS");
        expect(response.headers.get("etag")).toMatch(/^"[a-f0-9]{64}"$/);
        expect(response.headers.get("cache-control")).toContain("stale-while-revalidate=64800");
        expect(kv.storage.has(RESPONSE_CACHE_KEY)).toBe(true);
        expect(Array.from(kv.storage.keys()).some(key => key.startsWith("slickdeals:title:"))).toBe(true);
        expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

        await Promise.all(ctx.scheduled);

        expect(cache.put).toHaveBeenCalledTimes(1);
    });
});
