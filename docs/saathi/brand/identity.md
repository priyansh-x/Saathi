# Saathi identity

Owner: brand · 19 Oct 2026 · Tokens live in `src/brand/tokens.css` (both apps).

## The idea

Saathi is the person who still rings in the morning. Not a clinic, not a gadget, not a mascot. The identity is an **open line**: a ring that has been picked up, and a small disc at the centre — the parent on the other end. Indigo on warm paper is morning light in a north-Indian house, not a flag and not a hospital. The child opening the desk at 6am should feel the same thing the parent hears on the call: someone steady, unhurried, already here.

## Mark

Production mark: `mark.svg` (colour tile) and `mark-mono.svg` (`currentColor`, no tile).

**Why this one.** Four directions are in `explorations/`.

| # | Direction | Why it was tried | Why it is not the production mark |
| --- | --- | --- | --- |
| 1 | Geometric **स** | The name starts here; both apps already used a Devanagari tile | At 16px the shirorekha and inner counter clog. A WhatsApp circle crop shears the top bar. Children abroad should not have to read Devanagari to find the app. |
| 2 | Latin **SA** ligature | Familiar to NRIs | Reads as a bank or airline. Too clever for an 80-year-old's household. |
| 3 | Morning light (horizon + arcs) | Honest about the time of day | Weather-app. A sun next to an Indian product slides toward cliché. |
| 4 | **Open line** (chosen) | The product *is* a phone call that stays with the parent | Reads at 16px (ring + disc). One colour. Works reversed on indigo or as ink on paper. Not a wifi glyph if the gap stays at 2 o'clock. |

The gap in the ring is the receiver off the hook — the line is open. The disc is the person we called. Do not add a smile, a heart, a lotus, a diya, a tricolour, or a cartoon elder.

**Clear space.** Keep a margin equal to the inner disc's diameter on every side of the tile. Do not box it with a second rounded square.

**Minimum size.** Colour tile 16px. Mono mark 12px (stroke still reads). Below that, use the wordmark only.

**On dark.** Paper strokes `#F7F5F0` on indigo `#34507A`, or the mono mark in paper on `#1A222E`. Never grey the indigo down to "make it softer" — softness is in the paper, not a washed logo.

## Wordmark and lockups

Files in `lockups/`.

- Latin: **Saathi** — IBM Plex Sans Semibold, tracking slightly tight (`-0.03em`). Never "SAATHI", never "saathi" in a logo.
- Devanagari: **साथी** — IBM Plex Sans Devanagari Semibold. Do not fake it with a Latin font.
- Horizontal: tile + word, 12px gap. Default for nav and the family header.
- Stacked: tile centred above the word. Splash, store, empty states.

Minimum wordmark width: Latin 72px, Devanagari 64px. Do not outline, do not put the word inside the ring.

## Palette

Started from the brief's indigo `#34507A` on paper `#F7F5F0` with ink `#1D1B18`. Kept the indigo (it already clears 7:1 on paper and 8:1 for white type). Shifted the current terracotta `#B0532A` *out* of the brand seat: it was reading as saffron/startup, and it fought the status reds. Paper is a hair cooler than the old `#FBF7F2` so Hindi and English sit on the same page without a tea-stain cast.

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `--paper` | `#F7F5F0` | App and landing ground | — |
| `--ink` | `#1D1B18` | Body | 15.8:1 on paper |
| `--ink-2` | `#5A564F` | Secondary (was `#8C8176`, ~3.7:1 — failed) | 6.7:1 on paper |
| `--brand` | `#34507A` | Mark, primary buttons, links | 7.5:1 on paper; white on brand 8.2:1 |
| `--brand-deep` | `#2A4267` | Pressed / header on dark | 10.1:1 with white |
| `--brand-soft` | `#E4EAF1` | Chips, selected | brand on soft 6.7:1 |
| `--good` | `#1F6B45` | Good — word + icon required | 5.9:1 on paper; white 6.5:1 |
| `--look` | `#8A5410` | Needs a look | 5.7:1 on paper |
| `--act` | `#A83228` | Act now | 6.1:1 on paper; white 6.7:1 |
| `--good-soft` / `--look-soft` / `--act-soft` | `#DCECE3` / `#F4E6C8` / `#F6E4E1` | Status washes | ink of that status ≥5:1 on the wash |
| `--dark` | `#1A222E` | Landing footer | paper type on dark |

Status never colour-alone: **Good** always ships a check and the word; **Needs a look** a small triangle and the word; **Act now** the alert icon and the word. Week dots on History still need a text equivalent in the row.

## Type

**IBM Plex Sans** (Latin) + **IBM Plex Sans Devanagari** (Hindi). Same designer, matching weights and x-height, so a bilingual line does not jump. Loaded with `next/font/google` (self-hosted at build). Weights 400 and 600. Body 16px / 1.55. Hindi uses `lang=hi` and the Devanagari face; never stretch Latin letter-spacing to "match" शिरोरेखा.

Landing English headlines may keep a modest serif (Instrument Serif) for the marketing voice. Hindi headlines on the same page use Plex Devanagari 600 — Instrument has no Devanagari, and we do not mix a Latin italic into हिं.

UI icons: 24px viewBox, 1.75 stroke, round caps. Set in `icons/` (call, medicine, alert, neighbour, family, settings). No emoji in product UI.

## Voice and tone

Same person as `docs/saathi/voice/persona.md`. The brand writes like the call: short, "aap", no diagnosis.

| | Do | Don't |
| --- | --- | --- |
| EN | Maa picked up. She took the morning tablet. | Your loved one has been marked adherent. |
| EN | Needs a look — no answer yet. We'll try again. | We failed to engage the user!!! |
| हिं | माँ ने फ़ोन उठाया। सुबह वाली गोली ले ली। | आपके वरिष्ठ सदस्य स्वस्थ हैं। |
| हिं | एक नज़र डालिए — अभी जवाब नहीं आया। | अलर्ट जनरेट हुआ है। कृपया डैशबोर्ड चेक करें। |

Never joke about health. Never claim a doctor, a hospital, or a statistic we cannot show. WhatsApp copy is locked in templates — do not restyle those sentences here.

## Surfaces

| Surface | How the brand shows up |
| --- | --- |
| Family desk | Paper ground, indigo primary, horizontal lockup in the header. Status chips do the talking. Quiet, dense enough for 6am. |
| Landing | Same tokens. More air, serif English headlines, photos of a morning — not stock "sad NRI". Nav uses the colour tile. |
| WhatsApp | Profile photo is the colour tile, circle-cropped. In-thread we do not send logos; the two-line briefing is the brand. |
| The call | No visual. The brand is pace and address: "Main Saathi hoon." No jingle, no English IVR menu. |

## Files

- Tokens: `src/brand/tokens.css`
- Explorations: `docs/saathi/brand/explorations/`
- Production tile: `docs/saathi/brand/mark.svg`
- Raster: `public/brand/` and `landing/public/brand/`
- Sheet: `docs/saathi/brand/brand-sheet.png`
