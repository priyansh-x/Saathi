# Call context (`buildCallContext`)

Saathi fills Bolna `user_data` from the parent record at call time. The Voice prompt in `docs/saathi/voice/system_prompt_bolna.md` (between BEGIN/END PROMPT) owns the `{placeholder}` / `{{placeholder}}` names. Engineering must send a string for every one of them.

`buildCallContext(parentId)` is the single builder. `POST /call` sends its return value as `user_data`. Tests parse the prompt and fail if a token is missing.

## Fields

| Key | Source |
| --- | --- |
| `parent_name` | `parents.first_name` |
| `address_term` | `parents.address_term`, else `{first_name} ji` |
| `preferred_language` | first code in `parents.languages` (`hi` → Hindi) |
| `child_name` | first child contact |
| `child_relation` | `beta` until Product stores a relation |
| `neighbour_name` | opted-in neighbour first name, else empty |
| `neighbour_present` | `yes` if an opted-in neighbour exists, else `no` |
| `consent_state` | `pending` / `given` / `declined` |
| `consent_line_hi` / `consent_line_en` | Product lines from `consent_line.md`, names filled |
| `medicines` | doses due today, one numbered line each |
| `medicines_due_today` | the same doses as one flat string |
| `last_call_summary` / `call_memory` | last three post-consent calls, cap 600 characters; `first call` before consent |
| `call_date` | IST header date |
| `call_time` | `parents.call_time` |
| `timezone` | `Asia/Kolkata` |
| `agent_gender` | `female` |
| `parent_id` | round-trips on tools |
| `errand_followup` | spoken line when a demo refill is delivered and the parent has not been asked yet; else empty |

Bolna also injects system variables (`call_sid`, `to_number`, `current_date`, …). Do not put secrets in `user_data`.

## EXAMPLE

Tests use the EXAMPLE Kamla household (`parent_kamla`). That data is labelled EXAMPLE in seed and must not be treated as a real family.
