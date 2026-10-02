import { afterEach, describe, expect, it, vi } from "vitest";
import oidcToken from "./index";

const env = {
  OIDC_PROXY_ALLOWED_ORIGINS: "https://blueset.github.io",
  OIDC_PROXY_ALLOW_LOCALHOST: "true",
  OIDC_PROXY_ALLOWED_CLIENT_IDS: "",
};
const ORIGIN = "https://blueset.github.io";
const FORM = "application/x-www-form-urlencoded";

function post(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("https://worker.example/oidc/token", {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": FORM, ...headers },
    body,
    duplex: "half",
  } as RequestInit);
}

afterEach(() => vi.unstubAllGlobals());

describe("oidc-token proxy", () => {
  it("answers preflight for allowed origins, including localhost", async () => {
    const res = await oidcToken.fetch(
      new Request("https://worker.example/oidc/token", { method: "OPTIONS", headers: { Origin: "http://localhost:8080" } }),
      env,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:8080");
  });

  it("rejects other origins and localhost when disabled", async () => {
    expect((await oidcToken.fetch(post("grant_type=refresh_token", { Origin: "https://evil.example" }), env)).status).toBe(403);
    const res = await oidcToken.fetch(post("grant_type=refresh_token", { Origin: "http://localhost:8080" }), {
      ...env,
      OIDC_PROXY_ALLOW_LOCALHOST: "false",
    });
    expect(res.status).toBe(403);
  });

  it("forwards token requests and adds CORS headers", async () => {
    const upstream = vi.fn(async () => Response.json({ access_token: "a", refresh_token: "r" }));
    vi.stubGlobal("fetch", upstream);
    const body = "grant_type=authorization_code&code=c&code_verifier=v&client_id=id&redirect_uri=x";
    const res = await oidcToken.fetch(post(body), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ access_token: "a", refresh_token: "r" });
    expect(upstream).toHaveBeenCalledWith("https://trmnl.com/oidc/token", expect.objectContaining({ method: "POST", body }));
  });

  it("passes upstream errors through", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "invalid_grant" }, { status: 400 })));
    const res = await oidcToken.fetch(post("grant_type=refresh_token&refresh_token=r"), env);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_grant" });
  });

  it("validates the request before contacting TRMNL", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    expect((await oidcToken.fetch(post("grant_type=password"), env)).status).toBe(400);
    expect((await oidcToken.fetch(post("grant_type=refresh_token&client_secret=s"), env)).status).toBe(400);
    expect((await oidcToken.fetch(post("{}", { "Content-Type": "application/json" }), env)).status).toBe(415);
    const pinned = { ...env, OIDC_PROXY_ALLOWED_CLIENT_IDS: "good" };
    expect((await oidcToken.fetch(post("grant_type=refresh_token&client_id=bad"), pinned)).status).toBe(400);
    const big = new ReadableStream({
      start(c) { for (let i = 0; i < 5; i++) c.enqueue(new Uint8Array(4096).fill(97)); c.close(); },
    });
    expect((await oidcToken.fetch(post(big), env)).status).toBe(413);
    const get = new Request("https://worker.example/oidc/token", { headers: { Origin: ORIGIN } });
    expect((await oidcToken.fetch(get, env)).status).toBe(405);
    expect(upstream).not.toHaveBeenCalled();
  });
});
