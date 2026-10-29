# Safety

Saathi is companionship and reminders. It is not a doctor, nurse, or emergency service. In an emergency, call **112**.

## One outbound gate

Every call, WhatsApp, email, or web push goes through `gateOutbound` in `src/lib/outbound.ts`.

- Kill switch on: nothing goes out.
- Empty target: blocked.
- Email: the address must be on `ALLOWED_EMAILS`.
- Phone: the number must be on `ALLOWED_PHONE_NUMBERS` (last ten digits may match). Mock Bolna/WhatsApp may still simulate a send; they must not hit a live partner.

Unit tests cover the gateway, allowlists, and kill switch. Add one when you add an outbound path.

## Allowlists

`ALLOWED_PHONE_NUMBERS` and `ALLOWED_EMAILS` are env-only. Empty env means nobody is allowlisted. Do not commit real numbers or inboxes.

## Kill switch

`SAATHI_KILL_SWITCH=1` stops cron, dials, and sends. `/ops` can also latch a database flag. Env `1` still wins. The switch also blocks creating a demo pharmacy handoff and Place order.

## Mock by default

Git defaults:

- `CALL_PROVIDER=simulated`
- `MOCK_BOLNA=1`
- `MOCK_WHATSAPP=1`
- `MOCK_EMAIL=1`
- `PARTNER_MODE=mock`

Do not set `MOCK_*=0`, `CALL_PROVIDER=bolna`, or `PARTNER_MODE=link` in the repo. Owner-only live flags live on the host, not in git.

## Consent and retention

- Child written consent is stored at onboarding (`child_written_v1` and the checkbox text).
- Parent voice consent is spoken on the call. Audio is not kept without that haan.
- Transcripts are deleted after `RETENTION_TRANSCRIPT_DAYS` (default 30). Summaries and quotes after `RETENTION_SUMMARY_DAYS` (default 90). Alerts may remain without her words.

## Framing

Copy and the voice prompt say Saathi is an AI helper, not a clinician. It does not diagnose, change a dose, or tell anyone to skip 112.
