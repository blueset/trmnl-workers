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
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
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

    it.each([
        {
            outcome: "invalid_json",
            content: "```json\n{\"deals\":[]}\n```",
        },
        {
            outcome: "missing_content",
            content: null,
        },
        {
            outcome: "missing_deals",
            content: '{"result":[]}',
        },
        {
            outcome: "count_mismatch",
            content: '{"deals":[]}',
        },
        {
            outcome: "invalid_deals",
            content: '{"deals":[{"name":"Test Product","price":10,"note":""}]}',
        },
    ])("logs $outcome with response context before regex fallback", async ({ outcome, content }) => {
        const cache = createMockCache();
        const kv = createMockKV();
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });
        fetchMock
            .mockResolvedValueOnce(createFeedResponse())
            .mockResolvedValueOnce(Response.json({
                id: "gen-test",
                model: "test-model",
                provider: "test-provider",
                choices: [{
                    finish_reason: "stop",
                    native_finish_reason: "stop",
                    message: { content, reasoning: "Reasoning without a valid answer" },
                }],
                usage: { completion_tokens: 42 },
            }));

        const response = await slickdeals.fetch(
            new Request("https://example.com/slickdeals"),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test-secret" },
            ctx
        );
        await Promise.all(ctx.scheduled);

        expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
            event: "slickdeals.openrouter_result",
            outcome,
            mode: "popdeals",
            titles: ["Test Product $10"],
            generation_id: "gen-test",
            model: "test-model",
            provider: "test-provider",
            finish_reason: "stop",
            usage: { completion_tokens: 42 },
            response_preview: expect.stringContaining("Reasoning without a valid answer"),
        }));
        if (outcome === "invalid_json") {
            expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
                error_name: "SyntaxError",
                error_message: expect.any(String),
                content_preview: content,
            }));
        }
        expect(console.log).toHaveBeenCalledWith(expect.objectContaining({
            event: "slickdeals.title_parsed",
            source: "regex",
            title: "Test Product $10",
            price: "$10",
        }));
        expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("test-secret");
        expect(await response.json()).toEqual([
            expect.objectContaining({ name: "Test Product", price: "$10" }),
        ]);
        expect(Array.from(kv.storage.keys()).some(key => key.startsWith("slickdeals:title:"))).toBe(false);
    });

    it("logs successful model metadata and suspicious output without changing the extracted result", async () => {
        const cache = createMockCache();
        const kv = createMockKV();
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });
        fetchMock
            .mockResolvedValueOnce(createFeedResponse())
            .mockResolvedValueOnce(Response.json({
                id: "gen-empty-price",
                model: "test-model",
                choices: [{
                    finish_reason: "stop",
                    message: { content: '{"deals":[{"name":"Wrong product","price":"","note":""}]}' },
                }],
            }));

        const response = await slickdeals.fetch(
            new Request("https://example.com/slickdeals"),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test" },
            ctx
        );
        await Promise.all(ctx.scheduled);

        expect(console.log).toHaveBeenCalledWith(expect.objectContaining({
            event: "slickdeals.openrouter_result",
            outcome: "success",
            generation_id: "gen-empty-price",
            model: "test-model",
            expected_count: 1,
            actual_count: 1,
        }));
        expect(console.warn).toHaveBeenCalledWith(expect.objectContaining({
            event: "slickdeals.title_parsed",
            source: "ai",
            title: "Test Product $10",
            name: "Wrong product",
            price: "",
            issues: ["empty_price"],
        }));
        expect(await response.json()).toEqual([expect.objectContaining({ name: "Wrong product" })]);
    });

    it.each(["http_error", "request_error", "response_json_error"])("logs %s with bounded diagnostics", async outcome => {
        const cache = createMockCache();
        const kv = createMockKV();
        const ctx = createExecutionContext();
        vi.stubGlobal("caches", { default: cache });
        fetchMock.mockResolvedValueOnce(createFeedResponse());
        if (outcome === "request_error") {
            fetchMock.mockRejectedValueOnce(new Error("Connection reset"));
        } else {
            fetchMock.mockResolvedValueOnce(new Response("upstream failure ".repeat(2000), {
                status: outcome === "http_error" ? 429 : 200,
            }));
        }

        await slickdeals.fetch(
            new Request("https://example.com/slickdeals"),
            { TRMNL_WORKERS_KV: kv as unknown as KVNamespace, OPENROUTER_API_KEY: "test" },
            ctx
        );
        await Promise.all(ctx.scheduled);

        expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
            event: "slickdeals.openrouter_result",
            outcome,
            titles: ["Test Product $10"],
            duration_ms: expect.any(Number),
        }));
        if (outcome !== "request_error") {
            expect(console.error).toHaveBeenCalledWith(expect.objectContaining({
                response_preview: expect.any(String),
                response_length: 34000,
                response_truncated: true,
            }));
            const log = vi.mocked(console.error).mock.calls[0][0];
            expect(log.response_preview.length).toBeLessThan(34000);
        }
    });
});
