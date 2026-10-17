# UX spec

## Who uses what

| Person | Interface | They never… |
| --- | --- | --- |
| Parent (Maa) | A ringing phone they already own | Install an app, learn a dashboard |
| Child (buyer) | WhatsApp first; thin magic-link web view | Manage a care-ops cockpit |
| Neighbour | One opt-in YES, then alerts with 2 quick replies | Get daily wellness spam |

## Defaults (config-backed; Priyansh can flip)

- `BRIEFING_CHANNEL=whatsapp`
- `FAMILY_WEB=magic_link`
- `NEIGHBOUR_FLOW=simple_opt_in`
- `LANGUAGES=hi,en`
- `PRODUCT_NAME=Saathi`

## Parent call (2–5 minutes)

Warm chat. Remember past calls. Ask about each medicine due today and log it. Listen for red flags (fall, chest pain, confusion, low mood). Never diagnose. Never advise a dose.

## Child: Today in under 3 seconds

1. Status card (Good / Needs a look / Act now).
2. Call answered?
3. Meds per dose: Taken ✓ / Not taken – / Not sure ? / Not asked yet ·
4. Mood in **her words**, quoted. Never a diagnosis.
5. One next action: `Call Maa` as `tel:` with the number shown.

## Missed-call ladder (timings per-family config)

T → +10 → +25 (Bolna retries, max 3) → soft notice to child at +30 → last try +45 → neighbour + child at +60 if nobody acked.

Busy/declined ≠ unreachable.

**EMERGENCY:** alert child + neighbour at once.

## Alert states

- **Acknowledged:** someone is on it (`I'm going`).
- **Resolved:** she is confirmed OK.

Keep these separate. First ack wins.

## History

7 / 30 day calendar. Dot per day for call and meds. Simple mood-dot strip.

Caption: “Saathi's rough read of how Maa sounded… Not a medical assessment.”

No streaks. No guilt copy.

## Call detail

Short summary, meds checklist, transcript collapsed, audio only if she consented to recording.

## Settings (read-only in Phase 1)

Parent number (masked), languages, call window, neighbour, pause. Edit later.

## Onboarding

Child name + WhatsApp, parent name + relation word + phone + city + languages, call time, medicines as structured doses (plain language + meal), neighbour, **parent consent**. Fictional demo labelled EXAMPLE.

## Empty / loading / error

Every screen. Error never pretends WhatsApp is down if the web view is.

## Accessibility

See `cursor_design_brief.md`. 200% zoom. 44 px targets. EN/हिं toggle on every family screen.
