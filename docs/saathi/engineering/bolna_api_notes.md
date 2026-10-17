# Bolna API notes

Fill this during Phase 2 trial. Do not invent results.

## Endpoints we will hit

- `POST /v2/agent` — create; expect 201; read `state`
- `PUT` tools
- `PATCH` prompt + webhook
- `POST /call` — `user_data` = prompt variables + `parent_id` + `timezone:"Asia/Kolkata"` + `last_call_summary` (≤800 chars)
- `POST /dispositions/` — extractions
- `GET /user/me` — wallet / floor

Pipelines are an **array of arrays**.

## Trial constraints

- Omit `from_phone_number`
- Verified Numbers only
- Own daily scheduler: `/api/cron/tick` (Bolna scheduled/batch is one-shot)
- All timestamps `+05:30`, never `Z`

## Verify on trial (write outcomes here)

| Question | Result | Date |
| --- | --- | --- |
| Tool param as JSON body vs query string | _pending_ | |
| Tool timeout / failure behaviour | _pending_ | |
| Does `execution_id` substitute into tool params? | _pending_ | |
| Does `user_data` substitute into per-language prompts? | _pending_ | |
| Single-call `scheduled_at` lead time / rounding | _pending_ | |
| Verified Numbers cap / per-call trial limit | _pending_ | |
| Webhooks per retry attempt? | _pending_ | |
| Extraction: can a question use call variables? | _pending_ | |
| Extraction: one objective → multiple values? | _pending_ | |
| Extraction: text answers keep requested line format? | _pending_ | |

Parser for extractions stays tolerant either way.

## Language

Configure through Bolna native multilingual settings. Prompt keeps one line only (see `system_prompt_bolna.md`).
