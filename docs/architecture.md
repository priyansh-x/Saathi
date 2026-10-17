# Architecture

Implements [prd.md](../prd.md). If a sentence here disagrees with the PRD, the PRD wins.

## Surfaces

```
Parent  -- PSTN or web-call -->  Bolna agent -- flags + transcript --> this app
Child   -- browser ---------->  Next.js (onboard / family / call)
Child   <-- WhatsApp later --  two-line briefing
Neighbour <-- ping only on miss or emergency
```

The parent never opens this website. Judges will. Build the site for the child and for a demo of the call.

## Repo

```
prd.md                 product source of truth
docs/                  how to build it
src/app/               Next.js routes
src/components/ui/     shadcn primitives (Button, Card, Input, …)
src/lib/types.ts       household + call contracts from the PRD
```

### Routes to add (PRD §12)

| Route | Job |
| --- | --- |
| `/` | Short explanation + start / hear a call |
| `/onboard` | One household form + consent |
| `/family` | Last outcome, week strip, contacts |
| `/call` | Scripted call first; Bolna web/PSTN when keys exist |

## Data (slice 1)

No database. Persist one household and the last call in `localStorage` using the types in `src/lib/types.ts`.

Promote to a Route Handler + file/SQLite only if two browsers must share state for a live Bolna webhook.

## Voice boundary

| In this repo | In Bolna |
| --- | --- |
| Household context (names, meds, language) | Agent prompt + voice |
| “Call now” button | `POST /call` or web-call session |
| Outcome, flags, transcript display | Speech in/out, barge-in, hangup |
| Missed / retry *policy* | Actual retry + calling-hour guardrails |

Until `BOLNA_API_KEY` is set, `/call` must still walk the four outcomes with a scripted Hindi conversation and English sidecar (PRD F4–F9).

## Briefing

v1: render a WhatsApp-shaped card in `/family`.  
v2: send a real message if a provider is configured.

Never make the default briefing a full transcript.

## What not to add

- Auth, user accounts, Postgres, Redis
- A second component library
- Wearable / location / camera features
- A parent-facing mobile app
- Medical advice in the agent prompt
