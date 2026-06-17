# Homepage Conversion Flow Optimization Plan

## Goal
Rebuild the homepage flow so a first-time visitor sees proof and product value before being pushed into hard CTAs.

The homepage should tell one clear story:

1. You have trade history.
2. TheNextTrade reads the pattern.
3. The system turns it into one practical next action.
4. Guides, tools, brokers, and community support the improvement loop.

This is a homepage UX, copy, and layout task only. Do not change auth, database queries, article SEO logic, calculator logic, broker data models, or route structure.

## Current Problem
The current homepage is visually much better than before, but the conversion flow is still too eager and too long.

Observed current order in `src/app/page.tsx`:

1. Hero
2. Trust metrics
3. Start by goal
4. Trending topics
5. Popular guides
6. CTA card
7. Trade journal preview
8. Spreadsheet comparison
9. Tools preview
10. Market ticker
11. Academy path
12. Reviews
13. Trading calculators
14. Recommended trading platforms
15. Trust disclaimer
16. FAQ
17. Setup path CTA
18. Final CTA/newsletter
19. About
20. Quote

Issues:

- Hero shows hard CTA buttons before user sees enough proof.
- `StartByGoalSection` asks the visitor to choose too early.
- `Trending Topics` and `Popular Guides` are useful for SEO, but they push the core product proof too far down.
- Hard CTAs appear too many times: hero, after guides, product preview, spreadsheet comparison, setup path, final CTA.
- Mobile page is very long before the user sees the core product moment.
- The homepage mixes article/content value and trade journal value without a single narrative priority.

## Target Strategy
Make the homepage lead with product proof, then offer learning/content paths.

The new hierarchy:

1. Hero: hook + proof chips + search + soft scroll CTA.
2. Trust metrics: immediate proof.
3. Product proof: "Three steps to your trading edge".
4. Spreadsheet comparison: why TheNextTrade is better than manual review.
5. Goal router: help user choose a path after they understand the product.
6. Learning hub: trending topics + popular guides in one compact section.
7. Tools and market helpers.
8. Academy path.
9. Reviews.
10. Trading platforms.
11. FAQ.
12. Final CTA.
13. About + quote.

## Files To Update

- `src/app/page.tsx`
- `src/components/home/SaaSHeroSection.tsx`
- `src/components/home/HomeTrustMetrics.tsx`
- `src/components/home/StartByGoalSection.tsx`
- `src/components/home/TradeJournalPreviewSection.tsx`
- `src/components/home/SpreadsheetComparisonSection.tsx`
- `src/components/home/HomeSectionCTA.tsx`
- `src/components/home/NewsletterSection.tsx`
- Optional new component: `src/components/home/HomeLearningHubSection.tsx`

Do not touch:

- Article schema, article routes, or article rendering.
- Broker database models.
- Calculator logic.
- Auth/onboarding logic.
- Dashboard logic.

## Implementation Tasks

### Task 1: Change Hero From Hard CTA To Proof-Led Entry

Update `src/components/home/SaaSHeroSection.tsx`.

Current issue:

- Hero immediately shows `Start Free Journal` and `Browse Trading Guides`.
- This asks for action before the visitor has seen the dashboard proof.

Target hero content:

- Keep headline:
  - `Turn Your Trade History Into Your Next Move`
- Keep supporting copy, but tighten it:
  - `Sync MT5 trades, review what happened, and get one focused weekly action to improve your trading.`
- Keep search bar.
- Replace the two large hard CTA buttons with one softer CTA:
  - Primary soft CTA: `See how it works`
  - Link target: `#how-it-works`
- Add a quiet text link, not a full button:
  - `Browse trading guides`
  - Link target: `/knowledge`

Logged-in behavior:

- Do not make `Open Dashboard` the main hero CTA.
- Keep dashboard access in the header/nav only.
- Optional: show a small inline chip under proof badges:
  - `Welcome back - open dashboard`
  - Link target: `/dashboard`
  - This must be visually smaller than the main hero content.

Hero proof chips:

Keep these, but make them feel like proof, not sales claims:

- `Free to start`
- `Auto MT5 sync`
- `Weekly coach reports`

Remove or avoid:

- Two large hero buttons side by side.
- Aggressive "Start Free Journal" before product proof.
- Extra decorative blobs that make the hero feel generic.

Verify:

- At 1440px, hero has one primary visual action only.
- At mobile width, hero has one full-width soft CTA and a text link below it.
- User can click `See how it works` and land on the product preview section.

### Task 2: Move Product Proof Above Learning Content

Update `src/app/page.tsx`.

Move `TradeJournalPreviewSection` so it appears immediately after `HomeTrustMetrics`.

New top order:

