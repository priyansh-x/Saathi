# Cursor design brief

**Wins on conflicts** with `ux_spec.md`, `dashboard_spec.md`, and wireframes.  
Working name: **Saathi** (easy to rename). Product owner: Priyansh Joshi.

## Product, not a landing page

The core experience is a **mobile-first family web view** opened from a WhatsApp link, no login: `/d/[token]`.

Any marketing page is secondary: one screen, one CTA (“Set up a call for Maa”).

Design for a child aged 25–45, on a phone, often abroad, anxious and short on time. They should understand **today in under 3 seconds**.

## Build order

Today → History → Call detail → Alert detail → Settings (read-only) → Onboarding form.

Bottom tab bar: **Today / History / Alerts / Settings**. Icon + label always visible.

## Status (three levels only)

| Level | Meaning | Map from PRD |
| --- | --- | --- |
| **Good** | Calm green | OK |
| **Needs a look** | Amber | Watch; Missed before the ladder escalates |
| **Act now** | Red, pinned above everything and on every tab until resolved | Emergency; Missed after the ladder escalates |

## Visual rules

- Warm and calm. Not clinical. Not startup-neon.
- Background `#FBF7F2`, ink `#1F1B16`.
- One accent: dark saffron/terracotta `#B0532A` (white text on it passes AA). Never the lighter `#C4622D` under text.
- Status tokens: good `#276B43` on `#E3F1E7`; amber text `#7A4F0E` on `#FCEFD6` (icon/border `#B7791F`); alert `#B23A2A`; muted `#D9CFC2`.
- Type: Inter + Noto Sans Devanagari. Body ≥16 px. Line-height 1.5 (1.6 for Hindi). Tabular numbers.
- Cards: 16 px radius, very light shadow, lots of whitespace. One main action per screen.
- Single column 360–430 px, 16 px side padding, 12 px gaps, max width 480 px centred on desktop.
- Lucide line icons. No stock photos of old people. No gradients. No emoji clutter.
- Motion ≤150 ms fade. Honour `prefers-reduced-motion`.
- Every screen: empty, loading, error. Error copy: “Couldn't load. Your WhatsApp updates still work.” + Retry.
- i18n from day one: EN / हिं. Times always carry a zone label (IST, plus viewer zone when different).
- WCAG AA. Colour is never the only signal. Touch targets ≥44 px. Primary buttons full-width 48 px. Usable at 200% zoom, no horizontal scroll. `aria-label` on calendar cells.

## Tech

Next.js + Tailwind + shadcn/ui. One design-token file. Seeded fake data first, labelled **EXAMPLE**.

## Framing

Companionship and reminders. Never diagnosis or dose advice.
