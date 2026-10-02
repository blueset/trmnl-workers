import { afterEach, describe, expect, it, vi } from "vitest";
import { runScheduleUpdater, scheduled } from "./index";
import type { SchedulerEnv } from "./types";

const env: SchedulerEnv = {
  TRMNL_API_KEY: "trmnl_test", TRMNL_DATA_SOURCE: "123", TRMNL_SCHEDULE_TARGET: "456",
  SCHEDULE_PAD_MINUTES: "15", SCHEDULE_UPDATER_DRY_RUN: "true",
};
const now = Date.parse("2026-06-15T09:00:00-07:00");
const event = { start_full: "2026-06-15T10:00:00-07:00" };
const rows = [{ week_days: [1], start_time: "09:45", end_time: "10:15" }];
const json = (value: unknown) => new Response(JSON.stringify(value));
const calendar = (events: unknown[] = [event]) => json({ data: { events } });
const schedule = (week_schedules = rows) => json({ data: { week_schedules, always_active: !week_schedules.length } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("schedule updater", () => {
  it.each([{ events: [] }, { events: [{ all_day: true }] }])(
    "skips empty results without reading or writing the schedule %#", async ({ events }) => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(calendar(events));
    expect(await runScheduleUpdater(env, now, request)).toMatchObject({ outcome: "skipped_empty" });
    expect(request).toHaveBeenCalledTimes(1);
    });

  it("does not write an equivalent current schedule", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(calendar()).mockResolvedValueOnce(schedule([...rows, ...rows]));
    expect(await runScheduleUpdater({ ...env, SCHEDULE_UPDATER_DRY_RUN: "false" }, now, request))
      .toMatchObject({ outcome: "unchanged" });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("dry-runs a change without writing", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(calendar()).mockResolvedValueOnce(schedule([]));
    expect(await runScheduleUpdater(env, now, request)).toMatchObject({ outcome: "would_update" });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("writes and verifies only a changed nonempty schedule", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(calendar()).mockResolvedValueOnce(schedule([])).mockResolvedValueOnce(schedule());
    expect(await runScheduleUpdater({ ...env, SCHEDULE_UPDATER_DRY_RUN: "false" }, now, request))
      .toMatchObject({ outcome: "updated", eventCount: 1, windowCount: 1 });
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[2][1]?.method).toBe("PUT");
  });

  it("never writes when calendar data is malformed", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ data: {} }));
    await expect(runScheduleUpdater(env, now, request)).rejects.toThrow("missing_events_array");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("rejects a successful response that does not confirm the desired schedule", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(calendar()).mockResolvedValueOnce(schedule([])).mockResolvedValueOnce(schedule([]));
    await expect(runScheduleUpdater({ ...env, SCHEDULE_UPDATER_DRY_RUN: "false" }, now, request))
      .rejects.toThrow("write_verification_failed");
  });

  it("reconciles on the next run if a PUT was applied but its response was lost", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(calendar()).mockResolvedValueOnce(schedule([]))
      .mockRejectedValueOnce(new Error("response lost"))
      .mockResolvedValueOnce(calendar()).mockResolvedValueOnce(schedule());
    const live = { ...env, SCHEDULE_UPDATER_DRY_RUN: "false" };
    await expect(runScheduleUpdater(live, now, request)).rejects.toThrow("network_error");
    expect(await runScheduleUpdater(live, now, request)).toMatchObject({ outcome: "unchanged" });
    expect(request.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(1);
  });

  it("uses scheduledTime, not the machine clock, and logs no calendar contents", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(calendar()).mockResolvedValueOnce(schedule([]));
    vi.stubGlobal("fetch", request);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await scheduled({ scheduledTime: now, cron: "7,37 * * * *", noRetry() {} }, env);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({ outcome: "would_update", scheduledTime: now });
    expect(log.mock.calls[0][0]).not.toContain("trmnl_test");
    expect(log.mock.calls[0][0]).not.toContain(event.start_full);
  });

  it("fails visibly on missing credentials without attempting requests", async () => {
    const request = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", request);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(scheduled({ scheduledTime: now, cron: "", noRetry() {} }, { ...env, TRMNL_API_KEY: undefined }))
      .rejects.toThrow("missing_api_key");
    expect(request).not.toHaveBeenCalled();
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({ outcome: "failed", code: "missing_api_key" });
  });
});
