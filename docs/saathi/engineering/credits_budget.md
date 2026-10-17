# Credits budget

Stay cheap. Priyansh confirms sponsor credit amounts.

## Defaults

| Var | Dev / test default |
| --- | --- |
| `MOCK_BOLNA` | `1` |
| `MOCK_WHATSAPP` | `1` |
| `CALL_BUDGET_MINUTES_DAILY` | `15` |
| `MAX_CALL_SECONDS` | `180` |
| `SAATHI_KILL_SWITCH` | unset / `0` |

Real sends need an **explicit flag** plus `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`.

Refuse to dial past the daily minute cap. Stop below a wallet floor (`GET /user/me`).

Test calls ≤3 min, to Priyansh’s verified number only.

Default speech stack: Sarvam via Bolna (~$0.06/min). Do not wire Deepgram/Cartesia unless free credits are confirmed.

## Rough demo math

26 Oct demo: a handful of live calls (scripts A–C + one miss). Budget for ≤30 paid minutes unless Priyansh raises the cap.

`SAATHI_KILL_SWITCH=1` stops all dialling and sending.
