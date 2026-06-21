# Homepage MT5 Execution Toolkit Plan

## Goal
Add a premium homepage section that introduces TheNextTrade's MT5 execution products: EA GoldScalperNinja, Trade Manager, and one additional partner EA/tool, positioned as a free-to-unlock toolkit for users with an eligible partner/IB account.

## Product Positioning

This section must not feel like a generic EA sales page. It should support the current TheNextTrade story:

- The journal shows what happened.
- Weekly coach reports show what to fix.
- The MT5 toolkit helps traders execute and manage risk more cleanly.

Use this framing everywhere:

- **Free with eligible partner account**
- **MT5 execution support**
- **Trade management and discipline**
- **Setup help through TheNextTrade / GoldScalperNinja community**

Avoid claims like:

- "Guaranteed profit"
- "90% win rate"
- "Auto profit"
- "Set and forget"
- "No risk"

## Recommended Placement

Update [src/app/page.tsx](src/app/page.tsx):

Current order:

1. `SaaSHeroSection`
2. `HomeTrustMetrics`
3. `TradeJournalPreviewSection`
4. `SpreadsheetComparisonSection`
5. Academy section
6. `WebForexTools`
7. `BrokerRankingsSection`
8. FAQ

New order:

1. `SaaSHeroSection`
2. `HomeTrustMetrics`
3. `TradeJournalPreviewSection`
4. **NEW: `MT5ExecutionToolkitSection`**
5. `SpreadsheetComparisonSection`
6. Academy section
7. `WebForexTools`
8. `BrokerRankingsSection`
9. FAQ

Why here:

- The previous section explains the product workflow: connect, analyze, improve.
- This new section answers: "What can I use on MT5 to execute better?"
- The spreadsheet comparison then reinforces why TheNextTrade is more than manual notes.

## New Component

Create:

`src/components/home/MT5ExecutionToolkitSection.tsx`

Use dynamic import in `src/app/page.tsx`, same pattern as the other homepage sections:

```tsx
const MT5ExecutionToolkitSection = dynamic(
  () => import("@/components/home/MT5ExecutionToolkitSection").then(m => ({ default: m.MT5ExecutionToolkitSection })),
  { loading: () => <div className="h-96" /> }
);
```

Props:

```tsx
interface MT5ExecutionToolkitSectionProps {
  isLoggedIn: boolean;
}
```

Pass `isLoggedIn` from `HomeFeed`.

## Section Copy

### Eyebrow

`MT5 EXECUTION TOOLKIT`

### Main headline

`Unlock the GoldScalperNinja MT5 Toolkit`

### Highlight word

`GoldScalperNinja`

### Description

`Use your eligible partner account to unlock MT5 Expert Advisors, Trade Manager tools, setup guides, and community support built for cleaner execution and better risk control.`

### Primary CTA

Logged out:

- Label: `Check Unlock Eligibility`
- URL: `/auth/signup?next=/dashboard/accounts`

Logged in:

- Label: `Check Unlock Eligibility`
- URL: `/dashboard/accounts`

### Secondary CTA

- Label: `View Trading Systems`
- URL: `/dashboard/trading-systems`

### Small trust note under CTAs

`Free to unlock with an eligible partner account. Your funds stay in your own broker account.`

## UI Direction

Use a light premium Gold style. Learn from GPM Trading's product-led structure, but keep TheNextTrade's cleaner tone.

Do:

- Use a white or ivory background, not dark.
- Use Gold only as the accent color, not the whole background.
- Show product cards and unlock steps clearly.
- Keep cards 8px to 16px radius max unless existing homepage sections use larger.
- Use subtle borders: amber/gold tint.
- Use a product preview panel on the right side for desktop.

Do not:

- Add a huge hero-like section that competes with the main homepage hero.
- Use exaggerated glow/orb backgrounds.
- Use copy that sounds like an EA vendor landing page.
- Hide the unlock condition.

## Desktop Layout

Use a two-column section:

Left column:

- Eyebrow pill
- Headline
- Description
- 4 unlock proof chips
- CTAs

Right column:

- Product stack / toolkit preview card
- 3 product rows:
  - EA GoldScalperNinja
  - Trade Manager
  - Partner EA Toolkit
- Unlock flow mini timeline:
  - Eligible account
  - Request unlock
  - Download tools
  - Install on MT5

Suggested grid:

```tsx
<section className="relative overflow-hidden border-t border-dashboard bg-white dark:bg-transparent">
  <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-center">
      ...
    </div>
  </div>
</section>
```

## Mobile Layout

Stack in this order:

