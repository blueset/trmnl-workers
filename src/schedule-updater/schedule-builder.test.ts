import { describe, expect, it } from "vitest";
import { buildSchedule, canonicalSchedule } from "./schedule-builder";
import { parseCalendar } from "./types";

function event(start: string, end = start, all_day = false) {
  return { start_full: start, end_full: end, all_day };
}

function build(raw: unknown[], now: string, pad = 15) {
  return buildSchedule(parseCalendar({ data: { events: raw } }).events, Date.parse(now), pad);
}

describe("schedule builder", () => {
  it("matches the original Python golden fixture", () => {
    const events = [
      event("2026-06-16T00:00:00.000-07:00", "2026-06-17T00:00:00.000-07:00", true),
      event("2026-06-15T11:30:00.000-07:00", "2026-06-15T12:30:00.000-07:00"),
      event("2026-06-15T11:50:00.000-07:00", "2026-06-15T12:20:00.000-07:00"),
      event("2026-06-16T23:50:00.000-07:00", "2026-06-17T00:30:00.000-07:00"),
      event("2026-06-22T10:00:00.000-07:00", "2026-06-22T11:00:00.000-07:00"),
      event("2026-06-23T10:00:00.000-07:00", "2026-06-23T11:00:00.000-07:00"),
    ];
    expect(build(events, "2026-06-15T12:00:00-07:00")).toEqual([
      { week_days: [1], start_time: "09:45", end_time: "10:15" },
      { week_days: [1], start_time: "11:15", end_time: "12:05" },
      { week_days: [2], start_time: "23:35", end_time: "23:59" },
      { week_days: [3], start_time: "00:00", end_time: "00:05" },
    ]);
    expect(build(events, "2026-06-15T13:00:00-07:00")).toHaveLength(3);
  });

  it("uses inclusive start and seven-calendar-day bounds, including across DST", () => {
    const events = [
      event("2026-03-02T10:00:00-08:00"),
      event("2026-03-09T10:00:00-07:00"),
      event("2026-03-09T10:00:01-07:00"),
    ];
    expect(build(events, "2026-03-02T10:00:00-08:00")).toEqual([
      { week_days: [1], start_time: "09:45", end_time: "10:15" },
    ]);
  });

  it("converts offsets to LA and preserves spring-forward wall-clock padding", () => {
    expect(build([event("2026-03-08T10:05:00Z")], "2026-03-08T09:00:00Z")).toEqual([
      { week_days: [0], start_time: "02:50", end_time: "03:20" },
    ]);
  });

  it("deduplicates repeated wall times at fall-back", () => {
    expect(build([
      event("2026-11-01T01:30:00-07:00"),
      event("2026-11-01T01:30:00-08:00"),
    ], "2026-11-01T00:00:00-07:00")).toEqual([
      { week_days: [0], start_time: "01:15", end_time: "01:45" },
    ]);
  });

  it("splits midnight across year and weekday rollover", () => {
    expect(build([event("2026-01-01T00:00:00-08:00")], "2025-12-31T23:00:00-08:00")).toEqual([
      { week_days: [3], start_time: "23:45", end_time: "23:59" },
      { week_days: [4], start_time: "00:00", end_time: "00:15" },
    ]);
    expect(build([event("2026-06-20T23:45:00-07:00")], "2026-06-20T20:00:00-07:00")).toEqual([
      { week_days: [6], start_time: "23:30", end_time: "23:59" },
    ]);
  });

  it("merges touching windows, groups days and truncates seconds", () => {
    expect(build([
      event("2026-06-15T10:00:40-07:00"),
      event("2026-06-15T10:30:40-07:00"),
      event("2026-06-16T10:00:40-07:00"),
    ], "2026-06-15T09:00:00-07:00")).toEqual([
      { week_days: [1], start_time: "09:45", end_time: "10:45" },
      { week_days: [2], start_time: "09:45", end_time: "10:15" },
    ]);
    expect(build([
      event("2026-06-15T10:00:00-07:00"), event("2026-06-16T10:00:00-07:00"),
    ], "2026-06-15T09:00:00-07:00")).toEqual([
      { week_days: [1, 2], start_time: "09:45", end_time: "10:15" },
    ]);
  });

  it("supports zero padding and excludes ended past starts", () => {
    expect(build([event("2026-06-15T10:00:00-07:00")], "2026-06-15T09:00:00-07:00", 0)).toEqual([]);
    expect(build([event("2026-06-15T10:00:00-07:00")], "2026-06-15T11:00:00-07:00")).toEqual([]);
    expect(() => build([], "not-a-date")).toThrow("invalid_builder_input");
    expect(() => build([], "2026-06-15T09:00:00-07:00", -1)).toThrow("invalid_builder_input");
  });

  it("ignores grouping, row order and duplicates during comparison", () => {
    expect(canonicalSchedule([
      { week_days: [2, 1, 1], start_time: "09:45", end_time: "10:15" },
    ])).toBe(canonicalSchedule([
      { week_days: [1], start_time: "09:45", end_time: "10:15" },
      { week_days: [2], start_time: "09:45", end_time: "10:15" },
    ]));
  });

  it("projects very large valid padding without iterating over every date", () => {
    const rows = build([event("2026-06-15T10:00:00-07:00")], "2026-06-15T09:00:00-07:00", 100_000);
    expect(rows.find(row => row.start_time === "00:00" && row.end_time === "23:59")?.week_days)
      .toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
