# WhatsApp templates

Priyansh submits Utility templates (~21 Oct). Until approval, send `hello_world` on the Meta test number, and email fallback.

All copy is companionship / reminder framing. No diagnosis. No dose advice.

Fixture names for examples: **Kamla Sharma** (parent), **Rohit** (child), **Sunita ji** (neighbour).

## daily_briefing_en / daily_briefing_hi

Body (EN):

> Saathi called {{1}} this morning ({{2}} IST).
> Status: {{3}}
> Medicines: {{4}}
> She said: "{{5}}"
> Open today: {{6}}

`{{3}}` is Good / Needs a look / Act now.  
`{{5}}` is a short quote, or “—” if none.  
`{{6}}` is the magic-link URL (no PII in the path except the opaque token).

## safety_alert_en / safety_alert_hi

> Act now. {{1}} said: "{{2}}" at {{3}} IST.
> {{4}} and {{5}} were notified.
> Reply if you are going. Details: {{6}}

## responder_en / responder_hi

To the neighbour after opt-in YES.

> {{1}} may need someone at the door. {{2}} at {{3}} IST.
> Quick replies: I'm going | Can't right now

## alert_ack_update_en / alert_ack_update_hi

Broadcast after first ack.

> {{1}} is on it ({{2}}). Saathi will not keep pinging.

## hello_world

Meta sample until Utility approval.

## Rules

- Log every outbound row in `outbound_messages`.
- First ack wins; later taps are no-ops.
- Never send to a number outside `ALLOWED_PHONE_NUMBERS`.
