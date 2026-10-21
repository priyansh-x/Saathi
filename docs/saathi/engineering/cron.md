# Daily scheduler

`GET`/`POST /api/cron/tick` is the morning timer. It is authenticated with `Authorization: Bearer $CRON_SECRET`. On Vercel Hobby, cron may run **once per day** — a `*/5 * * * *` schedule is rejected before a build (`vercel.link/3Fpeeb1`) and production never updates.

`vercel.json` therefore schedules two daily ticks:

| Cron (UTC) | Typical IST | Why |
| --- | --- | --- |
| `0 5 * * *` | 10:30–11:29 | Inside `[call_time, 12:00)` for a 10:00 IST morning call |
| `0 12 * * *` | 17:30–18:29 | Sunday weekly WhatsApp note window |

Hobby will fire each job somewhere in that UTC hour. Live households in `[call_time, 12:00)` IST get one dial; EXAMPLE is skipped when Bolna is live. Missed-call ladder retries that need a 5-minute tick need Pro or an external pinger.

Each tick:

1. Stops on the kill switch.
2. Skips paused or `consent_status=declined` households.
3. If that IST day already has a call, it only walks the missed ladder from the same tick.
4. Otherwise, if IST now is in `[call_time, 11:00)`, it places one morning call.
5. On Sunday from 18:00 IST, it also sends one weekly WhatsApp note per family (answered calls, doses taken, alerts, one line in her words if consent is given). Mocked while `MOCK_WHATSAPP=1`. Idempotent for the Mon–Sun week.

## Local pinger

```bash
curl -X POST http://127.0.0.1:43147/api/cron/tick \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Optional JSON, **only when `MOCK_BOLNA=1`**: `{ "now": "2026-10-17T03:00:00.000Z", "elapsed_min": 30 }` for fake-clock tests. `now` is a UTC instant; IST is derived as `+05:30`. If mocks are off, `now` and `elapsed_min` are ignored and the tick uses wall time.

## Vercel Cron

Vercel sends `Authorization: Bearer $CRON_SECRET` when that env var is set. Do not put a more-than-daily expression in `vercel.json` while the family desk is on Hobby — Git deploys fail instantly and never appear in the Deployments list. The tick is a no-op outside `[call_time, 12:00)` IST except Sunday evening weekly notes.
