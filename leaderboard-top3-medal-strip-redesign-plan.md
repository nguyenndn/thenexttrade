# Leaderboard Top 3 Medal Strip Redesign Plan

## Goal

Rebuild the `/dashboard/leaderboard` Top 3 area so it feels premium, compact, smooth, and consistent with TheNextTrade's dashboard UI.

Current issue: the Top 3 podium is too large, visually heavy, game-like, and creates awkward empty space when rank #3 is missing.

Target direction: replace the tall podium cards with a compact **Top Performers Medal Strip**.

## Current Files

Primary files:

- `src/app/dashboard/leaderboard/components/TopPodium.tsx`
- `src/app/dashboard/leaderboard/components/LeaderboardContent.tsx`

Related files to keep compatible:

- `src/app/dashboard/leaderboard/components/LeaderboardTable.tsx`
- `src/app/dashboard/leaderboard/components/UserProfileCard.tsx`
- `src/app/dashboard/leaderboard/actions.ts`

Do not change the data fetching logic unless required. This is mainly a UI rebuild.

## Design Decision

Replace the podium-style layout with a compact medal strip:

```txt
Top Performers

[#1 Kee        185 Edge    27m / 5 lessons]
[#2 User       30 Edge     0m / 0 lessons]
[#3 Open spot  Start earning Edge]
```

Desktop:

- 3 equal columns.
- Each card height around `92px` to `112px`.
- Rank #1 has a subtle gold treatment.
- Rank #2 has a silver/slate treatment.
- Rank #3 has a bronze/amber treatment.
- No large podium blocks.
- No bounce animation.
- No oversized glow.

Mobile:

- Stack the 3 cards vertically.
- Each row stays compact.
- Avatar and text remain horizontally aligned.
- No text overflow.

## What To Remove

Remove from `TopPodium.tsx`:

- Tall podium bars.
- `podiumH`.
- `podiumBg`.
- `cardMt`.
- Large center card elevation.
- Crown bounce animation.
- Heavy glow shadows.
- Floating avatar that creates too much vertical space.
- `Waiting...` large placeholder state.

Keep:

- Click behavior: clicking a real entry still opens `UserProfileCard`.
- Top 3 order: display ranks as `#1`, `#2`, `#3`.
- Current user highlight.
- Tab-specific stats from `getTabStats`.
- Main value from `getMainValue`.

## Component Rename

Preferred:

- Rename `TopPodium` to `TopMedalStrip`.
- Rename file:
  - From: `TopPodium.tsx`
  - To: `TopMedalStrip.tsx`

Then update import in `LeaderboardContent.tsx`.

Acceptable fallback:

- Keep filename `TopPodium.tsx`, but replace implementation and exported component name only if renaming causes too much churn.

## Visual Spec

### Section Header

In `LeaderboardContent.tsx`, change section copy:

- Title: `Top Performers`
- Subtitle: `The current leaders in this ranking.`

Keep the trophy icon, but make the section feel lighter:

- Header padding: `px-5 py-4`
- Body padding: `p-4`
- Section border: `border-gray-200 dark:border-white/10`
- Card radius: `rounded-2xl`

### Medal Card Layout

Each top performer card:

```txt
[rank badge] [avatar] [name + value + stats] [optional current user marker]
```

Suggested structure:

```tsx
<button className="group flex h-[104px] items-center gap-3 rounded-xl border px-4 text-left transition">
  <div className="rank badge">#1</div>
  <Avatar />
  <div className="min-w-0 flex-1">
    <div className="name row" />
    <div className="main metric" />
    <div className="stats row" />
  </div>
</button>
```

Use `<button>` for real entries because it is clickable.

For empty slots, use `<div>` instead of `<button>`.

### Rank Styles

Use restrained colors:

Rank #1:

- Border: `border-amber-200 dark:border-amber-500/25`
- Background: `bg-amber-50/60 dark:bg-amber-500/5`
- Badge: `bg-[#F59E0B] text-white`
- Metric: `text-amber-700 dark:text-amber-300`

Rank #2:

- Border: `border-slate-200 dark:border-slate-600/40`
- Background: `bg-slate-50/70 dark:bg-slate-500/5`
- Badge: `bg-slate-500 text-white`
- Metric: `text-slate-700 dark:text-slate-200`

Rank #3:

- Border: `border-orange-200 dark:border-orange-500/25`
- Background: `bg-orange-50/60 dark:bg-orange-500/5`
- Badge: `bg-orange-500 text-white`
- Metric: `text-orange-700 dark:text-orange-300`

Current user:

- Add subtle ring or left accent:
  - `ring-2 ring-primary/15`
  - or `border-primary/40`
- Do not overpower rank styling.

### Avatar

Avatar should be compact:

