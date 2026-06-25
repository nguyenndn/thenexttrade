# Homepage Hero Conversion Simplification Plan

## Goal
Rebuild the homepage hero in `src/components/home/SaaSHeroSection.tsx` so the first viewport has one clear conversion path, less visual noise, and a cleaner premium gold-led hierarchy.

## Current Problem
The hero currently shows too many competing actions in one tight area:

- Primary CTA: `Open Dashboard` / `Start Free Journal`
- Secondary CTA: `Browse trading guides`
- Search bar
- Trust chips: `Free to start`, `Auto MT5 sync`, `Weekly coach reports`
- Returning-user pill: `Welcome back — open dashboard`

This creates decision friction. A new visitor should immediately understand one action: start the journal. A returning user should immediately understand one action: open dashboard.

## Desired UX Direction
Hero should answer only one question:

> “Why should I start, and what is the next click?”

Move exploration actions lower on the page. Keep the hero focused, calm, and conversion-oriented.

## Files To Update
- `src/components/home/SaaSHeroSection.tsx`
- Optional, only if needed: `src/app/page.tsx` if section ordering needs adjustment

## Target Hero Structure

### 1. Badge
Keep the small gold badge, but make it concise:

```text
FREE MT5 SYNC + WEEKLY COACH PLAN
```

### 2. Headline
Keep current direction:

```text
Turn Your Trade History
Into Your Next Move
```

### 3. Subtitle
Keep one clear sentence:

```text
Sync MT5 trades, review what happened, and get one focused weekly action to improve your trading.
```

### 4. Primary CTA Only
Show only one main CTA in the hero.

If user is logged out:

```text
Start Free Journal
```

URL:

```text
/auth/signup?source=homepage_hero
```

If user is logged in:

```text
Open Dashboard
```

URL:

```text
/dashboard
```

### 5. Proof Line
Replace the current icon-heavy chips with one small text proof line under the CTA:

```text
Free to start · MT5 sync · Weekly coach reports
```

Rules:
- Keep this as plain compact text, not cards.
- Gold may highlight separators or one key phrase only.
- No large icons here.

## What To Remove From Hero

Remove from the hero first viewport:

- `Browse trading guides` link
- Search box
- Icon-heavy trust chips
- `Welcome back — open dashboard` pill

Reason:
These are useful actions, but not primary hero conversion actions.

## Where Removed Items Should Go

### Browse Trading Guides
Move this action into the existing path cards section, likely under:

```text
What do you want to improve today?
```

The `Learn Trading` card should become the natural path to guides/academy.

### Search
Move search into a separate discovery block below the hero or below the path cards.

Recommended copy:

```text
Looking for something specific?
Search guides, tools, brokers, and lessons.
```

UI:
- One centered search bar
- Max width around `640px`
- Not in the first hero CTA cluster

### Welcome Back CTA
Remove it entirely from homepage hero.

If user is logged in, the main CTA already says `Open Dashboard`, so the welcome pill is duplicate.

## Desktop Layout

Desktop hero should be vertically stacked and centered:

```text
[Badge]

[Headline]

[Subtitle]

[Primary CTA]

[Proof Line]
```

Spacing:
- Keep generous vertical spacing.
- CTA should be visually dominant.
- Search/discovery begins only after the hero content has breathing room.

## Mobile Layout

Mobile should be even stricter:

```text
[Badge]
[Headline]
[Subtitle]
[Full-width CTA or near full-width CTA]
[Proof Line wraps cleanly]
```

Rules:
- No search in mobile hero.
- No secondary CTA in mobile hero.
- CTA height minimum `48px`.
- Proof line may wrap to two lines if needed, but must remain centered and calm.

## Visual Style Requirements

- Keep light mode as primary.
- Use gold for the CTA and selected emphasis.
- Do not add more decorative elements.
- Keep the existing subtle grid background if it already works.
- Avoid nested cards in hero.
- Avoid making the proof line look like navigation.
- Avoid adding more badges.

## Accessibility Requirements

- Primary CTA must be a real link with clear accessible text.
- Focus state must be visible.
- Text contrast must remain readable in light and dark mode.
- Mobile touch target must be at least `44px` high.

## Implementation Tasks

- [ ] Update `SaaSHeroSection.tsx` to remove secondary CTA, search box, trust chip row, and welcome pill from the hero.
  - Verify: hero renders only one CTA.

- [ ] Keep login-aware CTA logic.
  - Verify: logged-out state shows `Start Free Journal`; logged-in state shows `Open Dashboard`.

- [ ] Add compact proof line under CTA.
  - Verify: line reads `Free to start · MT5 sync · Weekly coach reports`.

- [ ] Move or recreate search as a separate discovery block below the hero/path cards.
  - Verify: search is still available on homepage but no longer inside the hero CTA cluster.

- [ ] Ensure `Browse trading guides` is represented through the `Learn Trading` path card, not as a hero CTA.
  - Verify: no `Browse trading guides` link appears in hero.

- [ ] Test desktop and mobile responsive layout.
  - Verify: no horizontal overflow, no cramped hero spacing, CTA remains obvious.

## QA Checklist

Use Playwright to test:

- `/` desktop `1440x1000`
- `/` mobile `390x1000`

Assertions:

- Hero has only one primary CTA.
- `Browse trading guides` is not in the hero.
- Search bar is not in the hero.
- `Welcome back — open dashboard` is not visible in hero.
- Proof line is visible and compact.
- No console errors.
- No horizontal overflow.

## Done When

- The hero feels calm and premium.
- User sees one clear next action.
- Exploration/search still exists lower on the page.
- Homepage no longer feels like several CTAs are competing in the first viewport.
