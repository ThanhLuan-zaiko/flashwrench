---
name: frontend-bento-gsap
description: Use when building frontend UI with bento grid, bento box, card grid layouts, dashboards, landing sections, or GSAP animations, ScrollTrigger reveals, micro-interactions. Use ONLY for frontend UI work.
---

# Frontend Bento GSAP

## 1. Purpose and Scope

Use this skill for all frontend layout and motion work in this repo.
It defines how to build bento grid interfaces with pure Tailwind
and how to add GSAP motion without breaking global constraints.

Apply when the request mentions: bento, grid cards, dashboard,
landing page, portfolio section, gallery, reveal on scroll,
stagger, parallax lite, marquee alternative, page enter animation.

Do NOT apply for: backend CQL, services, repositories, API routes,
auth, TanStack Query cache logic. For those follow `AGENTS.md` directly.

## 2. Non-Negotiable Repo Constraints

Always respect these from `AGENTS.md`:

- Bun only: `bun install`, `bun run`, `bun add`. Never npm or yarn.
- Next.js App Router, TypeScript strict, no `any`.
- `.tsx` max 250 lines, `.ts` max 350 lines. Split before finishing.
- Pure Tailwind only. `app/globals.css` stays exactly 2 lines.
  No custom CSS files, no `@keyframes`, no `@theme` tokens.
- No `style={{}}` for static styling. All static styling is Tailwind.
- Monochrome palette only: white, zinc scale, black + `dark:` variants.
  No accent hues except explicitly requested semantic states.
  Approved: validation errors in red (`text-red-600 dark:text-red-400`,
  alert boxes like `components/auth/FormAlert.tsx`); toasts carry a
  colored left edge plus matching icon (success green, error red,
  info monochrome).
- No `shadow-*` except floating overlays (modal, dropdown, tooltip).
  Use `border`, `divide-*`, spacing, typography for hierarchy.
- Icons from `react-icons` only. Never hand-write inline `<svg>`.
- User-facing strings in Vietnamese with full diacritics.
  All identifiers, comments, logs, commit text in English.
- Responsive mobile-first: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`.
- Dark mode via `dark:` class strategy, persisted toggle in header.
- Components consume TanStack Query hooks only, never raw `fetch`.

GSAP is a JS runtime animator. It does NOT permit CSS files,
keyframes, or static inline styles. It only writes transform
and opacity at runtime.

## 3. Bento Grid Principles

Bento means one bounded section composed of cards with mixed spans,
aligned to a strict grid, dense but breathable.

Rules:

1. One section = one grid root. Never nest bento grids.
2. Use 1 col on mobile, 2 cols on `sm:`, 4 or 6 cols on `lg:`.
3. Mix spans deliberately: 1 hero card (`col-span-2 row-span-2`),
   2 wide cards (`col-span-2`), rest 1x1. Max 6-8 cards per section.
4. Every card is a self-contained component with one job:
   stat, action, media, list, quote, status, chart placeholder.
5. Hierarchy via size and position, not color. Hero is top-left
   on `lg:`, first in DOM on mobile.
6. Uniform gaps: `gap-3 md:gap-4`. Uniform radius: `rounded-2xl`.
   Uniform border: `border border-zinc-200 dark:border-zinc-800`.
7. Card surface: `bg-white dark:bg-zinc-950`. Muted inner blocks:
   `bg-zinc-100 dark:bg-zinc-900`. Text: `text-zinc-900 dark:text-zinc-100`,
   secondary: `text-zinc-500 dark:text-zinc-400`.
8. Minimum touch target 44px for all interactive cards and buttons.
9. No horizontal overflow on 360px wide viewport. Test this.
10. Guidance copy only: user-facing strings tell the user what to do
    or what is happening, in plain Vietnamese. Never expose
    implementation jargon (CRUD, slug, API, table or column names,
    debug internals, issue-tracker wording). Data values (names,
    codes, prices) may be displayed; the surrounding instructions
    must stay non-technical.
    Bad: "CRUD loại hình, xóa mềm cần nhập slug."
    Good: "Thêm, sửa, ẩn hoặc xóa loại hình. Mục đã ẩn nằm trong
    Thùng rác và khôi phục được."
11. Paginate every list that can grow (admin tables, histories,
    search results). Never render an unbounded list. Default to
    8 rows per page for dense admin rows.
    - Pager sits below the list: previous/next buttons plus a
      "Trang X trên Y" label and an "Hiển thị A–B trên N mục"
      line (`aria-live="polite"`). Buttons keep the 44px minimum,
      with Vietnamese labels (`aria-label="Trang trước"` /
      `"Trang sau"`), and hide the whole pager on a single page.
    - Reset to the first page when filters, search text, or tabs
      change. Clamp the current page after deletes so the view
      never lands on an empty page.
    - Data: include page and filters in the TanStack Query key and
      keep previous-page data visible while the next page loads
      (`placeholderData: keepPreviousData`). Large tables paginate
      server-side (limit/offset or cursor); client-side slicing is
      allowed only for small config tables.

Preferred Tailwind skeleton (compose, do not copy blindly):

```tsx
// BentoSection.tsx — grid root only, no motion here
<section className="mx-auto w-full max-w-6xl px-4 md:px-6">
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
    <HeroCard />
    <StatCard />
    <ActionCard />
    <StatusCard />
  </div>
