# Bolna execution fixtures

Drop the JSON Bolna returned for a real test call in this folder.

- Replace every phone number with `+910000000000`.
- Keep the rest of the payload as Bolna sent it (`id`, `status`, `conversation_duration`, `transcript`, `context_details`, `tool_call_logs`, `extracted_data`, …).
- Do **not** invent a payload and name it as if it were real.

Synthetic payloads used by tests are named `synthetic_*.json` and are labelled synthetic in the file. Webhook tests load every `*.json` here. If the folder has no JSON, those cases skip.

`context_details.recipient_data.parent_id` for local tests should be `parent_kamla` (the EXAMPLE household).
