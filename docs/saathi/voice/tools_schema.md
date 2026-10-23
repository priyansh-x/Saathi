# Saathi tool schemas (proposal for Engineering)

Drafted 17 Oct 2026 (IST) · v0.2 (17 Oct, 10:15 AM IST: `end_call_summary` tool removed; Bolna has no end-of-call tool. The summary now comes from post-call extraction, §5) · For the FastAPI + Supabase backend behind the Bolna agent.

Mid-call tools: `log_medicine`, `raise_alert`, `relay_message_to_family`, `save_memory_note`. After the call: **Post-call extraction spec** (§5).

## How these plug into Bolna (verified against Bolna docs, 17 Oct 2026)
- Bolna custom functions use an OpenAI-style definition (`name`, `description`, `parameters`) plus an API config (`key: "custom_task"`, `value.method`, `value.url`, `value.param`, `value.api_token`, `value.headers`). `param` maps fields with Python format specifiers: `%(name)s`, `%(n)i`, `%(x)f`. An optional `pre_call_message` is spoken while the API runs. Source: https://www.bolna.ai/docs/tool-calling/custom-function-schema
- System variables `call_sid`, `to_number`, `from_number` and `agent_id`, plus any prompt variable (e.g. `call_date`), are auto-substituted into function params, so the LLM won't ask the caller for them. Source: https://www.bolna.ai/docs/tool-calling/custom-function-variables
- **Not verified:** whether a POST tool sends `param` as a JSON body or a query string (see engineering/bolna_api_notes.md §7). All params below are flat strings, so either works. Test with webhook.site first.

## Design rules
1. **Fast and silent.** Elders are put off by dead air. Endpoints should return in under ~300 ms and do slow work (WhatsApp sends, auto-dial) asynchronously. Leave `pre_call_message` empty for `log_medicine` and `save_memory_note`. For `raise_alert`, the agent speaks its own emergency line, so `pre_call_message` stays empty too.
2. **Idempotent.** Key every write on `call_sid` + a natural key (e.g. `medicine_id`). The LLM may retry.
3. **Never block safety on a tool failure.** If `raise_alert` errors, the agent has already told the parent to call 112. The post-call extraction (§5) re-checks the transcript for red flags, and the backend compares it with `tool_call_logs` to catch alerts the tool never received (belt and braces).
4. **Auth.** One Bearer token per environment in `api_token`. Rotate it after the hackathon. Don't commit it.
5. Base URL placeholder: `https://api.saathi.example/v1` (replace).

---

## 1. `log_medicine`
Logs one dose per call. The agent calls it once for every dose in today's `{{medicines}}` list.

```json
{
  "name": "log_medicine",
  "description": "Log whether the parent took ONE scheduled medicine dose today. Call exactly once per dose in today's medicine list, right after the parent answers. status: 'taken' = clear yes; 'not_taken' = clear no / forgot / ran out / stopped; 'unsure' = can't remember, contradictory, or dose not yet due. Put the parent's own words in parent_quote.",
  "pre_call_message": "",
  "parameters": {
    "type": "object",
    "properties": {
      "medicine_id":   {"type": "string", "description": "The id= value from today's medicine list, e.g. med_telma_am"},
      "medicine_name": {"type": "string", "description": "Medicine name as in the list, e.g. Telma 40"},
      "scheduled_time":{"type": "string", "description": "Scheduled time as in the list, e.g. 'subah 8 baje'"},
      "status":        {"type": "string", "enum": ["taken", "not_taken", "unsure"]},
      "reason":        {"type": "string", "description": "Optional short reason in English: forgot / ran_out / doctor_stopped / not_yet_due / side_effect_reported / other. Empty if taken."},
      "parent_quote":  {"type": "string", "description": "Parent's exact words, original language"},
      "call_sid":      {"type": "string"},
      "call_date":     {"type": "string"}
    },
    "required": ["medicine_id", "medicine_name", "status", "parent_quote", "call_sid", "call_date"]
  },
  "key": "custom_task",
  "value": {
    "method": "POST",
    "url": "https://api.saathi.example/v1/medicine-log",
    "api_token": "Bearer <BOLNA_TOOL_TOKEN>",
    "headers": {"Content-Type": "application/json"},
    "param": {
      "medicine_id": "%(medicine_id)s",
      "medicine_name": "%(medicine_name)s",
      "scheduled_time": "%(scheduled_time)s",
      "status": "%(status)s",
      "reason": "%(reason)s",
      "parent_quote": "%(parent_quote)s",
      "call_sid": "%(call_sid)s",
      "call_date": "%(call_date)s",
      "to_number": "%(to_number)s"
    }
  }
}
```
Response: `{"ok": true}`. Backend: upsert on (`call_sid`, `medicine_id`). Compute the "2+ consecutive days not_taken/unsure" rule here and raise an URGENT `missed_medicine` alert server-side.