</section>
```

Each `*Card` lives in its own file under the same folder,
for example `components/bento/HeroCard.tsx`.

## 4. GSAP Rules

### 4.1 Setup

- Package `gsap` is already installed. Import from `gsap` and
  `gsap/ScrollTrigger` only. Do not add other motion libraries.
- All GSAP code runs in Client Components (`"use client"` only).
  Never animate in Server Components.
- Encapsulate motion in `hooks/useBentoReveal.ts` or
  `hooks/useGsapStagger.ts` so `.tsx` files stay small.

### 4.2 Mandatory Pattern

Use `gsap.context` with cleanup, scope animations to a root ref,
kill ScrollTriggers on unmount:

```tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useBentoReveal<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: { trigger: rootRef.current, start: "top 85%" },
        },
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return rootRef;
}
```

Cards mark themselves with `data-reveal`, no per-card JS.

### 4.3 Allowed Motion Only

- Animate only `y`, `x`, `scale`, `opacity`. Max duration 0.6s,
  max stagger 0.1s, `ease: "power2.out"` default.
- Enter effects: fade-up `y: 24 -> 0`. Hover: `scale: 1.02`
  via Tailwind `motion-safe:transition-transform motion-safe:duration-200`,
  not via GSAP hover loops.
- Loading indicators may use Tailwind `animate-spin` or
  `animate-pulse` only.
- Respect reduced motion: skip GSAP when
  `window.matchMedia("(prefers-reduced-motion: reduce)").matches`
  is true, render final state instantly.
- Always scope behind `motion-safe:` for Tailwind transitions.
- Never animate `width`, `height`, `top`, `left`, `box-shadow`,
  `background-color`. Never create infinite loops, tickers,
  or scroll-jacking. If keyframes are needed, drop the animation
  and render instantly per `AGENTS.md`.

### 4.4 Performance

- One `ScrollTrigger` per bento section, batch cards with stagger.
- Use `once: true` for above-the-fold reveals where possible.
- Do not animate more than ~12 targets per section.
- Kill triggers on unmount via `ctx.revert()`.

## 5. File Organization

Keep files small and single-purpose:

```text
components/bento/
  BentoSection.tsx      # grid root, server or client shell, < 250 lines
  HeroCard.tsx          # presentational card
  StatCard.tsx
  ActionCard.tsx
hooks/
  useBentoReveal.ts     # GSAP reveal hook, < 350 lines
  useCountUp.ts         # optional numeric tween, isolated
```

Rules:

- Grid root handles layout only. Cards handle content only.
  Hooks handle motion only.
- If `BentoSection.tsx` exceeds ~150 lines, extract header,
  grid, or footer into separate files.
- Props and row shapes are strictly typed. No `any`.
- Static copy is Vietnamese with diacritics in JSX only.
  Hook names, data attributes, comments stay in English.

## 6. Accessibility and Dark Mode Checklist

- Semantic landmarks: `section` with heading, list semantics
  where cards are homogeneous.
- Focus visible on all interactive cards:
  `focus-visible:outline-2 focus-visible:outline-offset-2`.
- Contrast passes in both light and dark themes.
- Reduced-motion users see complete content with no animation.
- Theme toggle remains next to login button in header,
  labels in Vietnamese via `aria-label`.

## 7. Pre-Delivery Verification

Before finishing, verify:

1. `bun run type-check` passes.
2. `bun run lint` passes.
3. `bun run check:lines` passes (tsx <= 250, ts <= 350).
4. No edits to `app/globals.css` beyond the canonical 2 lines.
5. No new `.css` files, no `@keyframes`, no `style={{}}`
   for static layout, no inline `<svg>`.
6. `git status` inspected, garbage files reported, no commit
   without explicit user confirmation.
7. User-facing copy is guidance-oriented with no technical jargon
   (no CRUD, slug, API, or debug wording in instructions).
8. Growing lists paginate with reset-on-filter and clamped pages.

## 8. Anti-Patterns (Forbidden)

- Full-page GSAP timelines spanning unrelated sections.
- Per-card `useEffect` creating separate ScrollTriggers.
- Missing `ctx.revert()` cleanup.
- Custom easing strings, bounces, elastic effects in dashboards.
- Colored gradients or accent borders to fake hierarchy.
- `shadow-lg` on static cards. Borders only.
- English placeholder copy shipped as user-facing text.
- Technical jargon (CRUD, slug, API, debug text) in user-facing
  instructions. Show data, guide with plain words.
- Unbounded lists with no pagination, or pagers that forget to
  reset on filter change.
- Client Components for static cards that need no motion.
