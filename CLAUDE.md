@AGENTS.md

## Visual style (mandatory for every UI change)

The full rules are in `frontend-bento-gsap.md` Section 3.1, and `AGENTS.md` Section 6 repeats the summary. Before building or reviewing a screen, check it against these bans:

- Font: Be Vietnam Pro only. Inter is forbidden.
- Icons: never inside rounded containers. Limit to one bare icon per card, and only when it adds meaning.
- Cards: no nested cards and no bordered or tinted boxes inside a card.
- Gradients: forbidden unless the spec names a functional purpose.
- Space: no dead space in grids or sections. Fill it with content or span, never filler. Apply the layout fixes in `frontend-bento-gsap.md` Section 3.2, and check cell fit and clipped text at 375, 1024 and 1440px.
- Copy: plain and factual. No slogans, superlatives or ad-style wording.
- Images: every service, part, voucher and mechanic row or tile shows the image its API provides (`imageUrl`, `avatarUrl`) in a fixed clipped frame, with a bare icon or initials as fallback. Never ship a text-only row when an image exists.

## Home chapter layout and motion

Home sections (promotions, services, parts, steps, price, mechanics, reviews, closing call to action) are ruled-row chapters, not card grids or banners: masked headline, hairline rules, rows on the page surface. Layout rules are in `frontend-bento-gsap.md` Section 3.3.

Motion comes from one hook, `hooks/useChapterMotion.ts`, using the attributes `data-lines`/`data-line` (via `components/home/MaskLines.tsx`), `data-rule`, `data-chapter-row` and `data-chapter-photo`. Optional extras (`hooks/useChapterExtras.ts`, `hooks/useCursorPreview.ts`): `data-parallax`, `data-focus`, `data-count-to` and `data-preview-src`. Values live in `lib/motion/chapter-motion.ts`; limits are in Section 4.7. Do not write a new timeline per section, and do not pin or use sticky columns.

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

**Placement:** keep the illustration and its text in the same column. In `components/home/steps/StepsBento.tsx` each step draws its own hairline rule above the numeral, so no pixel offsets depend on the illustration size.

**Checks:** run `bun run check:all` after changes. Do not delete `.next/dev` unless a stale generated type error appears; it is a regenerated dev cache.
