# Daily scheduler

`POST /api/cron/tick` is the only timer. It is authenticated with `Authorization: Bearer $CRON_SECRET`. Mocks stay on (`MOCK_BOLNA=1`). **Do not enable this on deploy.** Nothing dials a real person without Priyansh's go-ahead.

Every five minutes the tick:

1. Stops on the kill switch.
2. Skips paused or `consent_status=declined` households.
3. If that IST day already has a call, it only walks the missed ladder from the same tick.
4. Otherwise, if IST now is in `[call_time, 11:00)`, it places one morning call.

## Local pinger

```bash
curl -X POST http://127.0.0.1:43147/api/cron/tick \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Optional JSON, **only when `MOCK_BOLNA=1`**: `{ "now": "2026-10-17T03:00:00.000Z", "elapsed_min": 30 }` for fake-clock tests. `now` is a UTC instant; IST is derived as `+05:30`. If mocks are off, `now` and `elapsed_min` are ignored and the tick uses wall time.

## Vercel Cron (not turned on)

If you later host the family app on Vercel, add to `vercel.json` (do not commit an enabled schedule until Priyansh says go):

```json
{
  "crons": [{ "path": "/api/cron/tick", "schedule": "*/5 * * * *" }]
}
```

Vercel Cron hits the path every 5 minutes. Pair it with `CRON_SECRET` on the Authorization header via a thin wrapper, or keep using an external pinger that already sends the bearer token. Leave the job disabled on first deploy.
