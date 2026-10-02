import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./codepoints", () => ({ default: { fetch: vi.fn(() => new Response("codepoints")) } }));
vi.mock("./mdn", () => ({ default: { fetch: vi.fn(() => new Response("mdn")) } }));
vi.mock("./zi-tools", () => ({ default: { fetch: vi.fn(() => new Response("zi-tools")) } }));
vi.mock("./tatoeba", () => ({ default: { fetch: vi.fn(() => new Response("tatoeba")) } }));
vi.mock("./slickdeals", () => ({ default: { fetch: vi.fn(() => new Response("slickdeals")) } }));
vi.mock("./transit", () => ({ default: { fetch: vi.fn(() => new Response("transit")) } }));
vi.mock("./uspto", () => ({ default: { fetch: vi.fn(() => new Response("uspto")) } }));
vi.mock("./oidc-token", () => ({ default: { fetch: vi.fn(() => new Response("oidc-token")) } }));
vi.mock("./schedule-updater", () => ({ scheduled: vi.fn() }));

import worker from "./index";
import { scheduled } from "./schedule-updater";

const env = {
  TRMNL_WORKERS_KV: {} as KVNamespace,
  OPENROUTER_API_KEY: "test",
  TRMNL_DATA_SOURCE: "", TRMNL_SCHEDULE_TARGET: "",
  SCHEDULE_PAD_MINUTES: "15", SCHEDULE_UPDATER_DRY_RUN: "true",
  OIDC_PROXY_ALLOWED_ORIGINS: "", OIDC_PROXY_ALLOW_LOCALHOST: "false", OIDC_PROXY_ALLOWED_CLIENT_IDS: "",
};
const ctx: ExecutionContext = { waitUntil() {}, passThroughOnException() {}, props: {} };

afterEach(() => vi.clearAllMocks());

describe("Worker dispatch", () => {
  it.each(["codepoints", "mdn", "zi-tools", "tatoeba", "slickdeals", "transit", "uspto"])(
    "preserves /%s without scheduler credentials", async route => {
      const response = await worker.fetch(new Request(`https://example.com/${route}`), env, ctx);
      expect(await response.text()).toBe(route);
    },
  );

  it("retains 404 for unknown routes and non-GET requests", async () => {
    expect((await worker.fetch(new Request("https://example.com/missing"), env, ctx)).status).toBe(404);
    expect((await worker.fetch(new Request("https://example.com/mdn", { method: "POST" }), env, ctx)).status).toBe(404);
  });

  it("routes /oidc/token for POST and OPTIONS", async () => {
    for (const method of ["POST", "OPTIONS"]) {
      const response = await worker.fetch(new Request("https://example.com/oidc/token", { method }), env, ctx);
      expect(await response.text()).toBe("oidc-token");
    }
  });

  it("delegates the scheduled event and preserves failures", async () => {
    const controller = { scheduledTime: 123, cron: "7,37 * * * *", noRetry() {} };
    const failure = new Error("failed job");
    vi.mocked(scheduled).mockRejectedValueOnce(failure);
    await expect(worker.scheduled(controller, env)).rejects.toBe(failure);
    expect(scheduled).toHaveBeenCalledWith(controller, env);
  });
});
