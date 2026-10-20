# Child onboarding

Status: family sign-up on `/onboard` (prompt 07 A1).  
Surface: **child**. Parent stays on the phone they already have.

## Flow

Email sign-in (mock session on local Next; emailed code when mail is configured) → you (name, WhatsApp) → parent (name, address term, phone, languages, city) → morning call time → medicines (optional) → neighbour (optional) → written consent → done with tomorrow’s time and a desk link.

If email sign-in is not configured on the host, setup still continues with the address they typed. `POST /api/onboard` uses the session cookie when present, otherwise a valid `email` field on the body, and mints a session cookie for that owner.

## Rules

- Phones stored as E.164 (`+91…`). Validated with zod.
- `consent_status = pending`. Child written consent stores who, when, `child_written_v1`, and the exact checkbox text.
- New families are **never dialled** unless the parent number is on `ALLOWED_PHONE_NUMBERS` (the EXAMPLE household can still mock-call).
- Neighbour is optional; they are not messaged until A4 opt-in.
