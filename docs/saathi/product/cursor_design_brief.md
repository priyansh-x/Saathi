# Design brief for the Cursor master prompt (Saathi Product)
Source specs: product/ux_spec.md, dashboard_spec.md, whatsapp_templates.md, wireframes.html (+ PNGs). Mockup data is fictional.

## Product, not landing page
- The core experience is a mobile-first family web view, opened from a WhatsApp link with no login. Any marketing page is secondary: one screen, one call to action ("Set up a call for Maa").
- Design for a child aged 25-45 on a phone, often abroad, who is anxious and short on time. They should understand today in under 3 seconds.
- Build these screens in this order: Today, History, Call detail, Alert detail, Settings (read-only), Onboarding form.

## Screens
- **Today:** one status card at the top using three levels only: Good (calm green), Needs a look (amber), Act now (red, pinned). Then a row each for call answered, meds taken/missed, and mood in her own words (a quoted line, never a diagnosis). One clear next action, e.g. "Call Maa" with her number shown.
- **Missed-call ladder state:** a live timeline of retries (T, +10, +25, +45) and when the neighbour gets asked.
- **Alert detail:** what she said (quote), the time, who was notified, who replied "I'm going", and a resolve button. Keep "someone is on it" separate from "she's confirmed OK".
- **History:** a 7/30-day calendar with a dot per day for call and meds, plus a simple mood trend. No streaks and no guilt copy.
- **Call detail:** a short summary, a meds checklist, the transcript, and audio playback only if she consented to recording.

## Visual direction
- Warm and calm, not clinical, not startup-neon. Off-white warm background (#FBF7F2), deep ink text (#1F1B16), and one accent: a darker saffron that passes contrast with white text. Use the values in dashboard_spec.md and don't use a lighter orange.
- Type: Inter or a similar sans, with Noto Sans Devanagari for Hindi. Base size 16px or larger, a generous 1.5 line height, and large touch targets of 44px or more.
- Cards with a soft radius (16px), very light shadows, plenty of whitespace, and one main action per screen.
- Simple line icons (lucide). No stock photos of old people, no gradients, no emoji clutter.
- Every screen needs empty, loading and error states. Support English and Hindi with an i18n structure from day one.
- Accessibility: WCAG AA contrast, colour never the only signal (pair it with an icon and a word), and readable at 200% zoom.

## Tech guidance for UI
- Next.js + Tailwind + shadcn/ui, with a design-token file for colours, spacing and radius so the look stays consistent.
- Build against seeded fake data first, clearly labelled, so the UI can be judged before Bolna and the backend are wired up.
