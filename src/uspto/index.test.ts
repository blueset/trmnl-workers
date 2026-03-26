import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import uspto from "./index";

const CACHE_KV_KEY = "uspto_rss_cache";

function createMockKV(initialValue?: string) {
  const storage: Record<string, string> = {};

  if (initialValue !== undefined) {
    storage[CACHE_KV_KEY] = initialValue;
  }

  return {
    get: vi.fn(async (key: string) => storage[key] || null),
    put: vi.fn(async (key: string, value: string) => {
      storage[key] = value;
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

describe("uspto endpoint", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns fresh data and caches it on cache miss", async () => {
    const kv = createMockKV();
    const ctx = createExecutionContext();

    fetchMock.mockResolvedValueOnce(
      new Response("<rss>fresh</rss>", {
        status: 200,
        headers: { "content-type": "application/rss+xml; charset=utf-8" },
      })
    );

    const response = await uspto.fetch(
      new Request("https://example.com/uspto"),
      { TRMNL_WORKERS_KV: kv },
      ctx
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-cache")).toBe("MISS");
    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
    expect(await response.text()).toBe("<rss>fresh</rss>");
    expect(ctx.waitUntil).not.toHaveBeenCalled();
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(JSON.parse(kv.storage[CACHE_KV_KEY])).toEqual({
      body: "<rss>fresh</rss>",
      contentType: "application/rss+xml; charset=utf-8",
    });
  });

  it("returns cached data immediately and refreshes in the background", async () => {
    const kv = createMockKV(
      JSON.stringify({
        body: "<rss>cached</rss>",
        contentType: "application/rss+xml; charset=utf-8",
      })
    );
    const ctx = createExecutionContext();

    fetchMock.mockResolvedValueOnce(
      new Response("<rss>updated</rss>", {
        status: 200,
        headers: { "content-type": "application/rss+xml; charset=utf-8" },
      })
    );

    const response = await uspto.fetch(
      new Request("https://example.com/uspto"),
      { TRMNL_WORKERS_KV: kv },
      ctx
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-cache")).toBe("HIT");
    expect(await response.text()).toBe("<rss>cached</rss>");
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

    await Promise.all(ctx.scheduled);

    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(JSON.parse(kv.storage[CACHE_KV_KEY])).toEqual({
      body: "<rss>updated</rss>",
      contentType: "application/rss+xml; charset=utf-8",
    });
  });

  it("returns an error when the upstream fetch fails and nothing is cached", async () => {
    const kv = createMockKV();
    const ctx = createExecutionContext();

    fetchMock.mockResolvedValueOnce(
      new Response("upstream failure", {
        status: 500,
        statusText: "Internal Server Error",
      })
    );

    const response = await uspto.fetch(
      new Request("https://example.com/uspto"),
      { TRMNL_WORKERS_KV: kv },
      ctx
    );

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Failed to fetch USPTO feed");
    expect(kv.put).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});