- Size: `w-12 h-12`
- Rank #1 may use `w-14 h-14`, but only if layout remains aligned.
- Use `rounded-full`.
- Use `object-cover`.
- Fallback initial if no avatar.

Do not use large glow shadows. A small ring is enough:

- `ring-2 ring-white dark:ring-[#151925]`

### Empty Slot

If an entry is missing:

```txt
#3 Open spot
Start earning Edge to claim this place.
```

Style:

- `border-dashed`
- `bg-gray-50/50 dark:bg-white/[0.02]`
- `text-gray-400`
- No large question avatar.
- No "Waiting..." copy.

## Data Display Rules

Use existing helper behavior:

- `getMainValue(entry, type)`
- `getTabStats(entry, type)`
- `formatStudyTime(minutes)`

Display per card:

- Name: one line, truncate if too long.
- Main metric:
  - `185 Edge`
  - `7 days`
  - `5 lessons`
  - `+$123.45`
- Stats:
  - Show max 2 stats.
  - Keep them in a small inline row.
  - Hide overflow gracefully on smaller widths.

Do not show too many secondary metrics in the Top 3. The table below can carry detail.

## Desktop Layout

Use:

```tsx
<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
```

The order should be natural:

```txt
#1 | #2 | #3
```

Do not use podium order `#2 | #1 | #3` anymore. It makes the UI feel decorative and less scannable.

## Mobile Layout

At mobile width:

- Cards stack vertically.
- Height can be `auto`, but minimum around `84px`.
- Text must not overlap.
- Buttons remain at least `44px` touch target.

Expected:

```txt
[#1 Kee ...]
[#2 User ...]
[#3 Open spot ...]
```

## Interaction

Real entry:

- Click opens `UserProfileCard`, same as current behavior.
- Hover:
  - Slight border darkening.
  - `shadow-sm` to `shadow-md`.
  - Optional `translate-y-[-1px]`.

Empty entry:

- Not clickable.
- No hover elevation.

Keyboard:

- Real entries should be focusable.
- Add visible focus ring:
  - `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`

## Implementation Tasks

- [ ] Replace `TopPodium` with compact medal strip implementation.
  - Verify: Top 3 area no longer has tall podium bars or large floating avatars.

- [ ] Rename component to `TopMedalStrip` and update import in `LeaderboardContent.tsx`.
  - Verify: app compiles and no stale `TopPodium` import remains.

- [ ] Change section title/subtitle to `Top Performers` / `The current leaders in this ranking.`
  - Verify: `/dashboard/leaderboard` shows updated copy.

- [ ] Use natural rank order `#1`, `#2`, `#3`.
  - Verify: rank #1 appears first, not centered between #2 and #3.

- [ ] Add compact empty state for missing ranks.
  - Verify: if there are only 1-2 users, empty slots show `Open spot` and do not take excessive vertical space.

- [ ] Preserve click-to-open profile modal for real entries.
  - Verify: clicking a Top 3 card opens `UserProfileCard`.

- [ ] Test all leaderboard tabs.
  - Verify:
    - `/dashboard/leaderboard?type=xp`
    - `/dashboard/leaderboard?type=streak`
    - `/dashboard/leaderboard?type=academy`
    - `/dashboard/leaderboard?type=trading`

- [ ] Test responsive layout.
  - Verify: desktop shows 3 columns, mobile shows stacked rows with no text clipping.

## Acceptance Criteria

- Top 3 section height is significantly smaller than the old podium UI.
- No large gold/silver/bronze podium blocks.
- No bounce animation.
- No heavy glow around avatars.
- Empty #3 state looks intentional, not broken.
- Top 3 cards feel premium and dashboard-native.
- User can still click a Top 3 user and open the profile modal.
- The ranking table below remains unchanged.
- Light mode and dark mode both look polished.
- No TypeScript errors.
- No new ESLint errors.

## Suggested QA Commands

Run:

```bash
npm run type-check
npx eslint src/app/dashboard/leaderboard/components/TopMedalStrip.tsx src/app/dashboard/leaderboard/components/LeaderboardContent.tsx
```

If component is not renamed, use:

```bash
npx eslint src/app/dashboard/leaderboard/components/TopPodium.tsx src/app/dashboard/leaderboard/components/LeaderboardContent.tsx
```

Then browser test:

```txt
http://localhost:3000/dashboard/leaderboard?type=xp
http://localhost:3000/dashboard/leaderboard?type=streak
http://localhost:3000/dashboard/leaderboard?type=academy
http://localhost:3000/dashboard/leaderboard?type=trading
```

## Notes For Claude

Keep this change scoped to the leaderboard Top 3 UI.

Do not rebuild the leaderboard data model.
Do not change rank calculation.
Do not change `LeaderboardTable`.
Do not create a competition feature.

This is a UI polish pass only.
