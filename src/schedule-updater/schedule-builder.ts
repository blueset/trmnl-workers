import { SchedulerError, type CalendarEvent, type WeekSchedule } from "./types";

const DAY = 86_400_000;
const MINUTE = 60_000;
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hourCycle: "h23",
});

// Encode LA civil fields on a UTC axis for Python-compatible wall-clock arithmetic.
function civilTime(instant: number): number {
  const fields = new Map(formatter.formatToParts(instant).map(part => [part.type, part.value]));
  const date = new Date(0);
  date.setUTCFullYear(Number(fields.get("year")), Number(fields.get("month")) - 1, Number(fields.get("day")));
  date.setUTCHours(Number(fields.get("hour")), Number(fields.get("minute")), Number(fields.get("second")),
    ((instant % 1000) + 1000) % 1000);
  return date.getTime();
}

function time(value: number): string {
  const date = new Date(value);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export function canonicalSchedule(rows: WeekSchedule[]): string {
  return [...new Set(rows.flatMap(row => row.week_days.map(day =>
    `${day}|${row.start_time}|${row.end_time}`
  )))].sort().join("\n");
}

export function buildSchedule(events: CalendarEvent[], now: number, padMinutes = 15): WeekSchedule[] {
  if (!Number.isFinite(now) || !Number.isSafeInteger(padMinutes) || padMinutes < 0) {
    throw new SchedulerError("invalid_builder_input", "builder");
  }
  const localNow = civilTime(now);
  const local = events.map(event => ({ start: civilTime(event.start), end: civilTime(event.end) }));
  const ongoing = local.filter(event => event.start <= localNow && localNow <= event.end);
  const start = ongoing.length ? Math.min(...ongoing.map(event => event.start)) : localNow;
  const pad = padMinutes * MINUTE;
  const spans = local
    .filter(event => event.start >= start && event.start <= start + 7 * DAY)
    .map(event => ({ start: event.start - pad, end: event.start + pad }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  if (spans.some(span => !Number.isFinite(span.start) || !Number.isFinite(span.end) ||
    Math.abs(span.start) > 8.64e15 || Math.abs(span.end) > 8.64e15)) {
    throw new SchedulerError("padding_out_of_range", "builder");
  }
  const merged: typeof spans = [];
  for (const span of spans) {
    const previous = merged.at(-1);
    if (previous && span.start <= previous.end) previous.end = Math.max(previous.end, span.end);
    else merged.push({ ...span });
  }
  const grouped = new Map<string, WeekSchedule>();
  function add(start: number, end: number) {
    if (end <= start) return;
    const start_time = time(start);
    const end_time = time(end);
    const key = `${start_time}|${end_time}`;
    const day = new Date(start).getUTCDay();
    const row = grouped.get(key);
    if (row) {
      if (!row.week_days.includes(day)) row.week_days.push(day);
    } else grouped.set(key, { week_days: [day], start_time, end_time });
  }
  for (const span of merged) {
    let cursor = span.start;
    // Once a span covers a complete week, additional whole weeks add no new windows.
    const finalDay = Math.floor(span.end / DAY);
    const firstDay = Math.floor(cursor / DAY);
    const days = finalDay - firstDay;
    if (days > 8) {
      add(cursor, (firstDay + 1) * DAY - MINUTE);
      for (let day = firstDay + 1; day <= firstDay + 7; day++) {
        add(day * DAY, (day + 1) * DAY - MINUTE);
      }
      cursor = finalDay * DAY;
    }
    while (Math.floor(cursor / DAY) !== finalDay) {
      const midnight = (Math.floor(cursor / DAY) + 1) * DAY;
      add(cursor, midnight - MINUTE);
      cursor = midnight;
    }
    add(cursor, span.end);
  }
  return [...grouped.values()]
    .map(row => ({ ...row, week_days: row.week_days.sort((a, b) => a - b) }))
    .sort((a, b) => a.week_days[0] - b.week_days[0] ||
      a.start_time.localeCompare(b.start_time) || a.end_time.localeCompare(b.end_time));
}
