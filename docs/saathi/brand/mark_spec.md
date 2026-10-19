# Saathi mark — redraw spec (स)

Source reviewed: `docs/saathi/brand/mark.svg` on main @ 5159483 (viewBox 64; tile `#B0532A`, rx 14; glyph `#F7F5F0`).
Review renders: `identity_review/mark_check.png` (main mark beside Noto Sans Devanagari स at 16/32/48/192/512).

## What is wrong in the current mark
- **There is no right vertical stem.** The path is a top bar (x 14–50, y 16–21.5), then a curl that drops from the bar's right side and sweeps down and to the left, with a separate filled oval at (22.4–34, 28.4–40.1). Without the stem it reads as a "3" / उ / ञ-like curl, not स.
- **The loop is wrong.** In स the left part is an open hook that joins a horizontal crossbar into the stem. Here it is one big curl wrapping around a closed solid dot.
- **It is off-centre.** The glyph's bounding box is about x 10–50, y 16–49 on a 64 tile, so it sits left of centre and a little high.
- **At 16 px** it turns into a white bar over a blob. You can't read it as a letter.
- **Colour:** the tile is `#B0532A` (matches `--brand`). The letter is paper `#F7F5F0`, which is right for the production "tile" variant in identity.md.

## Redraw
1. **Base:** Noto Sans Devanagari U+0938, outlined to paths (not live text). Use weight 800, wdth 100, so the strokes hold at 16 px.
2. **Canvas:** viewBox `0 0 512 512`. Tile is a rect 512×512, rx 112 (same 14/64 ratio as today), fill `#B0532A`.
3. **Glyph:** fill `#F7F5F0`. Centre the bounding box optically on (256,256). Max dimension 62% of the tile (≈317 px), which is well inside the 80% safe zone (51–461).
4. **Must have:** the full-width shirorekha across the top, a full-height right vertical stem, a horizontal crossbar into the stem, and the left hook kept open (the counter stays visibly open at 16 px).
5. **Hinting:** at 16 px the stem and bar should each be about 2 px. Check the bar and stem at 16 and 32 px, and nudge them to whole pixels if they blur.
6. **Remove:** the separate solid oval and the curl that wraps under the bar.

## Status of proposal
`identity_review/mark_proposed.svg` is step 1–3 done mechanically: the Noto Bold (800) outline, scaled and centred in the tile. It has not been hand-tuned yet. The extra opening of the left hook and the pixel hinting from step 5 are still to do.
