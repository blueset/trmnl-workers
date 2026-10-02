import { parseCalendar, parseSchedule, SchedulerError, type WeekSchedule } from "./types";

const BASE_URL = "https://trmnl.com/api";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;

export class TrmnlClient {
  private readonly apiKey: string;
  private readonly request: typeof fetch;

  constructor(apiKey: string, request: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.request = request;
  }

  private async json(path: string, operation: string, payload?: object): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.request(`${BASE_URL}${path}`, {
        method: payload ? "PUT" : "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
          ...(payload ? { "Content-Type": "application/json" } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        await response.body?.cancel();
        const code = response.status === 401 ? "invalid_api_key"
          : response.status === 403 ? "check_read_content_and_resource_permissions"
          : response.status === 404 ? "resource_not_found"
          : response.status === 422 ? "unsupported_source_or_invalid_schedule"
          : response.status === 429 ? "rate_limited"
          : "upstream_http_error";
        throw new SchedulerError(code, operation, response.status);
      }
      if (!response.body) throw new SchedulerError("empty_response", operation);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let body = "";
      let bytes = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > MAX_RESPONSE_BYTES) {
            await reader.cancel();
            throw new SchedulerError("response_too_large", operation);
          }
          body += decoder.decode(part.value, { stream: true });
        }
        body += decoder.decode();
      } finally {
        reader.releaseLock();
      }
      try {
        return JSON.parse(body);
      } catch {
        throw new SchedulerError("invalid_json", operation);
      }
    } catch (error) {
      if (error instanceof SchedulerError) throw error;
      throw new SchedulerError(controller.signal.aborted ? "request_timeout" : "network_error", operation);
    } finally {
      clearTimeout(timeout);
    }
  }

  async calendar(source: string) {
    return parseCalendar(await this.json(`/plugin_settings/${encodeURIComponent(source)}/data`, "calendar_get"));
  }

  async schedule(target: string) {
    return parseSchedule(await this.json(`/playlists/items/${encodeURIComponent(target)}/schedule`, "schedule_get"));
  }

  async replaceSchedule(target: string, week_schedules: WeekSchedule[]) {
    if (!week_schedules.length) throw new SchedulerError("empty_write_refused", "schedule_put");
    return parseSchedule(await this.json(`/playlists/items/${encodeURIComponent(target)}/schedule`,
      "schedule_put", { week_schedules }));
  }
}
