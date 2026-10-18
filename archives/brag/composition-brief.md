# Hyperframes Composition Brief: Saathi

## Objective
Create a short launch-style brag video for Saathi.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21.28 seconds

## Source Material
- Project root: `/workspace`
- Primary files read: `README.md`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/i18n/messages.ts`, `src/lib/whatsapp/templates.ts`, `src/components/brand.tsx`
- Product name: Saathi
- Tagline / strongest claim: “A morning call for Maa, on the phone she has.”
- Key UI or visual moment to recreate: the incoming-call chip, the Today desk, the daily WhatsApp briefing
- Copy that must appear verbatim:
  - No app for her.
  - A morning call for Maa,
  - on the phone she has.
  - 8:00 AM · Saathi is calling
  - नमस्ते माँ, दवाई ले ली?
  - EXAMPLE
  - Maa is doing well today
  - Amlodipine
  - Taken
  - Metformin
  - Not asked yet
  - Saathi called Kamla this morning (08:30 IST).
  - Status: Good
  - Medicines: Amlodipine taken
  - She picks up and talks.
  - Not an emergency service · 112

## Creative Direction
- Tone preset: polished
- Creative direction: warm morning product film
- Interpretation: slow holds, paper and terracotta, no generic SaaS motion
- Angle: she already has a phone; the morning is the product
- Hook: “No app for her.”
- Outro / punchline: Saathi. She picks up and talks. 112.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Invented claims, real phone numbers, or unlabeled personal data

## Visual Identity
- Background: #fbf7f2
- Text: #1f1b16
- Accent: #b0532a
- Display font: Instrument Serif italic, local woff2
- Body font: Inter, local woff2
- Hindi: Noto Sans Devanagari, local woff2
- Visual references: phone frame, EXAMPLE pill, good-green dose row, WhatsApp green #075e54

## Storyboard
1. Hook — 3.82s — “No app for her.” / “A morning call for Maa, on the phone she has.”
2. The call — 4.92s — incoming-call chip, Hindi line
3. Today — 4.37s — EXAMPLE desk, two medicines one by one
4. Two lines — 4.36s — daily briefing, EXAMPLE
5. Wordmark — 3.81s — Saathi, “She picks up and talks.”, 112

## Audio
- Audio role: warm bed
- Audio arc: steady, three soft hits, logo on the last strong cue
- Music: `assets/music/bed.mp3` (trimmed vol-12), also the full file beside it
- Music treatment: volume 0.32 for the whole 21.28s
- Music cue guidance: `/tmp/brag/skills/brag/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.md` — lock 8.74, 13.11, 17.47
- Audio-reactive treatment: subtle; `#glow` opacity and scale from pre-extracted RMS/bass in `assets/music/audio-data.js`
- Audio-coupled moments:
  - call card — soft impact
  - medicine rows — beat grid
  - briefing lines — beat grid
  - wordmark — strong cue
- SFX selection guidance: `impactSoft_medium_001`, `click1`, `switch2` — low and sparse
- Exact SFX choice: those three files, volumes 0.45–0.55
- Audio files: already in `brag-output/composition/assets/`

## Hyperframes Instructions
Standalone composition. GSAP paused timeline registered as `window.__timelines["saathi"]`. Local gsap, local fonts, no remote URLs in the render. `npx hyperframes check` before render.
