const USPTO_FEED_URL = "https://uspto.report/tm.rss";
const CACHE_KV_KEY = "uspto_rss_cache";

interface Env {
  TRMNL_WORKERS_KV: KVNamespace;
}

interface CachedResponse {
  body: string;
  contentType: string;
}

interface FetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  body?: string;
  contentType?: string;
}

async function getCachedResponse(kv: KVNamespace): Promise<CachedResponse | null> {
  const cached = await kv.get(CACHE_KV_KEY);
  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as CachedResponse;
  } catch (error) {
    console.error("Failed to parse USPTO cache", error);
    return null;
  }
}

async function putCachedResponse(kv: KVNamespace, cachedResponse: CachedResponse): Promise<void> {
  await kv.put(CACHE_KV_KEY, JSON.stringify(cachedResponse));
}

async function fetchUsptoFeed(): Promise<FetchResult> {
  try {
    const response = await fetch(USPTO_FEED_URL);
    const body = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        body,
      };
    }

    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      body,
      contentType: response.headers.get("content-type") || "application/rss+xml; charset=utf-8",
    };
  } catch (error) {
    console.error("USPTO fetch threw", error);
    return {
      ok: false,
      status: 502,
      statusText: "Fetch failed",
    };
  }
}

async function refreshCache(kv: KVNamespace, cachedResponse: CachedResponse | null): Promise<FetchResult> {
  const result = await fetchUsptoFeed();

  if (!result.ok || result.body === undefined || result.contentType === undefined) {
    console.error(
      `USPTO refresh failed: ${result.status} ${result.statusText}${result.body ? `, body=${result.body}` : ""}`
    );
    return result;
  }

  if (
    !cachedResponse ||
    cachedResponse.body !== result.body ||
    cachedResponse.contentType !== result.contentType
  ) {
    await putCachedResponse(kv, {
      body: result.body,
      contentType: result.contentType,
    });
  }

  return result;
}

function buildResponse(body: string, contentType: string, cacheStatus: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
      "x-cache": cacheStatus,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const cachedResponse = await getCachedResponse(env.TRMNL_WORKERS_KV);

    if (cachedResponse) {
      ctx.waitUntil(refreshCache(env.TRMNL_WORKERS_KV, cachedResponse));
      return buildResponse(cachedResponse.body, cachedResponse.contentType, "HIT");
    }

    const result = await refreshCache(env.TRMNL_WORKERS_KV, null);

    if (result.ok && result.body !== undefined && result.contentType !== undefined) {
      return buildResponse(result.body, result.contentType, "MISS");
    }

    return new Response("Failed to fetch USPTO feed", {
      status: result.status >= 400 ? result.status : 502,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  },
};