1. Eyebrow
2. Headline
3. Description
4. Product cards
5. Unlock flow
6. CTA buttons

Rules:

- No horizontal overflow.
- Product cards must be full width.
- CTA buttons should be full width on mobile.
- Keep total mobile section height reasonable; avoid a long fake dashboard preview.

## Product Cards

### Card 1: EA GoldScalperNinja

Icon: `Bot` or `Zap`

Title:

`EA GoldScalperNinja`

Description:

`An MT5 Expert Advisor built for XAUUSD workflows, structured entries, and disciplined execution support.`

Bullets:

- `MT5 Expert Advisor`
- `XAUUSD-focused workflow`
- `Unlock with eligible account`

### Card 2: Trade Manager

Icon: `SlidersHorizontal` or `Gauge`

Title:

`Trade Manager`

Description:

`Manage entries, stop loss, take profit, and risk actions faster during live execution.`

Bullets:

- `Faster order management`
- `Risk controls at execution`
- `Built for active MT5 traders`

### Card 3: Partner EA Toolkit

Icon: `Wrench` or `Package`

Title:

`Partner EA Toolkit`

Description:

`Additional MT5 tools and setup resources for traders who qualify through the partner account path.`

Bullets:

- `Extra EA resources`
- `Setup guides included`
- `Community support path`

If the second EA already has an official name, replace `Partner EA Toolkit` with that name.

## Unlock Flow UI

Add a compact 4-step strip:

1. `Use eligible account`
2. `Submit unlock request`
3. `Download EA tools`
4. `Install on MT5`

Suggested copy:

`Free does not mean public download. The toolkit unlocks when your account is eligible under the partner account path.`

## Data / Logic

No new database schema is required for this homepage section.

Use only route-level CTA logic:

```tsx
const eligibilityHref = isLoggedIn ? "/dashboard/accounts" : "/auth/signup?next=/dashboard/accounts";
```

Do not add unlock API logic on homepage. Actual unlock eligibility remains inside Account Hub / Trading Systems.

## Files To Touch

Required:

- `src/app/page.tsx`
- `src/components/home/MT5ExecutionToolkitSection.tsx`

Optional:

- `src/components/home/HomeFAQSection.tsx`
  - Add one FAQ only if needed:
    - Question: `Is the MT5 toolkit free?`
    - Answer: `The toolkit is free to unlock with an eligible partner account. The download is not a public free-for-all because eligibility depends on your connected broker account path.`

Do not touch:

- Copy trading backend/API/admin flows.
- `src/app/dashboard/copy-trading/*`
- `src/app/admin/copy-trading/*`

This request is about homepage positioning, not removing the copy trading feature from the whole app.

## Implementation Tasks

- [ ] Create `MT5ExecutionToolkitSection.tsx` with the two-column desktop layout and stacked mobile layout.
  - Verify: `/` renders the new section without console errors.

- [ ] Add the dynamic import and render it after `TradeJournalPreviewSection` in `src/app/page.tsx`.
  - Verify: homepage order is Hero -> Metrics -> Trade Journal Preview -> MT5 Toolkit -> Spreadsheet Comparison.

- [ ] Implement logged-in/logged-out CTA routing.
  - Verify: logged-out primary CTA goes to `/auth/signup?next=/dashboard/accounts`; logged-in goes to `/dashboard/accounts`.

- [ ] Make the unlock condition visible in the section.
  - Verify: page includes `Free to unlock with an eligible partner account`.

- [ ] Add responsive styling.
  - Verify: desktop is two columns; mobile stacks cleanly with no horizontal overflow.

- [ ] Optional: add one FAQ about free unlock eligibility.
  - Verify: FAQ does not duplicate existing EA Sync FAQ.

## Acceptance Criteria

- [ ] Homepage introduces EA GoldScalperNinja and Trade Manager clearly.
- [ ] It is obvious that access is free but requires an eligible partner/IB account.
- [ ] Section does not make profit guarantees or aggressive EA claims.
- [ ] Section visually matches current homepage Gold/light premium direction.
- [ ] CTA path is clear for both logged-out and logged-in users.
- [ ] Mobile layout is readable and compact.

## QA Checklist

Run:

```bash
npm run type-check
```

Manual browser checks:

- `/` desktop 1440px
- `/` mobile 390px
- Light mode
- Dark mode

Specific checks:

- No text overlaps.
- CTAs are not hidden below the fold on mobile.
- Product cards do not look like separate pricing plans.
- The section does not duplicate the message of `TradeJournalPreviewSection`.
- The section appears before `SpreadsheetComparisonSection`.
