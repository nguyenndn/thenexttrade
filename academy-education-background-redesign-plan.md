# Academy Education Background Redesign Plan

## Goal
Redesign the public `/academy` background so the page feels like a structured trading education journey, not just a generic tech map.

The target direction is a hybrid of:

- **Ascent Topographic** for the hero: subtle mountain/topographic path lines that match "The Trader's Ascent".
- **Scholar Map** for the level tree: ivory paper, soft notebook grid, faint curriculum path, and calm education cues.

## Current Problem

The current `/academy` uses:

- plain white hero area;
- dot grid in `AcademyTree`;
- green/cyan fireflies;
- dark-mode glow orbs.

This looks modern, but it reads more like a tech/fantasy map than an Academy. It does not strongly communicate:

- structured learning;
- curriculum progress;
- education;
- mastery path;
- certificate/achievement journey.

## Design Principles

Use a light, educational, premium style:

- white / ivory base;
- soft paper texture feel;
- subtle notebook grid;
- faint topographic/path lines;
- emerald/cyan for progress;
- small gold accents for achievement;
- no loud gradient blobs;
- no heavy decorative orbs in light mode.

The background should support the lesson cards, not compete with them.

## Inspiration Logic

Do not copy external pages directly. Use the common education patterns:

- Brilliant: learning path, interactive progress, "learn by doing".
- Codecademy: clear path/catalog, level progression, skill outcome.
- Khan Academy: friendly learning identity, calm educational environment.
- Coursera: structured course/certificate feel.

Apply only what fits TheNextTrade:

- a trading learning path;
- levels and modules;
- completion/certificate feeling;
- professional but not academic-stiff.

## Files To Touch

Required:

- `src/app/academy/page.tsx`
- `src/components/academy/AcademyTree.tsx`

Optional:

- `src/components/academy/AcademyMap.tsx`
  - Only if still used anywhere or if dashboard/public variants share visual logic.
- `src/app/academy/layout.tsx`
  - Only if global academy page background needs a wrapper-level base.

Do not touch:

- lesson content;
- quiz logic;
- progress logic;
- database queries;
- locked lesson rules.

## Hero Background Direction

Update the hero section in `src/app/academy/page.tsx`.

Current hero:

```tsx
<section className="pt-32 pb-4 sm:pb-6 px-6 relative overflow-hidden">
```

Target feel:

- soft ivory/white background;
- subtle topographic lines behind title;
- a faint vertical ascent/path line;
- maybe 2-3 tiny education icons as watermarks: book, compass, certificate.

Suggested structure:

```tsx
<section className="relative overflow-hidden border-b border-amber-100/70 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_70%,#f8fafc_100%)] px-6 pt-32 pb-10 sm:pb-14">
  <div className="absolute inset-0 pointer-events-none">
    {/* notebook grid */}
    {/* topographic lines */}
    {/* soft radial highlight behind title */}
  </div>
  <div className="max-w-5xl mx-auto text-center relative z-10">
    ...
  </div>
</section>
```

Do not make it yellow. Ivory should be subtle.

## Hero Visual Layers

Use 3 background layers:

1. **Ivory base**
   - `from-[#fffaf0] via-white to-slate-50`
   - opacity should be calm.

2. **Notebook grid**
   - very faint lines:
   - `rgba(15,23,42,0.035)` in light mode.
   - Do not use high-contrast dots here.

3. **Topographic/ascent lines**
   - Use CSS radial/linear gradients or an inline SVG.
   - Best: absolutely positioned inline SVG with path lines.
   - Stroke should be amber/emerald with low opacity.

Example:

```tsx
<svg className="absolute inset-x-0 top-10 mx-auto h-[260px] w-[900px] max-w-none opacity-[0.18]" viewBox="0 0 900 260" fill="none">
  <path d="M40 210 C180 120 280 170 420 90 C560 20 680 80 840 40" stroke="url(#academyPath)" strokeWidth="2" />
  <path d="M80 230 C210 150 300 190 450 110 C590 45 700 105 860 60" stroke="#F59E0B" strokeOpacity="0.25" />
  ...
</svg>
```

Keep the SVG decorative only:

```tsx
aria-hidden="true"
```

## Tree Background Direction

Update `src/components/academy/AcademyTree.tsx`.

Current root:

```tsx
<div className="relative min-h-[600px] w-full py-16 px-4 overflow-hidden bg-gray-50 dark:bg-[#0B0E14] transition-colors duration-300">
```

Target root:

```tsx
<div className="relative min-h-[600px] w-full overflow-hidden bg-[#fbfaf6] px-4 py-16 transition-colors duration-300 dark:bg-[#0B0E14]">
```

