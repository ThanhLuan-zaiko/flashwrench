@AGENTS.md

## Visual style (mandatory for every UI change)

The full rules are in `frontend-bento-gsap.md` Section 3.1, and `AGENTS.md` Section 6 repeats the summary. Before building or reviewing a screen, check it against these bans:

- Font: Be Vietnam Pro only. Inter is forbidden.
- Icons: never inside rounded containers. Limit to one bare icon per card, and only when it adds meaning.
- Cards: no nested cards and no bordered or tinted boxes inside a card.
- Gradients: forbidden unless the spec names a functional purpose.
- Space: no dead space in grids or sections. Fill it with content or span, never filler.
- Copy: plain and factual. No slogans, superlatives or ad-style wording.

## Skill: flat isometric illustrations

Use this skill when a page needs decorative 3D-style illustrations (flat isometric, no gradients or photos). It produces static SVG files; it is not for UI icons, which must still come from `react-icons` (see `AGENTS.md` section 2).

**Generator:** `scripts/generate-isometric.ts`. It builds each drawing from axis-aligned boxes and vertical cylinders, projects them at 30 degrees, and writes the SVGs to `public/images/isometric/`.

- Run it with `bun scripts/generate-isometric.ts` (optionally pass another output directory).
- To add or change a drawing, edit or add a scene function (`toolbox`, `tyre`, `wrench`, `gear`) and register it in the `files` map at the bottom of the script. Then rerun it; never hand-edit the generated SVGs.
- The `Scene` helpers are `box`, `cylinder`, `disc`, `shadowRect` and `shadowDisc`. Paint back-to-front: draw parts behind others first, as `gear()` does with its teeth.

**Rules for the output:**

- Colours are free for illustrations. The shade objects (`NAVY`, `STEEL`, `RUBBER`, `LIGHT`) are a starting set, and you may add more. The navy/zinc palette in `AGENTS.md` governs UI surfaces, text and controls, not drawings.
- `viewBox` is cropped to the artwork with an equal 4-unit margin, so the drawing fills the square frame and stays centred. Do not go back to a square viewBox sized by the longest diagonal, which leaves the drawing small and off-centre.
- The root `<svg>` carries `aria-hidden="true"` (Biome `noSvgWithoutTitle` requires it for decorative SVGs).
- Render with `next/image` and `alt=""`, passing `width`/`height` and sizing with Tailwind classes.

**Placement:** keep the illustration and its text in the same column. The route line in `components/home/steps/StepsBento.tsx` is positioned in px (`top-[129px]`) to pass through the numerals below a 96px illustration; if you change the illustration size or the gap above the numeral, update that offset.

**Checks:** run `bun run check:all` after changes. Do not delete `.next/dev` unless a stale generated type error appears; it is a regenerated dev cache.
