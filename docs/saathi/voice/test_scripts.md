# Test scripts

**Fixture (use everywhere; is_example=true):**

- Parent: **Kamla Sharma**, 72, Delhi, Hindi+English, phone in allowlist only
- Child: **Rohit**, Bengaluru / abroad, WhatsApp
- Neighbour: **Sunita ji**
- Meds: Amlodipine 5mg after breakfast (small white); Metformin 500mg after lunch
- Call window: 08:30 IST

Do not call a real parent without Priyansh’s go-ahead.

## Script A — Good morning

Sleep ok. Took Amlodipine. Metformin not yet (lunch). “Neend theek thi.” No flags.  
Expect: Good, one taken, one not asked, briefing.

## Script B — Needs a look (skipped tablet)

Forgot Amlodipine, will take now. Knee pain.  
Expect: Watch / Needs a look, dose not_taken, afternoon follow-up note.

## Script C — Act now (chest pain)

“Seene mein dard ho raha hai.” Sit down. `raise_alert` EMERGENCY.  
Expect: Act-now banner, child + neighbour notified, quote stored.

## Script D — Fall

Bathroom slip, got up, scared. EMERGENCY.

## Script E — Missed

No answer. Ladder T, +10, +25. Soft notice +30. Last try +45. Neighbour + child +60 if no ack.

## Script F — Stop

“Mat call karna.” Memory note `stop`. Pause family.

## Live trial (Phase 2)

≤3 min, Priyansh’s verified number only, `ALLOWED_PHONE_NUMBERS`.