**Note:** if a parent reports a side effect ("is goli se chakkar aata hai", "this tablet makes me dizzy"), log the dose as usual with `reason: side_effect_reported`. The agent also relays it (and raises an alert if it's a red-flag symptom). It never tells them to stop.

---

## 2. `raise_alert`
```json
{
  "name": "raise_alert",
  "description": "Raise a safety alert to the family. Call IMMEDIATELY when you hear an EMERGENCY or URGENT red flag (see prompt), before or while speaking the instruction. severity EMERGENCY: chest_pain, breathlessness, fall_injury, stroke_signs, unresponsive, suicidal_talk. severity URGENT: fall_no_injury, confusion, missed_medicine, fever, not_eating, low_mood (hopeless, no intent), scam_risk. quote must be the exact words of the parent or the person reporting. When unsure of tier, choose the higher one. Max one alert per category per call unless severity increases.",
  "pre_call_message": "",
  "parameters": {
    "type": "object",
    "properties": {
      "severity": {"type": "string", "enum": ["EMERGENCY", "URGENT"]},
      "category": {"type": "string", "enum": ["chest_pain","breathlessness","fall_injury","stroke_signs","unresponsive","suicidal_talk","fall_no_injury","confusion","missed_medicine","fever","not_eating","low_mood","scam_risk"]},
      "quote":    {"type": "string", "description": "Exact words heard, original language"},
      "speaker":  {"type": "string", "enum": ["parent", "other_person"], "description": "Who said it"},
      "details":  {"type": "string", "description": "One short English line of context, no diagnosis. e.g. 'Says chest heavy since morning, alone at home'"},
      "call_sid": {"type": "string"},
      "call_date":{"type": "string"}
    },
    "required": ["severity", "category", "quote", "speaker", "call_sid"]
  },
  "key": "custom_task",
  "value": {
    "method": "POST",
    "url": "https://api.saathi.example/v1/alerts",
    "api_token": "Bearer <BOLNA_TOOL_TOKEN>",
    "headers": {"Content-Type": "application/json"},
    "param": {
      "severity": "%(severity)s",
      "category": "%(category)s",
      "quote": "%(quote)s",
      "speaker": "%(speaker)s",
      "details": "%(details)s",
      "call_sid": "%(call_sid)s",
      "call_date": "%(call_date)s",
      "to_number": "%(to_number)s"
    }
  }
}
```
Response: `{"ok": true, "alert_id": "..."}`. Backend behaviour (proposal):
| Severity | Action |
|---|---|
| EMERGENCY | Instant WhatsApp to all family contacts: "🚨 Saathi: {parent} said: "{quote}" ({category}) at {time IST}. Saathi told them to call 112. Please call them now." Plus an **automatic outbound call** to the primary child (a Bolna call with a short "alert" agent), falling back to the second contact if there's no answer within ~2 min. Show it on the dashboard. |
| URGENT | WhatsApp to the primary child within minutes: "⚠️ Saathi: {parent} mentioned {category}: "{quote}". Please check in today." |
Optional: Bolna's built-in call-transfer tool could live-transfer an EMERGENCY call to the child's number. Decide after testing; it must never block the 112 instruction.

The WhatsApp alert text above is a template draft. Sending from a WhatsApp Business number needs approved templates. Engineering to confirm the WhatsApp route (Bolna Workflows beta vs a direct provider).

---

## 3. `relay_message_to_family`
```json
{
  "name": "relay_message_to_family",
  "description": "Pass a request or message from the parent to their family, e.g. 'tell my son to call me', 'tell Rohit there's pension work', 'ask bahu to bring medicine', or a medical question the parent wants checked with the doctor. Confirm with the parent first, by repeating the message back, then call this.",
  "pre_call_message": "",
  "parameters": {
    "type": "object",
    "properties": {
      "recipient":    {"type": "string", "description": "Who it's for as the parent said it, e.g. 'Rohit', 'beta', 'bahu', 'any family'. Use {{child_name}} if unspecified."},
      "request_type": {"type": "string", "enum": ["call_back", "errand", "medical_question", "emotional", "information", "other"]},
      "message":      {"type": "string", "description": "Short message in simple English for the family, e.g. 'Please call Mummy this evening.'"},
      "parent_quote": {"type": "string", "description": "Parent's exact words, original language"},
      "urgency":      {"type": "string", "enum": ["normal", "today"], "description": "'today' if the parent says aaj hi/jaldi or it's time-bound"},
      "call_sid":     {"type": "string"}
    },
    "required": ["recipient", "request_type", "message", "parent_quote", "urgency", "call_sid"]
  },
  "key": "custom_task",
  "value": {
    "method": "POST",
    "url": "https://api.saathi.example/v1/relay",
    "api_token": "Bearer <BOLNA_TOOL_TOKEN>",
    "headers": {"Content-Type": "application/json"},
    "param": {
      "recipient": "%(recipient)s",
      "request_type": "%(request_type)s",
      "message": "%(message)s",
      "parent_quote": "%(parent_quote)s",
      "urgency": "%(urgency)s",
      "call_sid": "%(call_sid)s",
      "to_number": "%(to_number)s"
    }
  }
}
```
Backend: map `recipient` to a contact (fall back to the primary child). `today` → send right away; `normal` → include it in the daily summary *and* send a short WhatsApp right away. A relayed request is never an alert.

---

## 4. `save_memory_note`
```json
{
  "name": "save_memory_note",
  "description": "Save one short fact worth remembering for future calls: family events, health mentions (non-urgent), routine, preferences (language, address term, call time), interests. Not for trivial chatter. Never mention to the parent that you are saving.",
  "pre_call_message": "",
  "parameters": {
    "type": "object",
    "properties": {
      "category":  {"type": "string", "enum": ["family", "health", "routine", "preference", "interest", "upcoming_event", "other"]},
      "note":      {"type": "string", "description": "One English sentence, factual, in the parent's framing. e.g. 'Granddaughter Pihu has a maths exam on Monday 19 Oct.'"},
      "follow_up_date": {"type": "string", "description": "Optional YYYY-MM-DD to bring it up again (e.g. day after an event)"},
      "parent_quote":   {"type": "string", "description": "Optional, parent's words"},
      "call_sid":  {"type": "string"}
    },
    "required": ["category", "note", "call_sid"]
  },
  "key": "custom_task",
  "value": {
    "method": "POST",
    "url": "https://api.saathi.example/v1/memory",
    "api_token": "Bearer <BOLNA_TOOL_TOKEN>",
    "headers": {"Content-Type": "application/json"},
    "param": {
      "category": "%(category)s",
      "note": "%(note)s",
      "follow_up_date": "%(follow_up_date)s",
      "parent_quote": "%(parent_quote)s",
      "call_sid": "%(call_sid)s",
      "to_number": "%(to_number)s"
    }
  }
}
```
Backend: the next call's `{{last_call_summary}}` = last call's summary + open memory notes (follow-ups due today first), trimmed to ~800 characters. `preference` notes about language, address term or call time should update the parent profile **only after** a family member confirms on the dashboard (avoids one misheard turn flipping the setup).

---

## 4b. `save_family_reply`
```json
{
  "name": "save_family_reply",
  "description": "Save the parent's spoken reply to the family message for the desk. Call once after they answer. Do not promise when the child will see it.",
  "pre_call_message": "",
  "parameters": {
    "type": "object",
    "properties": {
      "family_message_id": {"type": "string"},
      "reply": {"type": "string", "description": "Parent's reply, original language, verbatim"},
      "call_sid": {"type": "string"},
      "parent_id": {"type": "string"}
    },
    "required": ["family_message_id", "reply", "call_sid", "parent_id"]
  },
  "key": "custom_task",
  "value": {
    "method": "POST",
    "url": "https://api.saathi.example/v1/family-reply",
    "api_token": "Bearer <BOLNA_TOOL_TOKEN>",
    "headers": {"Content-Type": "application/json"},
    "param": {
      "family_message_id": "%(family_message_id)s",
      "reply": "%(reply)s",
      "call_sid": "%(call_sid)s",
      "parent_id": "%(parent_id)s",
      "to_number": "%(to_number)s"
    }
  }
}
```

## 4c. `family_message_played`
```json
{
  "name": "family_message_played",
  "description": "Mark that the family message line was spoken on this connected call. Call once after you read the message verbatim.",
  "pre_call_message": "",
  "parameters": {
    "type": "object",
    "properties": {
      "family_message_id": {"type": "string"},
      "call_sid": {"type": "string"},
      "parent_id": {"type": "string"}
    },
    "required": ["family_message_id", "call_sid", "parent_id"]
  },
  "key": "custom_task",
  "value": {
    "method": "POST",
    "url": "https://api.saathi.example/v1/family-message-played",
    "api_token": "Bearer <BOLNA_TOOL_TOKEN>",
    "headers": {"Content-Type": "application/json"},
    "param": {
      "family_message_id": "%(family_message_id)s",
      "call_sid": "%(call_sid)s",
      "parent_id": "%(parent_id)s",
      "to_number": "%(to_number)s"
    }
  }
}
```

---

## 5. Post-call extraction spec (replaces the old `end_call_summary` tool)

Bolna has **no end-of-call tool**. The call summary is built **after** the call, from Bolna **extractions** (`POST /dispositions/`) run over the call record's `transcript`. The transcript is newline-separated `assistant:` / `user:` lines and is only filled once `status` is `completed` (engineering/bolna_api_notes.md §8).

### How it fits together
1. Create one extraction **category** per group below (`POST /agent/{agent_id}/extraction-categories`), then one **disposition** per field (`POST /dispositions/`). The body format comes from bolna_api_notes.md §8: `{agent_id, name, question, category, is_subjective, is_objective, subjective_type, objective_options:[{value, condition}]}`.
2. Bolna returns `extracted_data["<Category>"]["<Name>"] = {subjective, objective, confidence, confidence_label, reasoning_subjective, reasoning_objective, validation}`.
3. The webhook handler acts **only on `status: "completed"`** and is idempotent on `id`. It also needs `conversation_duration > 0` and at least one `user:` line in `transcript`; otherwise it sets `call_outcome = "no_conversation"` and skips the extractions.
4. The backend assembles the **summary JSON** (same fields as before, below) from `extracted_data`, the mid-call tool tables, and `tool_call_logs`. It then renders the family WhatsApp and builds the next call's `{{last_call_summary}}`.
5. **Source of truth:** mid-call tool rows (`log_medicine`, `raise_alert`, `relay_message_to_family`) win for medicines, alerts and relays. The extraction is the **backstop** for anything the LLM forgot to log. If the extraction finds an EMERGENCY/URGENT red flag with no matching `raise_alert` in `tool_call_logs`, the backend raises it now, marked `late: true` (post-call), and the dashboard shows it as missed live.
6. `confidence_label: "Low"` on any Safety or Medicines field → mark "needs human check" on the dashboard; never drop it silently.
7. Optional: `call_summary_enabled: true` fills Bolna's own free-text `summary`. Store it for the team, but the family message uses the structured fields.

⚠️ Not verified (test with `POST` Test dispositions on a sample transcript before the pilot):
- whether an extraction `question` can reference `{{user_data}}` variables (e.g. the medicine list). The spec below **doesn't rely on it**; it reads medicine names from the transcript.
- whether an objective extraction can return several values; the spec assumes **one** value and puts the full list in the subjective text.
- whether a subjective `text` answer reliably keeps the requested line format; the backend parser must be tolerant.

### Writing rules for every extraction question (included in each `question`)
"Use only what is said in this call transcript. 'assistant' is Saathi (the AI caller); 'user' is the person who answered. Do not guess or add medical interpretation. Quote the user's exact words in their original language."

### Summary fields → extractions

| Summary field | Category | Extraction `name` | Type | Plain extraction instruction (`question`) | `objective_options` (value: condition) |
|---|---|---|---|---|---|
| `call_outcome` | Call | `call_outcome` | objective | Which best describes how this call went? | `completed`: the parent talked with Saathi and the call ended normally · `callback_requested`: the parent asked Saathi to call back later · `parent_unavailable`: someone else answered and said the parent isn't available · `wrong_person`: someone other than the parent talked and the parent never came on · `wrong_number`: the person said this is the wrong number or doesn't know the parent · `emergency_cut_short`: the call stopped or changed course because of an emergency · `dropped`: the call ended suddenly mid-conversation with no goodbye |
| `language_used` | Call | `language_used` | subjective (text) | List the languages the user actually spoke in this call, as short codes separated by commas (hi, en, kn, ta, te, mr, bn, gu, pa, ml). Count Hindi mixed with English words as hi. | n/a |
| `language_switch_requested` | Call | `language_switch_requested` | subjective (text) | Did the user ask Saathi to speak a different language? If yes, give the language code (e.g. kn); if no, answer none. | n/a |
| `mood` | Wellbeing | `mood` | objective + subjective (text) | How did the parent seem overall in this call, based on their own words? In the text answer, quote the user's words that show it. | `good`: cheerful, positive, or says they're fine and engaged · `okay`: neutral, nothing notable · `low`: sad, low, lonely, tired of life, uninterested · `distressed`: frightened, in pain, panicking or very upset · `unclear`: too short, or not the parent |
| `mood_evidence_quote` | Wellbeing | (from `mood`) | n/a | Taken from the `mood` subjective answer | n/a |
| `watch_flags` (low_mood) | Wellbeing | `watch_low_mood` | objective + subjective (text) | Did the parent say they feel sad, low, uninterested or "mann nahi lagta"? If yes, quote their words. | `yes`: they said so · `no`: they did not |
| `watch_flags` (loneliness) | Wellbeing | `watch_loneliness` | objective + subjective (text) | Did the parent say they feel lonely, alone all day, or that no one talks to or visits them? If yes, quote their words. | `yes` · `no` |
| `watch_flags` (poor_sleep) | Wellbeing | `watch_poor_sleep` | objective + subjective (text) | Did the parent say they slept badly, can't sleep, or wake up at night? If yes, quote their words. | `yes` · `no` |
| `medicines_logged` | Medicines | `medicines_status` | subjective (text) | For every medicine Saathi asked about, write one line: `<medicine name as Saathi said it> = taken / not_taken / unsure / not_asked`, then ` / reason: forgot / ran_out / doctor_stopped / not_yet_due / side_effect / none`, then ` / quote: "<user's words>"`. taken = a clear yes; not_taken = a clear no, forgot or ran out; unsure = can't remember, unclear, or the dose isn't due yet. Write `none` if no medicines were discussed. | n/a |
| (backstop) | Medicines | `medicine_ran_out_or_missed_days` | objective + subjective (text) | Did the parent say a medicine has run out, or that they haven't taken a medicine for two or more days? Quote their words. | `yes` · `no` |
| `alerts_raised` (emergency) | Safety | `emergency_red_flag` | objective + subjective (text) | Did the user (the parent or anyone else) mention any of these? Chest pain or heaviness; difficulty breathing; a fall with injury or can't get up; face drooping, one-sided weakness or numbness, sudden trouble speaking or seeing; fainting or not responding; wanting to die or to harm themselves. Pick the most serious one; in the text answer, list every one mentioned with the exact quote. | `none` · `chest_pain` · `breathlessness` · `fall_injury` · `stroke_signs` · `unresponsive` · `suicidal_talk` (each: the user described that problem as above) |
| `alerts_raised` (urgent) | Safety | `urgent_red_flag` | objective + subjective (text) | Did the user mention any of these? A fall without injury; unusual confusion about day, place or people; a medicine missed two or more days or run out; fever; not eating for about a day or more; someone asking for an OTP, bank details or money. Pick the most important one; in the text answer, list every one with the exact quote. | `none` · `fall_no_injury` · `confusion` · `missed_medicine` · `fever` · `not_eating` · `scam_risk` |
| `requests_relayed` | Requests | `family_requests` | subjective (text) | List each thing the parent asked Saathi to tell or ask a family member, one per line: `<who> : <the request in simple English> : "<user's words>"`. Write `none` if there were none. | n/a |
| `medical_questions_deflected` | Requests | `medical_questions` | subjective (text) | List each question the parent asked about medicines, doses, symptoms or treatment, one per line, as the user's exact words. Write `none` if there were none. | n/a |
| `highlights` | Family summary | `highlights` | subjective (text) | Write up to 3 short, warm, factual English lines a son or daughter would like to know about their parent's day (e.g. "Went for a 10-minute walk with neighbour Sushila ji"). Only facts the parent said. No medical opinions. | n/a |
| `suggested_follow_up_next_call` | Family summary | `follow_up_next_call` | subjective (text) | List up to 3 things Saathi should ask about on the next call, based on what the parent said (e.g. "Ask how Pihu's exam went"). Write `none` if nothing. | n/a |
| `callback_time_requested` | Family summary | `callback_time` | subjective (text) | Did the parent or the person who answered ask Saathi to call back at a particular time? If yes, give the time exactly as they said it (e.g. "shaam 6 baje"); if no, answer none. | n/a |
| `notes_for_team` | Call | `notes_for_team` | subjective (text) | Note any problems with the call itself: the user couldn't hear or understand Saathi, Saathi misunderstood the user, the user said the call is too long or at a bad time, or audio issues. Write `none` if there were none. | n/a |

Deliberately **not** extracted: anything that needs a diagnosis, and memory notes (those come from `save_memory_note` during the call).

### Example `POST /dispositions/` bodies
Field names are as in bolna_api_notes.md §8. Replace `<AGENT_ID>`. Category names must match the categories created first. The shared writing rule is prepended to each `question`.

```json
[
  {
    "agent_id": "<AGENT_ID>",
    "name": "call_outcome",
    "category": "Call",
    "question": "Use only what is said in this call transcript. 'assistant' is Saathi (the AI caller); 'user' is the person who answered. Do not guess or add medical interpretation. Which best describes how this call went?",
    "is_subjective": false,
    "is_objective": true,
    "objective_options": [
      {"value": "completed", "condition": "The parent talked with Saathi and the call ended normally"},
      {"value": "callback_requested", "condition": "The parent asked Saathi to call back later"},
      {"value": "parent_unavailable", "condition": "Someone else answered and said the parent is not available"},
      {"value": "wrong_person", "condition": "Someone other than the parent talked and the parent never came on"},
      {"value": "wrong_number", "condition": "The person said it is the wrong number or does not know the parent"},
      {"value": "emergency_cut_short", "condition": "The call stopped or changed course because of an emergency"},
      {"value": "dropped", "condition": "The call ended suddenly mid-conversation with no goodbye"}
    ]
  },
  {
    "agent_id": "<AGENT_ID>",
    "name": "emergency_red_flag",
    "category": "Safety",
    "question": "Use only what is said in this call transcript. 'assistant' is Saathi (the AI caller); 'user' is the person who answered. Do not guess or add medical interpretation. Quote the user's exact words in their original language. Did the user (the parent or anyone else) mention any of these: chest pain or heaviness; difficulty breathing; a fall with injury or cannot get up; face drooping, one-sided weakness or numbness, sudden trouble speaking or seeing; fainting or not responding; wanting to die or to harm themselves? Pick the most serious one. In the text answer, list every one mentioned with the exact quote, or write none.",
    "is_subjective": true,
    "is_objective": true,
    "subjective_type": "text",
    "objective_options": [
      {"value": "none", "condition": "None of these were mentioned"},
      {"value": "chest_pain", "condition": "The user described chest pain, heaviness or tightness"},
      {"value": "breathlessness", "condition": "The user described difficulty breathing or breathlessness"},
      {"value": "fall_injury", "condition": "The user described a fall with injury, bleeding, a head hit, or not being able to get up"},
      {"value": "stroke_signs", "condition": "The user described face drooping, one-sided weakness or numbness, sudden trouble speaking or seeing, or a sudden severe headache"},
      {"value": "unresponsive", "condition": "Someone said the parent fainted or is not responding, or the parent stopped responding after saying they felt unwell"},
      {"value": "suicidal_talk", "condition": "The user said they want to die or harm themselves, with intent, a plan or hopelessness"}
    ]
  },
  {
    "agent_id": "<AGENT_ID>",
    "name": "medicines_status",
    "category": "Medicines",
    "question": "Use only what is said in this call transcript. 'assistant' is Saathi (the AI caller); 'user' is the person who answered. For every medicine Saathi asked about, write one line: <medicine name as Saathi said it> = taken / not_taken / unsure / not_asked / reason: forgot / ran_out / doctor_stopped / not_yet_due / side_effect / none / quote: \"<user's exact words>\". taken = a clear yes; not_taken = a clear no, forgot or ran out; unsure = can't remember, unclear, or the dose isn't due yet. Write none if no medicines were discussed.",
    "is_subjective": true,
    "is_objective": false,
    "subjective_type": "text"
  }
]
```
The other dispositions follow the same pattern from the table. Objective-only → `is_subjective:false`; text-only → `is_objective:false, subjective_type:"text"`; both → both true.

### Assembled summary JSON (backend output, same fields as before)
```json
{
  "call_outcome": "completed | callback_requested | parent_unavailable | wrong_person | wrong_number | emergency_cut_short | dropped | no_conversation",
  "language_used": ["hi", "en"],
  "language_switch_requested": "kn | ta | ... | null",
  "mood": "good | okay | low | distressed | unclear",
  "mood_evidence_quote": "string, parent's words",
  "medicines_logged": [
    {"medicine_id": "med_telma_am", "status": "taken | not_taken | unsure", "reason": "string|null", "source": "tool | extraction"}
  ],
  "alerts_raised": [
    {"severity": "EMERGENCY | URGENT", "category": "string", "quote": "string", "source": "tool | extraction_late"}
  ],
  "watch_flags": [
    {"flag": "low_mood | loneliness | poor_sleep", "quote": "string"}
  ],
  "requests_relayed": [
    {"recipient": "string", "message": "string", "source": "tool | extraction"}
  ],
  "medical_questions_deflected": ["string, parent's words"],
  "highlights": ["max 3 short English lines"],
  "suggested_follow_up_next_call": ["string"],
  "callback_time_requested": "string|null",
  "notes_for_team": "string|null",
  "needs_human_check": ["extraction names with Low confidence"]
}
```
Mapping notes:
- `medicines_logged` starts from the `log_medicine` rows for this `call_sid`. Any dose in today's list with no row is filled from the `medicines_status` lines (matched by name, fuzzy), with `source: "extraction"`. Doses still unmatched → `unsure`.
- `requests_relayed`: `family_requests` lines with no matching `relay_message_to_family` call are sent to the family now, marked as caught after the call.
- `language_switch_requested` / `callback_time_requested`: the answer `none` → `null`.
- The next call's `{{last_call_summary}}` is built from `highlights` + `suggested_follow_up_next_call` + open memory notes, at most ~800 characters.

### Daily WhatsApp to the child (template draft, for Priyansh to approve)
> Saathi daily update: {parent}, {date}
> 🙂 Mood: {mood}
> 💊 Medicines: {taken}/{total} taken{; not taken: names}
> 💬 {highlights}
> 📞 Requests: {requests_relayed}
> 👀 Keep an eye on: {watch_flags}
