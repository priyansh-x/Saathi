# WhatsApp Cloud API setup (Priyansh only)

Cursor never does steps 1–10. Mocks stay on (`MOCK_WHATSAPP=1`) until you finish this list and flip env yourself. Do not ask the agent to call Graph, submit templates, or set `MOCK_WHATSAPP=0`.

1. Meta Business portfolio (complete business verification if Meta asks).
2. Create a Meta developer app with the WhatsApp product. Note the WhatsApp Business Account ID (WABA).
3. Use the free test number first. Add up to 5 recipient numbers on the API Setup page (your own number first).
4. Create a System User and a permanent token with `whatsapp_business_messaging` and `whatsapp_business_management`.
5. Submit each DRAFT template in `docs/saathi/whatsapp/templates/` (Category **Utility**, English and Hindi). Wait for approval. Note any rejection reasons and keep the bodies to two lines, no diagnosis, no promotional wording, no promise that anyone will respond.
6. Webhook: callback `https://<family-host>/api/webhooks/whatsapp`, a verify token you choose, subscribe to the `messages` field. Meta will GET with `hub.mode=subscribe` and POST delivery statuses with `X-Hub-Signature-256`.
7. Vercel env (Production), empty until you have values: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_GRAPH_VERSION`, `WHATSAPP_APPROVED_TEMPLATES` (only approved `name:lang` pairs), plus the child's number on `ALLOWED_PHONE_NUMBERS`.
8. Opt-in is recorded by the app: the owner at setup and each invited member when they join (both type their own number under copy that says WhatsApp messages come there), and a neighbour when they reply Yes to `responder_optin`. Inbound `STOP` / `band` opts a number out; `START` / `शुरू` turns it back on. Migration `027_whatsapp_opt_in_backfill` opts in members and yes-neighbours who joined before this.
   Every number still has to be on `ALLOWED_PHONE_NUMBERS` and every template on `WHATSAPP_APPROVED_TEMPLATES`, or the send falls back to push/email and the row's status says why (`blocked_not_allowlisted`, `blocked_unapproved_template`, `failed_meta_<http>_<code>`).
9. Open `/admin` for that household and use **Preview only — sends nothing**. Confirm template name, language, rendered body, and the redacted JSON.
10. Only then set `MOCK_WHATSAPP=0` in Vercel and send one test to your own number.

Moving to a real business number later needs display-name approval.

Utility templates are charged per delivered message; check current Meta pricing before go-live.