1. `SaaSHeroSection`
2. `HomeTrustMetrics`
3. `TradeJournalPreviewSection`
4. `SpreadsheetComparisonSection`
5. `StartByGoalSection`
6. Learning hub section

Add `id="how-it-works"` to the wrapper around `TradeJournalPreviewSection`.

Reason:

- The visitor should see the actual product promise before the site asks them to choose between learning, tools, brokers, or dashboard.
- This makes the first scroll answer: "What does TheNextTrade actually do?"

Verify:

- On desktop, the first major block after metrics is the app/product preview.
- On mobile, user sees product proof before article cards.
- `#how-it-works` anchor scrolls correctly and does not hide the heading behind the sticky header.

### Task 3: Keep First Hard CTA Inside Product Proof

Update `src/components/home/TradeJournalPreviewSection.tsx`.

This section should become the first real conversion point.

CTA rules:

- Primary CTA:
  - Logged out: `Start Free Journal`
  - Logged in: `Go to Dashboard`
- Secondary CTA:
  - `View Setup Path`
- Both buttons can stay here because the user has now seen:
  - trust metrics
  - product workflow
  - dashboard preview

Keep existing three-step text:

- `1. Connect`
- `2. Analyze`
- `3. Improve`

Do improve:

- Make the dashboard preview the dominant proof object.
- Make Step 3 highlighted, but not overly noisy.
- Keep the step cards compact enough that the preview remains visible above the fold on desktop.

Verify:

- CTAs are visually stronger here than in the hero.
- The product preview feels like the "aha moment" of the homepage.
- On mobile, the steps appear before the preview, and both CTAs are stacked cleanly.

### Task 4: Keep Spreadsheet Comparison, But Make It Support The Product Story

Update `src/components/home/SpreadsheetComparisonSection.tsx`.

This section should answer:

> Why not just use spreadsheet/manual notes?

Keep current concept:

- Spreadsheet/manual review vs TheNextTrade improvement loop.

Refine hierarchy:

- Keep the 4 "essence" cards:
  - Auto Sync
  - Find The Leak
  - Learn The Fix
  - Act Weekly
- Keep comparison rows.
- Keep only one CTA at the bottom.

CTA:

- Logged out: `Start Free Journal`
- Logged in: `Open My Journal`

Avoid:

- Long text that wraps awkwardly inside rows.
- Repeating the same exact value proposition from the previous section.

Verify:

- The section reads as a proof/explanation block, not another hero.
- Row text fits on desktop and does not feel cramped on mobile.

### Task 5: Move Goal Router After Product Explanation

Update `src/app/page.tsx` and `src/components/home/StartByGoalSection.tsx`.

Move `StartByGoalSection` after `SpreadsheetComparisonSection`.

Reason:

- The visitor should first understand TheNextTrade before choosing a path.
- This section then becomes useful navigation, not an early decision burden.

Update copy:

- Eyebrow: `Choose your path`
- Title: `What do you want to improve first?`
- Description: `Now that you know the system, pick the next step that fits your current goal.`

Cards:

- Learn Trading -> `/academy`
- Track My Trades -> `/auth/signup?source=home_goal&intent=track` or `/dashboard/accounts` if logged in
- Calculate Risk -> `/tools`
- Compare Brokers -> `/brokers`

Visual:

- Keep cards compact.
- Keep `Track My Trades` recommended, but do not make it overpower the section.

Verify:

- The section feels like a router after explanation.
- It does not compete with the main product CTA above it.

### Task 6: Merge Trending Topics And Popular Guides Into A Compact Learning Hub

Update `src/app/page.tsx`.

Current issue:

- Trending topics and popular guides are separate sections.
- Popular guides shows 6 large cards, which makes the page very long, especially on mobile.

Target:

- Create one compact "Learning Hub" section.
- It should contain:
  - Section heading: `Popular Guides`
  - Description: `Start with the most useful lessons, broker guides, and trading playbooks.`
  - Trending topic chips above or beside the guide cards.
  - Only 3 featured guide cards by default.
  - A compact text row for latest updates.
  - Link: `Explore Library`

Implementation options:

- Option A: Extract current inline logic into `src/components/home/HomeLearningHubSection.tsx`.
- Option B: Keep inline in `page.tsx`, but reduce the amount of markup.

Recommended: Option A for readability.

Data:

- Reuse existing `popularArticles`, `trendingCategories`, and `latestArticles`.
- Keep all database queries unchanged.
- Change only rendering and count displayed.

Display rules:

- Desktop:
  - Topic chips in one/two centered rows.
  - 3 article cards in a 3-column grid.
  - Latest updates as a compact strip under cards.
- Mobile:
  - Topic chips horizontally scrollable or wrapped into 2-3 rows maximum.
  - 3 article cards stacked.
  - Latest updates can show 2 items max if spacing is tight.

