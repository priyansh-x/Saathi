# Saathi identity

Owner: brand · 19 Oct 2026 · Tokens: `src/brand/tokens.css` and `landing/brand/tokens.css`.

## The idea

Saathi is a companion who still rings in the morning. The mark is the letter **स** — the start of साथी — on a warm terracotta tile. That is what the landing and family desk already were. The colour is morning chai and brick, not a hospital and not a navy dashboard.

## Mark

Production: terracotta rounded square, **स** in paper-white. Used in the nav, PWA icons, and WhatsApp crop.

Explorations in `explorations/`: geometric स, Latin SA, morning light, open-line ring. The open-line indigo mark was tried and **rejected** — it read as a different product. The letter स is the one that belongs to this name.

**Clear space.** Margin equal to the corner radius around the tile.

**Minimum size.** 16px tile. Below that, wordmark only.

**On dark.** Same terracotta tile, or white **स** on `#241C16`.

## Wordmark

- Latin **Saathi** — IBM Plex Sans Semibold.
- Devanagari **साथी** — IBM Plex Sans Devanagari Semibold.
- Horizontal: tile + word. Stacked: tile above the word.

## Palette

This is the palette the landing and desk already shipped. Status greens/ambers/reds stay separate from brand orange so “Act now” is not the same colour as a button.

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#FBF7F2` | Ground |
| `--ink` | `#1F1B16` | Body |
| `--ink-2` | `#5C534A` | Secondary (≥4.5:1 on paper) |
| `--brand` | `#B0532A` | Mark, primary buttons |
| `--brand-deep` | `#8E3F1D` | Pressed |
| `--brand-soft` | `#F6E4D9` | Chips |
| `--good` | `#276B43` | Good — word + icon |
| `--look` | `#7A4F0E` | Needs a look |
| `--act` | `#B23A2A` | Act now |

Status never colour-alone.

## Type

IBM Plex Sans + IBM Plex Sans Devanagari, 400/600, `next/font`. Landing English headlines may use Instrument Serif; Hindi uses Plex Devanagari.

## Voice

Same as `docs/saathi/voice/persona.md`. Short, aap, no diagnosis.

| | Do | Don't |
| --- | --- | --- |
| EN | Maa picked up. She took the morning tablet. | Your loved one has been marked adherent. |
| हिं | माँ ने फ़ोन उठाया। सुबह वाली गोली ले ली। | आपके वरिष्ठ सदस्य स्वस्थ हैं। |

## Surfaces

| Surface | |
| --- | --- |
| Family desk | Paper, terracotta primary, स tile in chrome. |
| Landing | Same tokens, more air, serif English headlines. |
| WhatsApp | Profile is the स tile, circle-cropped. |
| The call | No visual. “Main Saathi hoon.” |
