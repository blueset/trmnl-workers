export interface CalendarEvent {
  start: number;
  end: number;
}

export interface CalendarData {
  events: CalendarEvent[];
  skippedEvents: number;
}

export interface WeekSchedule {
  week_days: number[];
  start_time: string;
  end_time: string;
}

export interface ScheduleData {
  week_schedules: WeekSchedule[];
  always_active: boolean;
}

export type SchedulerEnv = Pick<
  WorkerBindings,
  "TRMNL_DATA_SOURCE" | "TRMNL_SCHEDULE_TARGET" |
  "SCHEDULE_PAD_MINUTES" | "SCHEDULE_UPDATER_DRY_RUN"
> & Partial<Pick<WorkerBindings, "TRMNL_API_KEY">>;

export class SchedulerError extends Error {
  constructor(
    public readonly code: string,
    public readonly operation: string,
    public readonly status?: number,
  ) {
    super(`${operation}: ${code}${status === undefined ? "" : ` (HTTP ${status})`}`);
    this.name = "SchedulerError";
  }
}

function record(value: unknown, operation: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SchedulerError("invalid_response", operation);
  }
  return value as Record<string, unknown>;
}

function timestamp(value: unknown): number {
  if (typeof value !== "string") {
    throw new SchedulerError("invalid_event_timestamp", "calendar");
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) throw new SchedulerError("invalid_event_timestamp", "calendar");
  const [, year, month, day, hour, minute, second, offset] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  const parsed = Date.parse(value);
  if (
    !Number.isFinite(parsed) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day) ||
    Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 ||
    (offset !== "Z" && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4)) > 59))
  ) {
    throw new SchedulerError("invalid_event_timestamp", "calendar");
  }
  return parsed;
}

export function parseCalendar(value: unknown): CalendarData {
  const data = record(record(value, "calendar").data, "calendar");
  if (!Array.isArray(data.events)) {
    throw new SchedulerError("missing_events_array", "calendar");
  }
  const events: CalendarEvent[] = [];
  let skippedEvents = 0;
  for (const raw of data.events) {
    const event = record(raw, "calendar");
    if (event.all_day !== undefined && typeof event.all_day !== "boolean") {
      throw new SchedulerError("invalid_all_day", "calendar");
    }
    if (event.all_day || event.start_full === undefined || event.start_full === null || event.start_full === "") {
      skippedEvents++;
      continue;
    }
    const start = timestamp(event.start_full);
    const end = event.end_full === undefined || event.end_full === null || event.end_full === ""
      ? start : timestamp(event.end_full);
    if (end < start) throw new SchedulerError("invalid_event_interval", "calendar");
    events.push({ start, end });
  }
  return { events, skippedEvents };
}

export function parseSchedule(value: unknown): ScheduleData {
  const data = record(record(value, "schedule").data, "schedule");
  if (!Array.isArray(data.week_schedules) || typeof data.always_active !== "boolean") {
    throw new SchedulerError("invalid_response", "schedule");
  }
  const week_schedules = data.week_schedules.map((value): WeekSchedule => {
    const row = record(value, "schedule");
    if (
      !Array.isArray(row.week_days) || !row.week_days.length ||
      !row.week_days.every((day): day is number => typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6) ||
      typeof row.start_time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.start_time) ||
      typeof row.end_time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.end_time)
    ) {
      throw new SchedulerError("invalid_window", "schedule");
    }
    return {
      week_days: [...new Set(row.week_days)].sort((a, b) => a - b),
      start_time: row.start_time,
      end_time: row.end_time,
    };
  });
  if (data.always_active !== (week_schedules.length === 0)) {
    throw new SchedulerError("inconsistent_always_active", "schedule");
  }
  return { week_schedules, always_active: data.always_active };
}

export function parseConfig(env: SchedulerEnv) {
  if (typeof env.TRMNL_API_KEY !== "string" || !env.TRMNL_API_KEY.trim()) {
    throw new SchedulerError("missing_api_key", "configuration");
  }
  if (typeof env.TRMNL_DATA_SOURCE !== "string" || !/^[A-Za-z0-9_-]+$/.test(env.TRMNL_DATA_SOURCE)) {
    throw new SchedulerError("invalid_data_source", "configuration");
  }
  if (!/^[1-9]\d*$/.test(env.TRMNL_SCHEDULE_TARGET)) {
    throw new SchedulerError("invalid_schedule_target", "configuration");
  }
  const padMinutes = Number(env.SCHEDULE_PAD_MINUTES);
  if (!/^\d+$/.test(env.SCHEDULE_PAD_MINUTES) || !Number.isSafeInteger(padMinutes)) {
    throw new SchedulerError("invalid_padding", "configuration");
  }
  if (env.SCHEDULE_UPDATER_DRY_RUN !== "true" && env.SCHEDULE_UPDATER_DRY_RUN !== "false") {
    throw new SchedulerError("invalid_dry_run", "configuration");
  }
  return {
    apiKey: env.TRMNL_API_KEY,
    source: env.TRMNL_DATA_SOURCE,
    target: env.TRMNL_SCHEDULE_TARGET,
    padMinutes,
    dryRun: env.SCHEDULE_UPDATER_DRY_RUN === "true",
  };
}
