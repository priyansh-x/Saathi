# Bolna API notes for Saathi

Compiled Sat 17 Oct 2026 (IST) from the live Bolna docs (`https://www.bolna.ai/docs/llms-full.txt` and the per-page `.md` files with embedded OpenAPI). Raw copies are in `engineering/_research/`.
**Legend:** ✅ = stated in the docs (source linked). ⚠️ = NOT verified, or inferred. Test it on the trial account before relying on it.

---

## 1. Base URL and auth
- ✅ Base URL `https://api.bolna.ai`. Header `Authorization: Bearer <api_key>`. A missing or bad key returns `401 Access denied`. [AGENTS.md](https://www.bolna.ai/docs/agents-md), [Auth](https://www.bolna.ai/docs/api-reference/authentication)
- ✅ Create the key in platform.bolna.ai → Developers → API Keys. It is shown only once.
- ✅ Rate-limited per account. On `429`, back off exponentially. [Limits](https://www.bolna.ai/docs/api-reference/limits)
- ✅ `GET /user/me` returns name, email, wallet balance and `concurrency {max, current}`. [User info](https://www.bolna.ai/docs/api-reference/user/info)

## 2. Agents (create / update)
- ✅ `POST /v2/agent` returns **201** `{agent_id, state:"created"}`. The response field is `state`, not `status`. v1 `/agent` is deprecated. [Create agent](https://www.bolna.ai/docs/api-reference/agent/v2/create)
- ✅ Body shape: `agent_config.tasks[0].tools_config.{llm_agent, synthesizer, transcriber, input, output, api_tools, multilingual_config}`, plus top-level `agent_prompts.task_1.system_prompt`. `toolchain.pipelines` is an **array of arrays**: `[["transcriber","llm","synthesizer"]]`.
- ✅ `llm_agent.agent_type` is one of `simple_llm_agent | knowledgebase_agent | graph_agent | realtime_agent`, and `agent_flow_type` is `"streaming"`. GPT-5-series models require `"temperature": 1`.
- ✅ The LLM provider/model is **not** validated at creation. A bad value only fails when a call runs.
- ✅ Transcriber `provider:"sarvam"`, models `saaras:v4` (recommended) / `saaras:v3`. Use a plain ISO code: `"language":"hi"`. `"hi-IN"` is **rejected**.
- ✅ Synthesizer `provider:"sarvam"`, models `bulbul:v4-flash` / `bulbul:v3`. `provider_config.language` is **required** for Sarvam. Voice ids are model-specific: a v3 voice fails on v4-flash and vice versa. Look up valid pairs with List TTS providers / List voices. [Sarvam TTS](https://www.bolna.ai/docs/sarvam-voice)
- ✅ `PATCH /v2/agent/{agent_id}` returns 200 `{message:"success", state:"updated"}`. It only changes `agent_config.{agent_name, agent_welcome_message, webhook_url, synthesizer, ingest_source_config, telephony_provider, calling_guardrails, call_summary_enabled}` and top-level `agent_prompts`. Use `PUT /v2/agent/{id}` (full replace) to change tools or the toolchain. [Patch](https://www.bolna.ai/docs/api-reference/agent/v2/patch_update)
- ✅ `calling_guardrails {call_start_hour, call_end_hour}` (0–23) are applied in the **recipient's** timezone. Calls outside the window are rescheduled to the next allowed start. Set this to something like 9–20 for elders.
- ✅ `call_summary_enabled` (agent_config, **off by default**) must be on for the execution `summary` field to be filled.

## 3. Languages and mid-call switching
- ✅ Configurable codes: en, hi, bn, as, gu, kn, ml, mr, od, pa, ta, te, ur (+ fr, id, ms, es, nl). Auto-detection mid-call is tuned for **en + hi, ta, te, kn, ml, mr, bn, gu, pa, ur**. [Supported languages](https://www.bolna.ai/docs/customizations/supported-languages)
- ✅ `tools_config.multilingual_config = {enabled:true, active_language:"hi", language_switch_trigger:"requested_or_auto_detected"|"caller_requested", languages:{ "<code>": {transcriber:{language}, synthesizer:{provider, provider_config}, system_prompt, handoff_message, agent_name} }}`. It needs at least 2 languages. Each language can have **its own system_prompt**. [Multilingual config](https://www.bolna.ai/docs/customizations/multilingual-config-reference)
- ✅ Bolna does the switching itself. The docs say: "It's best not to write language-switching instructions into your prompt". [Switching behaviour](https://www.bolna.ai/docs/customizations/language-switching-behavior) → **Mismatch:** `voice/persona.md` §"language" tells the agent how to switch. Review this.
- ✅ Start a call in a chosen language with `agent_data.language` (e.g. `"hi"`) on POST /call, or with `user_data.agent_language`. It returns 400 if that language isn't configured, the agent isn't multilingual, or `voice_id` is also set. [Start call in language](https://www.bolna.ai/docs/customizations/start-call-in-language)
- ✅ Sarvam STT through Bolna: en, hi, bn, ta, te, gu, kn, ml, mr, pa, od, as. **Urdu is NOT available via Sarvam on Bolna.** Bulbul TTS: v4-flash covers en, hi, bn, ta, te, gu, kn, mr, pa. **Malayalam and Odia need `bulbul:v3`.** [Sarvam STT](https://www.bolna.ai/docs/sarvam-transcriber)
- ✅ On `bulbul:v4-flash`, the spoken language follows the **script of the text**, so keep the prompt for each language in its native script.
- ⚠️ Not verified: whether `{{user_data}}` variables are substituted into the per-language `system_prompt` inside `multilingual_config`. They almost certainly are, but test it. If they aren't, the memory and medicine variables would vanish after a switch.

## 4. Sarvam inside Bolna: no separate key needed
- ✅ Sarvam `saaras:v3/v4` (STT) and `bulbul:v3/v4-flash` (TTS) are on Bolna's **preferred models** list, included in the flat **$0.06/min (₹5.52/min)** Voice-AI rate. You can optionally connect your own Sarvam key (platform.bolna.ai/auth/sarvam). [Preferred models](https://www.bolna.ai/docs/pricing/preferred-models)
- ✅ Preferred LLMs include `gpt-4.1-mini`, `gpt-5.4-mini`, `gpt-5-mini`, etc. A non-preferred model is billed at variable rates.
- ✅ Telephony and the platform fee are billed **separately** from the Voice-AI rate. [Call pricing](https://www.bolna.ai/docs/pricing/call-pricing) ⚠️ I could not find the exact all-in per-minute cost on a trial account. Check the "remaining minutes" figure in the dashboard wallet.

## 5. Outbound call: `POST /call`
✅ [Make call](https://www.bolna.ai/docs/api-reference/calls/make)
```json
{
  "agent_id": "<uuid>",                       // required
  "recipient_phone_number": "+919876543210",  // required, E.164
  "from_phone_number": "+91...",              // optional; omit -> account default number
  "scheduled_at": "2026-10-20T03:30:00+00:00",// optional, ISO 8601 with offset
  "user_data": { "parent_name": "...", "last_call_summary": "...", "timezone": "Asia/Kolkata" },
  "agent_data": { "language": "hi" },         // OR voice_id, not both
  "retry_config": { "enabled": true, "max_retries": 2, "retry_on_statuses": ["no-answer","busy","failed"],
                    "retry_intervals_minutes": [15, 30], "retry_on_voicemail": false, "prioritize_retries": false },
  "bypass_call_guardrails": false
}
```
- ✅ The response is `{message:"done", status:"queued", execution_id}`. Common 400s: missing agent_id/recipient, or an invalid `from_phone_number` (it must be a number purchased in the account).
- ✅ `user_data` keys fill `{{var}}` (or `{var}`) in the prompt **and the welcome message**. Values can be nested JSON objects or arrays, addressed with `{{obj.field}}` / `{{arr.0.x}}`. Stringified JSON is auto-parsed. An unresolved `{{x}}` renders literally as `{x}` (visible in the transcript). [Using context](https://www.bolna.ai/docs/prompting/using-context)
- ✅ System variables injected automatically: `agent_id, execution_id, call_sid, from_number, to_number, current_date, current_time, timezone`. Date and time are also auto-appended to the system prompt. Pass `timezone:"Asia/Kolkata"` in user_data.
- ✅ The call's user_data comes back in the execution under `context_details.recipient_data`. Use this to map a webhook back to our `parent_id`.
- ✅ `POST /call/{execution_id}/stop` cancels a `queued`/`scheduled` call. [Stop call](https://www.bolna.ai/docs/api-reference/calls/stop_call)
- ✅ Retries: max 1–3. The default intervals are 30/60/120 min. [Auto-retry](https://www.bolna.ai/docs/outbound/auto-retry)
- ⚠️ `scheduled_at` on POST /call: the schema example uses `+05:30`, and AGENTS.md says a trailing `Z` is rejected with a 500. Always send a numeric offset. I did not verify whether the "≥2 min ahead / rounded to 10 min" rule (documented for batches) also applies to single calls.

## 6. Scheduling and batches
- ✅ `POST /batches` is **multipart/form-data** (`agent_id`, `file=@csv`, optional `retry_config` JSON string) and returns **201** `{batch_id, state:"created"}`. The CSV needs `contact_number` (E.164). Every other column becomes a prompt variable and is stored in `context_details.recipient_data`. [Create batch](https://www.bolna.ai/docs/api-reference/batches/create)
- ✅ `POST /batches/{batch_id}/schedule` takes form field `scheduled_at` with a numeric offset (`Z` is rejected). The time must be at least 2 min ahead and at most 30 days ahead. Bolna rounds up to the next 10-minute mark, and anything under 10 min ahead dispatches immediately. [Schedule batch](https://www.bolna.ai/docs/api-reference/batches/schedule), [Limits](https://www.bolna.ai/docs/api-reference/limits)
- ✅ `GET /batches/{batch_id}/executions` returns a **bare array**, not `{data:[...]}`.
- ✅ **Bolna has no recurring (daily) schedule.** Batches and scheduled calls are one-shot. A daily Saathi call therefore needs our own cron or scheduler, which calls POST /call (optionally with `scheduled_at`) once a day. Confirm the repo does this.

## 7. Mid-call custom tools (our backend webhooks)
✅ [Custom functions](https://www.bolna.ai/docs/tool-calling/custom-function-calls), [Schema](https://www.bolna.ai/docs/tool-calling/custom-function-schema), [Variables](https://www.bolna.ai/docs/tool-calling/custom-function-variables)
- Tools use the OpenAI function-calling format plus Bolna extensions. In the dashboard JSON, the required fields are `name`, `description`, `parameters`, `key:"custom_task"` (exactly this value) and `value:{method, url, param, api_token?, headers?}`. `pre_call_message` is optional and is what the agent says while the request runs. Saathi sets it to exactly `जी, एक सेकंड।` on `log_medicine`, `raise_alert`, `relay_message_to_family`, `save_memory_note`, and `record_consent` (never the English filler "Just give me a moment, I'll be back with you.").
- `param` maps arguments with Python format specifiers: `"dose_id":"%(dose_id)s"`, plus `%(n)i` for integers and `%(x)f` for floats. Names must match `properties` exactly (case-sensitive). Methods: GET/POST/PUT/PATCH/DELETE. `api_token` is sent as the Authorization header value (e.g. `"Bearer <secret>"`). Use it to authenticate Bolna to our backend.
- Via API (`tools_config.api_tools`): `tools: [ {name, description, parameters, pre_call_message} ]` + `tools_params: { "<name>": {url, method, param, headers} }`. The keys in `tools_params` must match `name`. (Example taken from [Graph agent tools](https://www.bolna.ai/docs/graph-agent/tools-and-rag). The OpenAPI schema itself only types the transfer tool.)
- The flow: the LLM decides to call the tool → Bolna makes the HTTP request → **whatever JSON our endpoint returns is fed back to the LLM** (no required response schema). Keep responses short and natural, e.g. `{"ok":true,"say":"Noted, thank you"}`.
- Variables that are defined in the prompt (from user_data) or are system variables (`agent_id`, `call_sid`, `from_number`, `to_number`) are **auto-substituted** into tool params, so the LLM won't ask the caller for them. So put `{{parent_id}}` in user_data and in the prompt, and map it in each tool's `param`.
- ✅ Calls come from source IPs `13.203.39.153`, `13.126.9.249`, `13.202.133.53` (shared with webhooks). If our host has an allowlist, all three must be on it.
- ✅ Optional pre-call webhook (`pre_call_webhook_param` / `pre_call_webhook_url`) fires fire-and-forget *before* the tool's main request, with the execution-shaped payload. [Pre-call webhooks](https://www.bolna.ai/docs/tool-calling/pre-call-webhooks)
- ⚠️ Not verified: (a) whether a POST tool sends `param` as a JSON body or as a query string (the docs only show a GET example as curl). Test with webhook.site first. (b) The tool timeout, and what the agent says on failure. (c) Whether `execution_id` substitutes into tool params. It is listed as a system variable for prompts, but not in the custom-function variable table. Until tested, rely on `call_sid` / `to_number` / `parent_id`.

**Planned Saathi tools vs Bolna** (from the Voice teammate; `voice/tools_schema.md` did **not** exist when I checked): `log_medicine`, `raise_alert`, `relay_message_to_family`, `save_memory_note` all fit the custom_task POST pattern above. The planned "end-of-call summary JSON" does **not** exist as a mid-call tool in Bolna. Build it from post-call **extractions** + `summary` (section 8), or as a tool the LLM calls before hanging up (that would be our design, not a Bolna feature). Note that `raise_alert` only fires if the LLM chooses to call it, so a post-call extraction backstop is still needed.

## 8. Post-call: webhook, executions, extractions
- ✅ Set the agent `webhook_url` (dashboard Extractions tab, or `PATCH agent_config.webhook_url`). Bolna POSTs the **full execution payload** on **each status change**, so one call produces several deliveries with the same `id`. Handlers must be **idempotent on `id`**. Return 200 quickly, because Bolna retries on non-2xx or timeout. [Webhooks](https://www.bolna.ai/docs/post-call/polling-call-status-webhooks), [Limits](https://www.bolna.ai/docs/api-reference/limits)
- ✅ Status lifecycle: `queued → initiated → ringing → in-progress → call-disconnected → completed`, with terminal `no-answer, busy, failed, canceled, stopped, error, balance-low` (and `scheduled`/`rescheduled` before queued). **Process only on `completed`.** At `call-disconnected`, transcript, recording, cost and extracted_data are still empty. [Get execution](https://www.bolna.ai/docs/api-reference/executions/get_execution)
- ✅ `status:"completed"` does **not** mean someone talked. Check `conversation_duration > 0`, and check that the transcript has `user:` lines. `telephony_data.hangup_reason` has the real ending. [Execution payload](https://www.bolna.ai/docs/post-call/execution-payload)
- ✅ Useful fields: `id, agent_id, batch_id, status, conversation_duration, transcript` (newline `assistant:`/`user:`), `summary` (needs `call_summary_enabled`), `extracted_data`, `telephony_data.{recording_url, hangup_reason, hangup_by, to_number, from_number, call_type}`, `context_details.recipient_data` (our user_data), `tool_call_logs`, `retry_count`, `total_cost` (**in cents**), `cost_breakdown.total_cost_to_deduct`.
- ✅ If PII masking is enabled, phone numbers, recording_url and the string values in extracted_data come back `null`.
- ✅ Polling endpoints: `GET /executions/{execution_id}`, `GET /executions/{execution_id}/log` (raw logs), and `GET /v2/agent/{agent_id}/executions` (paginated with `page_number`/`page_size`). List endpoints return a trimmed projection, so fetch by id for the full record.
- ✅ **Extractions** (the legacy `extraction`/`custom_analytics`/`agent_extraction` are removed; [migration](https://www.bolna.ai/docs/migrating-to-extractions/overview)): create with `POST /dispositions/` `{agent_id, name, question, category|category_id, model?, is_subjective, is_objective, subjective_type?(text|timestamp|numeric|boolean|email|regex), objective_options:[{value, condition}]}`. At least one of subjective/objective must be true. Categories: `POST /agent/{agent_id}/extraction-categories`. Test against a sample transcript: `POST` [Test dispositions](https://www.bolna.ai/docs/api-reference/dispositions/test). [Create disposition](https://www.bolna.ai/docs/api-reference/dispositions/create)
- ✅ Output nests as `extracted_data["<Category>"]["<Extraction>"] = {subjective, objective, confidence (0–1), confidence_label (High/Medium/Low), reasoning_subjective, reasoning_objective, validation}`. [Extraction output](https://www.bolna.ai/docs/prompting/extraction-output) → Saathi extractions would cover things like Mood (objective: good/okay/low), Red flag (objective: none/fall/chest_pain/confusion/low_mood/other), and per-medicine taken/missed. Treat Low-confidence results as "needs human check".

## 9. WhatsApp: can Bolna send one after a call?
**Yes, but only inside a Workflow (beta), and only through an AiSensy account.**
- ✅ Workflows are **beta** ("APIs … stable to build against, but details may evolve"). A workflow is a node graph: `start → agent (places the call) → extraction → api / time / retry → aisensy_whatsapp → end`. [Workflows intro](https://www.bolna.ai/docs/workflows/introduction), [Nodes](https://www.bolna.ai/docs/workflows/nodes)
- ✅ The native WhatsApp node is `aisensy_whatsapp`: `{template_name, language, recipient, variables{"1":..,"2":..}, campaign_name}`. `recipient` can be any entry field (e.g. a `child_number` column), so it does **not** have to be the person who was called. The node is **fire-and-forget**: there's no delivery status to branch on. [AiSensy WhatsApp](https://www.bolna.ai/docs/workflows/aisensy-whatsapp)
- ✅ It requires: an **AiSensy** account with a project, **a WhatsApp Business number** connected to it, and **a Meta-approved template launched as an API campaign**. The AiSensy project API key and project ID are pasted into Bolna. Template placeholders are positional and must be contiguous from 1.
- ✅ Calls made through a workflow come from the workflow's `agent` node (`POST /workflows/{id}/run` per contact, or campaigns), **not** from our own `POST /call`. Using Bolna's WhatsApp therefore means routing daily calls through a workflow.
- ✅ Other Bolna-documented route: the execution webhook → Make.com / n8n → any WhatsApp provider (the tutorial uses Whatsable). [Make.com WhatsApp](https://www.bolna.ai/docs/tutorials/make-com/send-whatsapp-after-bolna-call)
- ⚠️ Not verified: whether **trial** Bolna accounts can use Workflows or the AiSensy node. The docs say nothing either way.
- External facts (not Bolna docs):
  - AiSensy has a "Forever Free" plan (₹0/month, ₹50 conversation credits). India utility templates cost ₹0.145/msg and marketing templates ₹1.09/msg. From 1 Oct 2026, service messages are charged after 1,000 free per month. [AiSensy pricing](https://aisensy.com/pricing), [Free plan](https://wiki.aisensy.com/en/articles/11478270-aisensy-forever-free-plan-everything-you-need-to-know). ⚠️ The free plan says API campaigns and automation are "not included" until you get the WhatsApp API and start a 14-day trial, so whether automated sends stay free afterwards is unclear. AiSensy onboarding also needs a phone number for the WhatsApp Business API (normally one not already on WhatsApp) plus a Meta Business setup.
  - **Meta WhatsApp Cloud API test number:** free; no payment method needed for test messages. It sends to **up to 5 verified recipient numbers** (each verified by WhatsApp OTP, and they can't be removed). Business-initiated messages need a template (`hello_world` is pre-approved). Free-form text works inside the 24-hour window after the recipient messages the number. The "5 recipients" figure comes from guides quoting Meta's docs ([LimeChat](https://limechatai.gitbook.io/limechat-product-guide/helpdesk/inboxes/whatsapp-inboxes/cloudapi-whatsapp-inbox-setup-guide), [StackOverflow quoting Meta](https://stackoverflow.com/questions/74622031)). The 24-hour window and non-template step are on [Meta Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started), which blocks automated fetch, so I read it via curl. ⚠️ Not verified: whether custom utility templates can be approved on the test WABA in time.
  - **Twilio WhatsApp Sandbox:** each recipient must send `join <code>`. The session **expires after 3 days** (they must rejoin). Limit is 1 message per 3 s. Business-initiated messages can only use pre-approved sandbox templates, and free-form messages need the 24-hour window. [Twilio Sandbox](https://www.twilio.com/docs/whatsapp/sandbox). This is a poor fit for a daily summary.
- **Recommendation (summary for the parent):** for the demo and a small pilot, send WhatsApp **from our backend via the Meta Cloud API test number** (free; covers up to 5 child numbers). Submit one utility template on day 1 (e.g. "Saathi update for {{1}}: {{2}}"), and add an email fallback. If more than 5 recipients are needed, register a spare SIM on the same Meta app. Treat Bolna Workflow + AiSensy as an optional "uses Bolna's WhatsApp" stretch, after confirming the trial account can use Workflows.

## 10. Trial account limits
- ✅ Free trial includes **$5 in credits**. [Google Sheets tutorial](https://www.bolna.ai/docs/tutorials/google-sheets/automate-calls)
- ✅ Trial accounts can only call **verified numbers**. Add them under **User Profile → Verified Numbers**. (Same source.)
- ✅ Trial concurrency is **up to 2 simultaneous calls**, limited to verified numbers. Calls over the limit are **queued, not rejected**. Paid accounts start at 10. [Concurrency tiers](https://www.bolna.ai/docs/pricing/outbound-calling-concurrency)
- ✅ If `from_phone_number` is omitted, Bolna uses its centralized default numbers, and **callees in India see a `+91` number**. [Making calls](https://www.bolna.ai/docs/outbound/making-calls)
- ✅ Dedicated numbers cost $5/month each (Indian numbers via Plivo or Vobiz). Indian numbers need compliance (DLT/KYC, CIN-based) before use. [Compliance API](https://www.bolna.ai/docs/api-reference/compliance/overview)
- ✅ The wallet must have balance. When it runs out, executions end with status `balance-low`.
- ⚠️ Not verified: the maximum number of Verified Numbers, any per-call duration cap on trial, whether inbound calls are possible without buying a number (assume no), and how many minutes $5 actually buys.

## 11. Integration checklist (common mistakes)
1. Uses `/v2/agent`, expects **201** and reads `state`.
2. `pipelines` is an array of arrays. Sarvam languages are plain codes (`hi`), and synth `provider_config.language` is set.
3. Timestamps use a `+00:00` / `+05:30` offset, never `Z`.
4. The webhook handler is idempotent on `id`, acts only on `completed`, and checks `conversation_duration > 0`.
5. `parent_id` round-trips via `user_data` → `context_details.recipient_data` and the tool `param`.
6. Tool endpoints check a shared secret (`api_token`), respond fast with small JSON, and don't assume a POST body format until tested.
7. Daily calls come from our own scheduler (Bolna has no recurring schedule), with `retry_config` and `calling_guardrails`.
8. `call_summary_enabled: true` if the code reads `summary`. Extractions are created via `/dispositions/`, not legacy `extraction` fields.
9. During the pilot, only Verified Numbers are dialled, and nothing goes to real families without Priyansh's explicit go-ahead.

## 12. Open questions from Product (added Oct 17)
1. **Tool params with lists/objects:** NOT verified. Docs only show a GET curl example; unclear whether POST tool `param` goes as JSON body or query string, and whether nested arrays/objects survive. (Prompt `user_data` DOES accept nested objects/arrays, see section on context.) Test first on trial against webhook.site. Until then, keep tool params flat strings/numbers (e.g. `medicine_name`, `taken: "yes"|"no"`).
2. **Transcript in webhook:** VERIFIED. `transcript` field of the execution payload, newline-separated `assistant:` / `user:` lines; populated only at `status: "completed"` (empty at `call-disconnected`). Also `summary` (needs `call_summary_enabled`), `extracted_data`, `telephony_data.recording_url`.