Add a stronger education map feel:

- paper grid instead of pure dot grid;
- subtle vertical "learning spine";
- faint curriculum route around levels;
- keep existing fireflies only if toned down.

## Tree Background Layers

Replace the current light-mode dot grid with:

1. **Paper grid**

```tsx
<div className="absolute inset-0 z-0 pointer-events-none opacity-70 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-0" />
```

2. **Soft dot overlay**

Use fewer dots than current:

```tsx
<div className="absolute inset-0 z-0 pointer-events-none opacity-[0.18] bg-[radial-gradient(rgba(0,200,136,0.55)_1px,transparent_1px)] [background-size:32px_32px] dark:opacity-15" />
```

3. **Learning spine**

Add a central vertical line:

```tsx
<div className="absolute left-1/2 top-0 z-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-200/80 to-transparent dark:via-white/10" />
```

4. **Topographic low-opacity SVG**

Add behind nodes, not above them.

Use low opacity and no animation.

## Fireflies

Current fireflies can stay, but reduce them:

- opacity lower;
- color should be emerald/gold mixed, not only primary green;
- no dense sparkle field.

If keeping them makes the page feel game-like, remove them from `/academy` public page and keep them only in homepage/community sections.

Recommendation:

- Keep 8-12 fireflies max in `AcademyTree`.
- `opacity: [0, 0.35, 0]`
- size `w-0.5 h-0.5` or `w-1 h-1`.

## Level Cards / Nodes Compatibility

Do not rebuild the level cards unless needed.

But ensure:

- level cards stay readable over the new background;
- white cards have enough contrast;
- selected/current level still stands out;
- locked/premium states still visible.

If cards look too flat on ivory:

- increase border to `border-amber-100/80` for light mode;
- add subtle shadow `shadow-[0_10px_30px_rgba(15,23,42,0.05)]`;
- keep dark mode unchanged as much as possible.

## Color Guidance

Light mode:

- Background: `#fbfaf6`, `#fffaf0`, `#ffffff`
- Paper line: `rgba(15,23,42,0.035)`
- Path line: `rgba(245,158,11,0.25)` and `rgba(0,200,136,0.20)`
- Progress: existing emerald/cyan is OK
- Achievement: gold/amber only as accent

Dark mode:

- Keep current dark base `#0B0E14`
- Use existing low-opacity grid/glow
- Do not force ivory styles into dark mode

## Mobile Behavior

At mobile widths:

- reduce topographic SVG height;
- avoid complex line paths that cross over lesson cards;
- keep background behind content, never between text and cards;
- no horizontal overflow from SVG.

Use:

```tsx
className="absolute left-1/2 top-8 h-[180px] w-[720px] -translate-x-1/2 max-w-none opacity..."
```

Set `overflow-hidden` on the section.

## Accessibility

- Decorative SVG must use `aria-hidden="true"`.
- Background should not reduce text contrast.
- Do not put meaningful text inside background images.
- Respect dark mode contrast.

## Implementation Tasks

- [ ] Update `/academy` hero background in `src/app/academy/page.tsx`.
  - Verify: hero feels like an education/ascent page, not a plain white block.

- [ ] Add subtle topographic/ascent SVG or CSS path behind the hero title.
  - Verify: decorative lines do not overlap headline readability.

- [ ] Replace the light-mode `AcademyTree` dot grid with paper grid + learning spine in `AcademyTree.tsx`.
  - Verify: level map reads as a structured curriculum path.

- [ ] Reduce or refine fireflies in `AcademyTree.tsx`.
  - Verify: effects feel premium, not noisy/game-like.

- [ ] Check dark mode.
  - Verify: dark mode still looks intentional and does not inherit harsh ivory colors.

- [ ] Check mobile.
  - Verify: no horizontal scroll, no text overlap, path visuals do not clutter cards.

## Acceptance Criteria

- [ ] `/academy` visually communicates education, curriculum, and progress.
- [ ] The background supports "The Trader's Ascent" concept.
- [ ] Light mode looks premium and calm, not overly yellow or overly green.
- [ ] Level cards remain readable.
- [ ] Mobile layout remains clean.
- [ ] Dark mode remains usable.
- [ ] No changes to lesson/quiz/progress functionality.

## QA Checklist

Run:

```bash
npm run type-check
```

Browser checks:

- `/academy` desktop 1440px
- `/academy` mobile 390px
- Light mode
- Dark mode

Visual checks:

- Hero title remains the focal point.
- Background does not compete with level nodes.
- The page no longer feels like a generic dotted tech map.
- No horizontal overflow.
- No layout shift caused by decorative SVG.

