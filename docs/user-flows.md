# User flows to implement

Detailed narrative lives in [prd.md](../prd.md) §9. This file is the build checklist.

## 1. First-run

1. `/` → Start  
2. `/onboard` — child name, child WhatsApp, parent name, relation word, parent phone, city, language, call time, medicines (plain text), neighbour name + phone  
3. Required: parent has agreed to be called  
4. Save household → `/family` empty state: “No call yet. Next window 08:30. Call now.”

Empty state is mandatory. Do not seed a fake “all fine” day on first visit.

## 2. Happy path (OK)

1. `/family` or `/call` → Call now  
2. Play beats: hello → sleep → named tablet → body → who is coming → close  
3. Parent (or judge) picks replies that set `meds_taken` + `well`  
4. `/family` shows **OK** and a two-line briefing  

## 3. Watch

Same as happy path, but a reply sets `meds_skipped` or `pain` or `lonely`.  
Briefing starts with **WATCH** and names the flag.

## 4. Emergency

A reply sets `fall` (or equivalent).  
Stop the scripted small-talk. Show sit-down language. Briefing is **EMERGENCY** to child **and** neighbour.

## 5. Missed

On `/call`, a control: “Let it ring.”  
Retry copy (15 min) then **MISSED** ping to child + neighbour: please knock.

## 6. Pause

On `/family`, pause calling. Desk explains the parent will not be called until resumed.

## UI states every screen needs

| Screen | Empty | In progress | Error |
| --- | --- | --- | --- |
| `/onboard` | blank form | saving | validation (phone, consent) |
| `/call` | idle / ringing | mid-conversation | voice failed → stay on script |
| `/family` | no calls yet | — | “couldn’t load household → set up” |

## Languages

Ship Hindi audio/text first with English under every line so a judge who does not speak Hindi can still follow. A second language is Should, not Must.