Verify:

- Learning Hub height is much shorter than the current Trending + Popular Guides combination.
- SEO content remains discoverable.
- Page no longer feels like an article archive before the product story.

### Task 7: Reduce CTA Repetition

Update `src/app/page.tsx`, `HomeSectionCTA`, and `NewsletterSection`.

Keep only these major CTA moments:

1. Hero soft CTA:
   - `See how it works`
2. Product proof hard CTA:
   - `Start Free Journal`
3. Final CTA:
   - `Start Free Journal`
   - `Join Telegram`

Remove or demote:

- The current `HomeSectionCTA` immediately after Popular Guides.
- The separate `New here? Start with the setup path` block near the bottom, unless it is merged into the final CTA.

Suggested usage:

- Remove `HomeSectionCTA` from the middle of the page.
- Keep `NewsletterSection` as the final CTA, but make it the only large CTA near the bottom.
- If `View Setup Path` is needed, keep it as secondary CTA inside `TradeJournalPreviewSection`.

Verify:

- There are not more than 3 major CTA zones on the homepage.
- `Start Free Journal` appears after proof, not before proof.
- The page feels confident rather than pushy.

### Task 8: Keep Supporting Sections But Lower Their Priority

Keep these sections after the main conversion story:

- `ToolsPreviewSection`
- `MarketTickerSection`
- `LearningPathTimeline`
- `ReviewsSection`
- `WebForexTools`
- `BrokerRankingsSection`
- `HomeTrustDisclaimer`
- `HomeFAQSection`
- `AboutUsSection`
- `QuoteDisplay`

Recommended order:

1. Tools preview
2. Market ticker
3. Academy path
4. Reviews
5. Trading calculators
6. Recommended trading platforms
7. Trust disclaimer
8. FAQ
9. Final CTA/newsletter
10. About
11. Quote

Reason:

- These are strong trust and SEO/support sections, but they should not compete with the initial product explanation.

Verify:

- Sections still render.
- No route links break.
- Page keeps SEO coverage for tools, academy, brokers, FAQ, and articles.

### Task 9: Mobile-Specific Cleanup

The mobile homepage is currently very long.

Mobile requirements:

- Hero should fit within roughly one screen plus metrics.
- Product proof should appear before the user scrolls through article cards.
- Learning Hub should show 3 guide cards max.
- Avoid side-by-side CTAs on mobile.
- Use one full-width CTA per CTA zone.
- Do not show too many chips in the first 1500px.

Specific mobile checks:

- 390px width.
- 430px width.
- 768px tablet.

Verify:

- No headline awkwardly wraps into one-word lines.
- No card has clipped text.
- No horizontal page overflow.
- CTAs are at least 44px tall.

### Task 10: Final QA

Run these checks:

- `npm run type-check`
- `npm run lint`
- Open `http://localhost:3000`
- Test desktop viewport: 1440x900
- Test mobile viewport: 390x1200

Manual QA:

- Click hero `See how it works`; it scrolls to product proof.
- Click `Browse trading guides`; it opens `/knowledge`.
- Click product proof primary CTA logged out; it opens `/auth/signup`.
- Click product proof secondary CTA; it opens `/get-started`.
- Click Learning Hub `Explore Library`; it opens `/knowledge`.
- Click Tools preview cards; they open correct `/tools/...` routes.
- Click broker CTAs; existing behavior remains unchanged.

Visual QA:

- Top homepage story is understandable within first 2 scrolls:
  - Hero
  - metrics
  - product proof
  - spreadsheet comparison
- No more than 3 major CTA zones.
- Gold is the primary CTA accent.
- Emerald is reserved for success/live/positive states.
- Backgrounds feel consistent with current premium homepage style.
- No decorative blobs/orbs are introduced.

## Done When

- Hero no longer pushes two hard CTA buttons before proof.
- Product proof appears before Trending Topics and Popular Guides.
- Trending Topics and Popular Guides are merged or visually compressed into one Learning Hub.
- CTA repetition is reduced.
- Mobile homepage is shorter before the core product proof.
- Existing SEO/content sections still exist and routes still work.
- Type-check and lint pass.

## Reference Screenshots From Review

Current review screenshots were saved for comparison:

- `test-results/home-review-segment-00.png`
- `test-results/home-review-segment-01.png`
- `test-results/home-review-segment-03.png`
- `test-results/home-review-segment-04.png`
- `test-results/home-review-segment-05.png`
- `test-results/home-review-segment-06.png`
- `test-results/home-review-segment-07.png`
- `test-results/home-review-segment-09.png`
- `test-results/home-review-segment-10.png`
- `test-results/home-review-segment-11.png`

