# Child onboarding

Status: family sign-up on `/onboard` (prompt 07 A1).  
Surface: **child**. Parent stays on the phone they already have.

## Flow

Email sign-in (mock session when `MOCK_WHATSAPP=1`; Supabase Auth magic link in production) → you (name, WhatsApp) → parent (name, address term, phone, languages, city) → morning call time → medicines (optional) → neighbour (optional) → written consent → done with tomorrow’s time and a desk link.

Progress is kept in `sessionStorage`. `POST /api/onboard` requires the email session cookie.

## Rules

- Phones stored as E.164 (`+91…`). Validated with zod.
- `consent_status = pending`. Child written consent stores who, when, `child_written_v1`, and the exact checkbox text.
- New families are **never dialled** unless the parent number is on `ALLOWED_PHONE_NUMBERS` (the EXAMPLE household can still mock-call).
- Neighbour is optional; they are not messaged until A4 opt-in.
