# Dashboard spec (family web view)

Route: `/d/[token]` — signed random token, 7-day expiry. No login.

## Tabs

| Tab | Route | Job |
| --- | --- | --- |
| Today | `/d/[token]` | Status of this IST morning |
| History | `/d/[token]/history` | 7 / 30 day calendar |
| Alerts | `/d/[token]/alerts` | Open, acked, resolved |
| Settings | `/d/[token]/settings` | Read-only household |

Also: `/d/[token]/calls/[callId]`, `/d/[token]/alerts/[alertId]`.

## Act-now banner

If any unresolved Act-now alert exists, pin a red banner **above the tab content on every tab** until resolved.

## Today

- Status card (one of three).
- Call row: answered / missed / not yet, time IST.
- Missed ladder timeline when relevant: T, +10, +25, +45, neighbour ask.
- Dose rows for **today only**.
- Quote block for mood / her words.
- Primary: Call Maa (`tel:`).

## History

- Toggle 7 / 30.
- Calendar cells: call dot + meds dot. `aria-label` includes date, call, meds, mood.
- Mood strip under the calendar with the medical-disclaimer caption.

## Alert detail

- Her quote.
- Time with zone.
- Who was notified.
- Who replied “I'm going”.
- Resolve (separate from ack).

## Tokens

See `cursor_design_brief.md`. Status colours:

| Token | Text | Surface | Icon/border |
| --- | --- | --- | --- |
| good | `#276B43` | `#E3F1E7` | — |
| look | `#7A4F0E` | `#FCEFD6` | `#B7791F` |
| act | `#B23A2A` | pale red wash | `#B23A2A` |
| muted | ink 60% | `#D9CFC2` | — |

## EXAMPLE ribbon

If the loaded household `is_example=true`, show a persistent “EXAMPLE DATA” ribbon. Never present seed rows as real families.
