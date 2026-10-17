# Tools schema

Four mid-call tools. Each HTTP endpoint: Bearer `SAATHI_TOOL_TOKEN`, reply **<300 ms**, small JSON, slow work async, **idempotent** on `call_sid` + a natural key.

## 1. log_medicine

```
POST /api/tools/log_medicine
{ "call_sid", "parent_id", "medicine_id" | "medicine_name", "status": "taken"|"not_taken"|"not_sure", "said" }
```

Natural key: `(call_sid, medicine_id, schedule_date)`.  
Reply: `{ "ok": true, "dose_log_id" }`.

## 2. raise_alert

```
POST /api/tools/raise_alert
{ "call_sid", "parent_id", "category": "EMERGENCY"|"URGENT"|"ATTENTION", "quote", "late"?: false }
```

Natural key: `(call_sid, category)`.  
Reply: `{ "ok": true, "alert_id" }`.

## 3. relay_message_to_family

```
POST /api/tools/relay_message_to_family
{ "call_sid", "parent_id", "message" }
```

Natural key: `(call_sid, sha256(message))`.  
Reply: `{ "ok": true }`.

## 4. save_memory_note

```
POST /api/tools/save_memory_note
{ "call_sid", "parent_id", "note", "kind": "follow_up"|"stop"|"other" }
```

Natural key: `(call_sid, sha256(note))`.  
Reply: `{ "ok": true, "note_id" }`.

## 5. Extractions (post-call)

Create via `POST /dispositions/` on Bolna exactly as their API requires.

Map:

- medicines[] → dose_logs (do not overwrite a mid-call log)
- red_flag → if EMERGENCY/URGENT and no matching `raise_alert` in tool_call_logs, fire **late** alert (`late=true`, `source=extraction_late`), key `(call_sid, category)`
- Low confidence → mark `needs_human_check`

A call with `conversation_duration = 0` or no `user:` line is `no_conversation`, not a briefing.
