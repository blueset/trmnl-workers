import { afterEach, describe, expect, it, vi } from "vitest";
import { TrmnlClient } from "./client";
import { parseCalendar, parseConfig, parseSchedule, type SchedulerEnv } from "./types";

const rows = [{ week_days: [1], start_time: "09:45", end_time: "10:15" }];
const env: SchedulerEnv = {
  TRMNL_API_KEY: "trmnl_test", TRMNL_DATA_SOURCE: "123", TRMNL_SCHEDULE_TARGET: "456",
  SCHEDULE_PAD_MINUTES: "15", SCHEDULE_UPDATER_DRY_RUN: "true",
};
const json = (value: unknown) => new Response(JSON.stringify(value));

afterEach(() => vi.useRealTimers());

describe("TRMNL REST client", () => {
  it("uses only documented methods, URLs, bearer headers and schedule fields", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: { events: [] } }))
      .mockResolvedValueOnce(json({ data: { week_schedules: [], always_active: true } }))
      .mockResolvedValueOnce(json({ data: { week_schedules: rows, always_active: false } }));
    const client = new TrmnlClient("trmnl_test", request);
    await client.calendar("123");
    await client.schedule("456");
    await client.replaceSchedule("456", rows);
    expect(request.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ["https://trmnl.com/api/plugin_settings/123/data", "GET"],
      ["https://trmnl.com/api/playlists/items/456/schedule", "GET"],
      ["https://trmnl.com/api/playlists/items/456/schedule", "PUT"],
    ]);
    const init = request.mock.calls[2][1];
    expect(init?.headers).toEqual({
      Authorization: "Bearer trmnl_test", Accept: "application/json", "Content-Type": "application/json",
    });
    expect(init?.body).toBe(JSON.stringify({ week_schedules: rows }));
    expect(init?.redirect).toBe("error");
    await expect(client.replaceSchedule("456", [])).rejects.toThrow("empty_write_refused");
    expect(request).toHaveBeenCalledTimes(3);
  });

  it.each([
    [401, "invalid_api_key"], [403, "check_read_content_and_resource_permissions"],
    [404, "resource_not_found"], [422, "unsupported_source_or_invalid_schedule"],
    [429, "rate_limited"], [500, "upstream_http_error"],
  ])("surfaces HTTP %i without exposing upstream data", async (status, code) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("sensitive body", { status }));
    await expect(new TrmnlClient("secret", request).calendar("123"))
      .rejects.toMatchObject({ code, status, operation: "calendar_get" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("rejects network/redirect failures without echoing the raw error", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error("secret in upstream error"));
    await expect(new TrmnlClient("secret", request).calendar("123"))
      .rejects.toThrow("calendar_get: network_error");
  });

  it("rejects malformed and oversized bodies", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("not JSON"))
      .mockResolvedValueOnce(new Response("x".repeat(2 * 1024 * 1024 + 1)));
    const client = new TrmnlClient("secret", request);
    await expect(client.calendar("123")).rejects.toThrow("invalid_json");
    await expect(client.calendar("123")).rejects.toThrow("response_too_large");
  });

  it("times out and aborts a request", async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockImplementation((_url, init) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))));
    const promise = new TrmnlClient("secret", request).calendar("123");
    const assertion = expect(promise).rejects.toThrow("request_timeout");
    await vi.advanceTimersByTimeAsync(30_000);
    await assertion;
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("keeps the deadline active while reading the response body", async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockImplementation(async (_url, init) =>
      new Response(new ReadableStream({
        start(controller) {
          init?.signal?.addEventListener("abort", () => controller.error(new Error("aborted")));
        },
      })));
    const promise = new TrmnlClient("secret", request).calendar("123");
    const assertion = expect(promise).rejects.toThrow("request_timeout");
    await vi.advanceTimersByTimeAsync(30_000);
    await assertion;
  });

  it("accepts the response-size boundary and refuses one extra byte", async () => {
    const prefix = '{"data":{"events":[]},"padding":"';
    const suffix = '"}';
    const body = prefix + "x".repeat(2 * 1024 * 1024 - prefix.length - suffix.length) + suffix;
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(body))
      .mockResolvedValueOnce(new Response(body + " "));
    const client = new TrmnlClient("secret", request);
    await expect(client.calendar("123")).resolves.toEqual({ events: [], skippedEvents: 0 });
    await expect(client.calendar("123")).rejects.toThrow("response_too_large");
  });
});

describe("response and configuration validation", () => {
  it("preserves intentional skips and defaults a missing end to start", () => {
    expect(parseCalendar({ data: { events: [
      { all_day: true }, {}, { start_full: "" }, { start_full: "2026-06-15T10:00:00-07:00" },
    ] } })).toEqual({
      skippedEvents: 3,
      events: [{ start: Date.parse("2026-06-15T10:00:00-07:00"), end: Date.parse("2026-06-15T10:00:00-07:00") }],
    });
  });

  it.each([
    {}, { data: {} }, { data: { events: null } },
    { data: { events: [null] } },
    { data: { events: [{ all_day: "false" }] } },
    { data: { events: [{ start_full: "2026-06-15T10:00:00" }] } },
    { data: { events: [{ start_full: "2026-02-30T10:00:00Z" }] } },
    { data: { events: [{ start_full: "2026-06-15T24:00:00Z" }] } },
    { data: { events: [{ start_full: "2026-06-15T10:00:00Z", end_full: "2026-06-15T09:00:00Z" }] } },
  ])("rejects malformed calendar data %#", value => {
    expect(() => parseCalendar(value)).toThrow();
  });

  it.each([
    { data: {} },
    { data: { week_schedules: [], always_active: false } },
    { data: { week_schedules: [{ ...rows[0], week_days: [7] }], always_active: false } },
    { data: { week_schedules: [{ ...rows[0], week_days: ["1"] }], always_active: false } },
    { data: { week_schedules: [{ ...rows[0], start_time: "24:00" }], always_active: false } },
  ])("rejects malformed schedules %#", value => {
    expect(() => parseSchedule(value)).toThrow();
  });

  it.each([
    { TRMNL_API_KEY: "" }, { TRMNL_DATA_SOURCE: "" }, { TRMNL_SCHEDULE_TARGET: "0" },
    { SCHEDULE_PAD_MINUTES: "-1" }, { SCHEDULE_PAD_MINUTES: "1.5" },
    { SCHEDULE_PAD_MINUTES: "" }, { SCHEDULE_UPDATER_DRY_RUN: "yes" },
  ])("rejects invalid configuration %#", value => {
    expect(() => parseConfig({ ...env, ...value })).toThrow();
  });
});
