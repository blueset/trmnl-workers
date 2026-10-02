
## Calendar schedule updater

The `src\schedule-updater` module replaces the Python
`schedule-updater` Raspberry Pi job.
The existing Worker runs it at **:07 and :37 every hour** using
`7,37 * * * *` (UTC). This avoids common cron boundaries; it does not guarantee
lower TRMNL server load. Existing HTTP recipe routes are unchanged. There is no
public scheduler control endpoint and no additional storage.

Each run reads the native calendar plugin's cached data, builds weekly display
windows, reads the current playlist-item schedule, and replaces it only if the
canonical day/time windows differ. It uses the current
[TRMNL REST API](https://trmnl.com/api-docs/openapi.yaml), not website login,
passwords, cookies, or CSRF form replay:

| Operation | Endpoint |
|-----------|----------|
| Read events | `GET /api/plugin_settings/{id}/data` |
| Read schedule | `GET /api/playlists/items/{item_id}/schedule` |
| Replace schedule | `PUT /api/playlists/items/{item_id}/schedule` |

### Display behavior

- Ignore all-day events and records without a start time.
- Begin the seven-calendar-day lookahead at the current scheduled time, or the
  earliest start of an ongoing event.
- Use `America/Los_Angeles` wall-clock times, with DST-aware timezone conversion.
- Display from **15 minutes before to 15 minutes after the event's start**,
  not its entire duration. End times only determine whether an event is ongoing.
- Merge touching/overlapping windows, split at midnight using `23:59` for the
  preceding day, and group identical windows across weekdays (`0=Sunday`).
- Preserve the old algorithm's weekly recurrence: dates with the same weekday
  can contribute windows to that weekday. This is not a date-specific scheduler.
- **Keep the existing schedule when no timed windows remain.** Clearing a TRMNL
  schedule makes the item always active, not hidden. Old recurring windows can
  therefore remain after the calendar becomes empty.
- Do not change importance, visibility, or appearance.

Malformed calendar/schedule responses fail visibly without applying a new
schedule. Fetches have a 30-second deadline and a 2 MiB response limit. Writes are
not retried within a run; the next invocation re-reads live state and reconciles.
Returned PUT windows must match the desired schedule before an update is logged
as successful.

### Account API key and Worker secret

Use a **new scoped account API key**, not the old `user_` account token, a device
API key, or an MCP plugin key. The legacy token cannot access the new schedule
endpoints.

1. At [TRMNL Account](https://trmnl.com/account), create a dedicated key under
   **Account API keys**. This requires a device with Developer edition; BYOD
   licenses include it. New keys start with `trmnl_` and are shown once.
2. Grant **`read` + `content`**, and restrict the key to the target device and
   required plugin settings. Include the source calendar setting and, if the
   resource restrictions require it, the plugin setting referenced by the target
   item. No `devices`, `delete`, `profile`, or `apps` capability is needed.
3. Store the key as a Cloudflare **Secret**, named `TRMNL_API_KEY`:

   ```powershell
   npx wrangler secret put TRMNL_API_KEY --name trmnl
   ```

   Enter the key at the interactive prompt, never as a command argument. This
   command immediately deploys a Worker version: provision it before activating
   the new cron, or while the scheduler is in dry-run mode.

Alternatively use Cloudflare Worker `trmnl` > Settings > Variables and Secrets >
Add > type **Secret** > `TRMNL_API_KEY` > Deploy. Standard per-Worker secrets are
sufficient; Secrets Store and OAuth are not needed for this private job.
Cloudflare deployment authentication is separate from the TRMNL runtime key.

Never put the key in Wrangler `[vars]`, source, logs, or git. Preserve existing
Worker secrets. Named Cloudflare environments, if added later, need separately
provisioned secrets.

For rotation, create a replacement scoped TRMNL key, upload it, verify a dry-run
read cycle, and then revoke the old key at TRMNL. Deleting the Cloudflare secret
does not revoke the upstream credential.

### Configuration and local development

The checked-in Wrangler configuration has blank resource IDs and **dry-run
enabled**. It cannot write schedules until configured.

| Variable | Value |
|----------|-------|
| `TRMNL_API_KEY` | Secret containing the dedicated account API key |
| `TRMNL_DATA_SOURCE` | Same native calendar plugin-setting ID/UUID used by the Python job |
| `TRMNL_SCHEDULE_TARGET` | Same playlist-item ID used by the Python job, not a device/plugin ID |
| `SCHEDULE_PAD_MINUTES` | Nonnegative integer; default config is `"15"` |
| `SCHEDULE_UPDATER_DRY_RUN` | `"true"` for read/compare only, `"false"` to enable writes |

Set production resource IDs in `wrangler.toml` `[vars]`; keep the timezone at
`America/Los_Angeles`, matching the TRMNL account. Blank/malformed configuration
fails only scheduled invocations, not unrelated HTTP routes.

Regenerate binding types from placeholders (never actual secret values):

```powershell
npx wrangler types src\env.d.ts --env-interface WorkerBindings --include-runtime false --strict-vars false --env-file .env.example
```

Run deterministic tests and a bundle-only deployment check:

```powershell
npm test -- src\schedule-updater src\index.test.ts
npx wrangler deploy --dry-run
```

To simulate a cron locally with `SCHEDULE_UPDATER_DRY_RUN=true`:

```powershell
npx wrangler dev --test-scheduled
curl.exe "http://localhost:8787/__scheduled?cron=7%2C37%20*%20*%20*%20*"
```

Wrangler 4.50.0 uses `/__scheduled`; newer releases may expose
`/cdn-cgi/local/scheduled`. A `time` query parameter overrides the evaluation time
with a Unix timestamp in milliseconds. **Local cron testing still calls live
TRMNL unless fetch is mocked.** Dry-run must stay enabled for read-only testing.

### Cutover, monitoring, and rollback

Before enabling writes, verify the source ID, target item, key permissions, and
account timezone. The `/data` endpoint supports **native plugins only**;
private/global plugins return 422. It reads the plugin's cached data and does not
force a refresh. Ensure the source remains in a playlist/mashup and refreshes
with a sufficient calendar horizon. Running twice hourly does not increase the
upstream calendar's refresh cadence.

Deploy in dry-run mode first and check the reported outcome and window counts.
To inspect the computed windows privately, use a local debugger at the
`desired` value in `runScheduleUpdater` and compare with the TRMNL dashboard;
production logs intentionally omit calendar times. Save a backup of the
current schedule, stop the Pi cron, then set
`SCHEDULE_UPDATER_DRY_RUN="false"` and deploy. Keep the Pi installation recoverable
until a changed run, a subsequent unchanged run, and actual device behavior
have been verified. Do not run both writers concurrently.

Workers logs report structured outcomes: `skipped_empty`, `unchanged`,
`would_update`, `updated`, or `failed`, with aggregate counts rather than calendar
contents. Failures reject the scheduled invocation; 403 errors indicate that
`read`/`content` capabilities or resource access need checking. Use the existing
Cloudflare logs/Cron Events view. Cron updates can take up to 15 minutes to
propagate and invocation-history visibility can lag.

To roll back, set dry-run true and deploy, or explicitly set `[triggers]`
`crons=[]` and deploy. Merely omitting `triggers` leaves deployed triggers intact.
Restore the backed-up schedule if necessary, then re-enable the Pi only after
Worker writes are disabled. Preserve unrelated recipe routes, KV, and secrets.
Retiring/revoking the old Pi credentials is a separate operator action.
