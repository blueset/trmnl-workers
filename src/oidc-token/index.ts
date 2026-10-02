// Stateless CORS proxy for TRMNL's OAuth token endpoint, used by the Holiday Editor
// (https://blueset.github.io/trmnl-recipes/holiday-editor/). TRMNL serves /oidc/token without
// CORS headers, so a browser-only PKCE client cannot read the token response directly.
// The editor is a public client (no client secret), so this proxy holds no credentials.

const UPSTREAM = "https://trmnl.com/oidc/token";
const MAX_BODY_BYTES = 8 * 1024;
const ALLOWED_GRANTS = new Set(["authorization_code", "refresh_token"]);

type Env = Pick<
  WorkerBindings,
  "OIDC_PROXY_ALLOWED_ORIGINS" | "OIDC_PROXY_ALLOW_LOCALHOST" | "OIDC_PROXY_ALLOWED_CLIENT_IDS"
>;

function list(value: string | undefined): string[] {
  return String(value ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

export function isAllowedOrigin(origin: string | null, env: Env): origin is string {
  if (!origin) return false;
  if (list(env.OIDC_PROXY_ALLOWED_ORIGINS).includes(origin)) return true;
  if (env.OIDC_PROXY_ALLOW_LOCALHOST !== "true") return false;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

// Reads a body stream as UTF-8, or returns null as soon as it exceeds `limit` bytes.
async function readLimited(stream: ReadableStream<Uint8Array> | null, limit: number): Promise<string | null> {
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    if (!isAllowedOrigin(origin, env)) return json(403, { error: "origin_not_allowed" });
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") {
      return json(405, { error: "method_not_allowed" }, { ...cors, Allow: "POST, OPTIONS" });
    }

    if (!(request.headers.get("Content-Type") ?? "").startsWith("application/x-www-form-urlencoded")) {
      return json(415, { error: "unsupported_media_type" }, cors);
    }
    if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES) {
      return json(413, { error: "payload_too_large" }, cors);
    }
    const body = await readLimited(request.body, MAX_BODY_BYTES);
    if (body === null) return json(413, { error: "payload_too_large" }, cors);

    const params = new URLSearchParams(body);
    const grant = params.get("grant_type") ?? "";
    if (!ALLOWED_GRANTS.has(grant)) return json(400, { error: "unsupported_grant_type" }, cors);
    if (params.has("client_secret")) {
      return json(400, { error: "invalid_request", error_description: "Public clients only." }, cors);
    }
    const clientIds = list(env.OIDC_PROXY_ALLOWED_CLIENT_IDS);
    if (clientIds.length && !clientIds.includes(params.get("client_id") ?? "")) {
      return json(400, { error: "unauthorized_client" }, cors);
    }

    let upstream: Response;
    try {
      upstream = await fetch(UPSTREAM, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body,
      });
    } catch (error) {
      console.error(JSON.stringify({ message: "oidc-token upstream fetch failed", error: String(error) }));
      return json(502, { error: "upstream_unreachable" }, cors);
    }

    console.log(JSON.stringify({ message: "oidc-token proxied", grant, status: upstream.status }));
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        ...cors,
      },
    });
  },
};
