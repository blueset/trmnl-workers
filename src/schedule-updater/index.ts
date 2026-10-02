import { TrmnlClient } from "./client";
import { buildSchedule, canonicalSchedule } from "./schedule-builder";
import { parseConfig, SchedulerError, type SchedulerEnv } from "./types";

export async function runScheduleUpdater(env: SchedulerEnv, now: number, request: typeof fetch = fetch) {
  const config = parseConfig(env);
  const client = new TrmnlClient(config.apiKey, request);
  const calendar = await client.calendar(config.source);
  const desired = buildSchedule(calendar.events, now, config.padMinutes);
  const counts = { eventCount: calendar.events.length, skippedEvents: calendar.skippedEvents, windowCount: desired.length };
  if (!desired.length) return { outcome: "skipped_empty" as const, ...counts };

  const current = await client.schedule(config.target);
  if (canonicalSchedule(current.week_schedules) === canonicalSchedule(desired)) {
    return { outcome: "unchanged" as const, ...counts };
  }
  if (config.dryRun) return { outcome: "would_update" as const, ...counts };

  const result = await client.replaceSchedule(config.target, desired);
  if (canonicalSchedule(result.week_schedules) !== canonicalSchedule(desired)) {
    throw new SchedulerError("write_verification_failed", "schedule_put");
  }
  return { outcome: "updated" as const, ...counts };
}

export async function scheduled(controller: ScheduledController, env: SchedulerEnv): Promise<void> {
  try {
    const result = await runScheduleUpdater(env, controller.scheduledTime);
    console.log(JSON.stringify({ job: "schedule-updater", scheduledTime: controller.scheduledTime, ...result }));
  } catch (error) {
    const safeError = error instanceof SchedulerError
      ? error : new SchedulerError("unexpected_failure", "scheduler");
    console.error(JSON.stringify({
      job: "schedule-updater", outcome: "failed", scheduledTime: controller.scheduledTime,
      operation: safeError.operation, code: safeError.code, status: safeError.status,
    }));
    throw safeError;
  }
}
