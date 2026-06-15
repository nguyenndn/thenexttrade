# Homepage Full Premium UI Master Plan

## Goal

Rebuild and polish the full homepage so it feels premium, clear, SEO-friendly, and conversion-focused.

The homepage must answer 4 questions quickly:

1. What is TheNextTrade?
2. What can I do here today?
3. Why should I trust it?
4. What should I click next?

This plan covers the full homepage, not only the `Three steps to your trading edge` block.

## Target Files

Primary:

- `src/app/page.tsx`
- `src/components/home/SaaSHeroSection.tsx`
- `src/components/home/HomeTrustMetrics.tsx`
- `src/components/home/StartByGoalSection.tsx`
- `src/components/home/HomeSectionCTA.tsx`
- `src/components/home/TradeJournalPreviewSection.tsx`
- `src/components/home/SpreadsheetComparisonSection.tsx`
- `src/components/home/ToolsPreviewSection.tsx`
- `src/components/home/LearningPathTimeline.tsx`
- `src/components/home/ReviewsSection.tsx`
- `src/components/home/TrustedPartners.tsx`
- `src/components/home/WebForexTools.tsx`
- `src/components/home/BrokerRankingsSection.tsx`
- `src/components/home/HomeFAQSection.tsx`
- `src/components/home/NewsletterSection.tsx`
- `src/components/home/AboutUsSection.tsx`

Shared UI to reuse:

- `src/components/layout/PublicHeader.tsx`
- `src/components/layout/SiteFooter.tsx`
- `src/components/ui/SectionHeader.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/FadeIn.tsx`

Do not rebuild unrelated routes.

## Current Homepage Structure

Current order in `src/app/page.tsx`:

1. `PublicHeader`
2. `SaaSHeroSection`
3. `HomeTrustMetrics`
4. `StartByGoalSection`
5. `Trending Topics`
6. `Popular Guides`
7. `HomeSectionCTA`
8. `TradeJournalPreviewSection`
9. `SpreadsheetComparisonSection`
10. `ToolsPreviewSection`
11. `MarketTickerSection`
12. Academy preview / `LearningPathTimeline`
13. `ReviewsSection`
14. `TrustedPartners`
15. `WebForexTools`
16. `BrokerRankingsSection`
17. `HomeTrustDisclaimer`
18. `HomeFAQSection`
19. New here setup path callout
20. `NewsletterSection`
21. `AboutUsSection`
22. Daily quote / `QuoteDisplay`
23. `SiteFooter`

## Recommended Page Story

The page should feel like a guided journey:

1. Hero: promise and primary action.
2. Trust metrics: proof that the system is active.
3. Start-by-goal: let users choose their intent.
4. Learn layer: trending topics and popular guides.
5. Product layer: show how trade data becomes action.
6. Tools layer: calculators, market tools, broker comparisons.
7. Trust layer: reviews, partners, disclaimers, FAQ.
8. Final action: setup path, newsletter, brand story, quote.

Important:

- Do not place `StartByGoalSection` directly beside a similar product-answer section if it feels repetitive.
- Keep at least one content/SEO block between "What do you want to improve today?" and "Your trades already contain the answer".
- CTA density should feel helpful, not noisy.

## Global Visual Direction

Use a premium light trading brand:

- Background: white, soft slate, very light mint, subtle dot/grid patterns.
- Accent: gold for primary action and "improve" moments.
- Data success: emerald.
- Supporting neutral: slate/gray.
- Avoid full-page dark UI on homepage.
- Avoid heavy gradients, floating orbs, or overly decorative blobs.
- Cards should feel precise and professional, not toy-like.
- Keep card radius around `12px - 16px`; do not make every section a large floating card.

## Global UX Rules

- One primary CTA per major viewport.
- Every CTA must answer where it goes.
- Buttons need at least `44px` touch height.
- Avoid duplicate CTA meanings in the same viewport.
- No section should require reading more than 2 short paragraphs before a visible action.
- The homepage must work for 3 user types:
  - New visitor who wants to learn.
  - Trader who wants to track trades.
  - Returning user who wants to open dashboard.

## Section Specs

### 1. Header

Component:

- `PublicHeader`

Purpose:

- Give users stable navigation without stealing attention from the hero.

Desktop elements:

- Logo.
- Core navigation only.
- Login.
- Primary CTA:
  - logged out: `Sign Up Free`
  - logged in: `Dashboard`

Mobile elements:

- Logo.
- Compact menu button.
- Primary CTA can be hidden inside menu if the header becomes cramped.

Requirements:

- Header must remain visually lighter than the hero.
- Do not add a second "Start Here" button beside `Sign Up Free`.
- If `/get-started` is needed, place it in the mobile/menu or later page CTA, not as a competing header action.

Verification:

- Header has no horizontal overflow at `390px`.
- Header CTA does not wrap.
- Header does not cover hero content.

### 2. Hero

Component:

- `SaaSHeroSection`

Purpose:

- Make the value proposition memorable in the first 5 seconds.

Recommended hero message:

```text
Turn Your Trade History Into Your Next Move
```

Recommended subcopy:

```text
Sync MT5 trades, review what happened, and get one focused weekly action to improve your trading.
```

Desktop elements:

- Badge: `Free MT5 sync + weekly coach reports`
- H1.
- Short subcopy.
- Primary CTA:
  - logged out: `Start Free Journal`
  - logged in: `Open Dashboard`
- Secondary CTA:
  - `Explore Guides` or `See Setup Path`
- Trust microcopy:
  - `No credit card required`
  - `Works with MT5 sync`
  - `Free plan available`

Mobile elements:

- Same content, single column.
- CTA buttons stacked.
- Keep H1 readable, not oversized.

Requirements:

- H1 must not be generic like `Take Your Trading To The Next Level`.
- H1 must say what the product does.
- Subcopy must mention the transformation: trade history -> insight/action.
- Use gold only for the key phrase, not the entire H1.

Verification:

- Above the fold contains one primary action.
- H1 does not wrap into too many awkward short lines on mobile.
- CTA link is correct for logged-in and logged-out states.

### 3. Trust Metrics Strip

Component:

- `HomeTrustMetrics`

Purpose:

- Give proof that the system is alive, active, and useful.

Current metrics:

- `Trading Guides`
- `Academy Lessons`
- `Connected Accounts`
- `Synced Trades`
- `Coach Reports`

Desktop elements:

- One horizontal metrics strip.
- Each item has:
  - icon
  - label
  - value
- Equal spacing and consistent visual weight.

Tablet elements:

- 3 + 2 grid or horizontal scroll only if absolutely necessary.

Mobile elements:

- 2-column grid, or compact horizontal scroll with snap.
- Values must remain readable.

Requirements:

- Do not let the strip look like a random dashboard widget.
- Make labels secondary and values primary.
- Keep icons aligned to a single baseline.
- Avoid vertical dividers if they make the block feel uneven.

Verification:

- Metrics are balanced at `1440px`, `1024px`, and `390px`.
- Labels do not wrap awkwardly.
- Values are visually stronger than labels.

### 4. Start By Goal

Component:

- `StartByGoalSection`

Purpose:

- Reduce decision fatigue by giving users clear entry paths.

Desktop elements:

- Section title: `What do you want to improve today?`
- Supporting copy.
- 4 intent cards:
  - `Learn Trading`
  - `Track My Trades`
  - `Calculate Risk`
  - `Compare Brokers`

Card elements:

- Icon.
- Title.
- One-line description.
- Action label.

Mobile elements:

- Single-column cards.
- Each card is a clear tap target.

Requirements:

- Cards must not all look like equal final CTAs if one is strategically most important.
- `Track My Trades` can receive subtle gold emphasis.
- Keep descriptions short.
- Avoid adding too many options.

Verification:

- User can understand each path without reading the whole page.
- No card title wraps badly at mobile width.
- Links go to the correct route.

### 5. Trending Topics

Location:

- Inline inside `src/app/page.tsx`

Purpose:

- SEO discovery and lightweight browsing.

Desktop elements:

- Section title: `Trending Topics`
- Topic pills.
- Article count badge per topic.
- Dot/firefly background can stay if subtle.

Mobile elements:

- Pills wrap cleanly.
- No tiny text.

Requirements:

- Keep this block visually light.
- Do not make topic pills compete with primary CTAs.
- Counts should be small secondary chips.

Verification:

- Topic pills link to `/knowledge?category={slug}`.
- Pills do not overflow on mobile.

### 6. Popular Guides

Location:

- Inline inside `src/app/page.tsx`

Purpose:

- SEO depth, content authority, and immediate reading value.

Desktop elements:

- Section title: `Popular Guides`
- `Explore Library` link.
- 3-column article cards.
- Each card:
  - thumbnail
  - trending badge
  - read time
  - category pill
  - title
  - author
  - simple stats
- Compact `Latest Updates` row below.

Tablet elements:

- 2-column article cards.

Mobile elements:

- Single-column article cards.
- Latest updates become vertical list.

Requirements:

- Article cards should be content-first.
- Keep one primary badge only.
- Avoid overlaying too much text on images.
- Latest updates must stay compact and not duplicate Popular Guides.

Verification:

- Cards link to `/articles/{slug}`.
- Images use valid alt text.
- Titles are clamped cleanly.
- No image layout shift.

### 7. Content To Product CTA

Component:

- `HomeSectionCTA`

Purpose:

- Bridge the SEO/content experience into the trading journal product.

Desktop elements:

- Compact callout.
- One concise headline.
- One subcopy line.
- Primary CTA.

Mobile elements:

- Stacked content and CTA.
- CTA full width.

Recommended copy:

```text
Ready to turn reading into progress?
Sync your trades and get one practical action from your next review.
```

Requirements:

- Do not make this block oversized.
- Do not repeat the hero copy exactly.
- This CTA should prepare the user for the product preview below.

Verification:

- CTA does not compete visually with the hero CTA.
- Copy connects guide-reading to trade improvement.

### 8. Trade Journal Product Preview

Component:

- `TradeJournalPreviewSection`

Purpose:

- Show the product outcome: connect trades, analyze patterns, improve with action.

Use the detailed section plan:

- `trade-journal-preview-section-premium-ui-plan.md`

Desktop elements:

- Left:
  - `Three steps to your trading edge`
  - 3 step cards: `Connect`, `Analyze`, `Improve`
  - CTA row:
    - `Start Free Journal` or `Go to Dashboard`
    - `View Setup Path`
- Right:
  - bright dashboard preview
  - metric cards
  - chart
  - `Weekly Coach`
  - recent trades

Tablet/mobile:

- Follow the responsive contract in the specific section plan.

Requirements:

- Dashboard preview must not look disabled.
- Step 3 must feel like the destination.
- Weekly Coach card is the focal point.

Verification:

- CTA text does not wrap at `1024px`.
- Mobile is single column with full-width CTAs.

### 9. Spreadsheet Comparison

Component:

- `SpreadsheetComparisonSection`

Purpose:

- Position the journal product against manual spreadsheets.

Desktop elements:

- Comparison layout:
  - old way: spreadsheet/manual notes
  - new way: synced review/action plan
- CTA to start.

Mobile elements:

- Stack comparison cards.

Requirements:

- Make the pain specific:
  - manual notes get abandoned
  - P/L alone does not explain behavior
  - repeated mistakes stay hidden
- Avoid attacking spreadsheets too aggressively.

Verification:

- Difference between old/new is clear in 3 seconds.
- CTA route matches logged-in/logged-out state.

### 10. Tools Preview

Component:

- `ToolsPreviewSection`

Purpose:

- Show practical free tools without distracting from the journal product.

Desktop elements:

- Market hours.
- Economic calendar preview.
- Calculator/tool links.

Mobile elements:

- Stack cards.
- Use concise labels.

Requirements:

- Tools should feel useful, not like filler.
- Keep the next economic event readable.
- Avoid too many tool cards.

Verification:

- Event data fallback works if no event exists.
- Cards do not overflow.

### 11. Market Ticker

Component:

- `MarketTickerSection`

Purpose:

- Add market context and live-feeling motion.

Requirements:

- Keep ticker compact.
- Do not let motion distract from reading.
- Respect reduced motion if supported.

Verification:

- No layout jump while ticker loads.
- Ticker does not cause horizontal page overflow.

### 12. Academy Preview

Location:

- Inline academy section + `LearningPathTimeline`

Purpose:

- Connect learning with safer trading behavior.

Desktop elements:

- H2:
  - `Build your foundation before increasing risk`
- Subcopy.
- Learning timeline.
- CTA: `Start Learning Now`

Mobile elements:

- Timeline stacks clearly.
- CTA full width if needed.

Requirements:

- Keep this as an education layer, not a second product hero.
- Copy should make education feel practical.
- Do not over-decorate the timeline.

Verification:

- CTA links to `/academy`.
- Timeline labels are readable on mobile.

### 13. Reviews

Component:

- `ReviewsSection`

Purpose:

- Build social proof and trust.

Desktop elements:

- Section title.
- Review cards.
- Names/roles if available.
- Specific outcome statements.

Mobile elements:

- Single-column or horizontal cards with readable text.

Requirements:

- Reviews should sound specific, not generic.
- Avoid too many cards if they dilute trust.

Verification:

- Review cards have consistent heights where possible.
- Text contrast is accessible.

### 14. Trusted Partners

Component:

- `TrustedPartners`

Purpose:

- Show external ecosystem resources.

Current required direction:

- Prop Trading Firms must remain removed.

Allowed groups:

- Forex brokers.
- Crypto exchanges.
- VPS hosting.

Desktop elements:

- 2-column or 3-column partner groups depending on content.
- Each group:
  - icon
  - title
  - subtitle
  - top partner rows
  - `View All` if route exists

Mobile elements:

- One group per row.

Requirements:

- No `Prop Trading Firms`.
- No FTMO, The5ers, Moneta Funded.
- Partner cards should feel quieter than product CTA sections.

Verification:

- Search source for:
  - `Prop Trading`
  - `FTMO`
  - `The5ers`
  - `Moneta Funded`
  - `funded-challenge`
- None should appear in user-facing homepage code.

### 15. Web Forex Tools

Component:

- `WebForexTools`

Purpose:

- Provide quick utility and SEO/tool discovery.

Requirements:

- Keep this compact.
- Do not duplicate `ToolsPreviewSection` too heavily.
- If it overlaps with Tools Preview, make one block a compact link strip.

Verification:

- Tool links are valid.
- Block does not feel like another partner section.

### 16. Broker Rankings

Component:

- `BrokerRankingsSection`

Purpose:

- Serve comparison intent and SEO.

Desktop elements:

- Clear section title.
- Broker comparison cards/list.
- CTA to broker rankings.

Mobile elements:

- Simple list.
- Avoid dense tables on mobile.

Requirements:

- Copy must distinguish broker comparison from partner promotion.
- Keep disclaimers nearby if rankings involve affiliate links.

Verification:

- Links work.
- No prop firm references.
- Disclaimers are not hidden.

### 17. Trust Disclaimer

Component:

- `HomeTrustDisclaimer`

Purpose:

- Keep affiliate/trading claims transparent.

Requirements:

- Compact but readable.
- Do not bury it behind tiny low-contrast text.

Verification:

- Text readable at mobile width.

### 18. FAQ

Component:

- `HomeFAQSection`

Purpose:

- Reduce friction before signup.

Recommended FAQ topics:

- Is TheNextTrade free?
- How does MT5 sync work?
- Do I need an EA?
- Can I manually log trades?
- What is Weekly Coach?
- What data is stored?
- Does it support mobile-only traders?

Requirements:

- Answers should be direct.
- Use user language, not internal product terms.
- Include links where useful.

Verification:

- FAQ content does not contradict current product behavior.
- Mobile accordion is easy to tap.

### 19. New Here Setup Path Callout

Location:

- Inline block near the bottom of `src/app/page.tsx`

Purpose:

- Give a soft final guidance CTA.

Desktop elements:

- Icon.
- Headline: `New here? Start with the setup path`
- Subcopy.
- CTA: `See setup path`

Mobile elements:

- Stack text and CTA.
- CTA full width.

Requirements:

- Keep this near the end.
- Do not duplicate header CTAs.
- This is a guide CTA, not the main conversion CTA.

Verification:

- CTA links to `/get-started`.
- Text does not wrap awkwardly.

### 20. Newsletter

Component:

- `NewsletterSection`

Purpose:

- Capture users not ready to sign up.

Desktop elements:

- Headline.
- Value-focused subcopy.
- Email input.
- Submit button.

Mobile elements:

- Stacked input and button.

Requirements:

- Make promise specific:
  - trading guides
  - weekly improvement notes
  - product updates
- Avoid generic newsletter copy.

Verification:

- Form handles success and error states.
- Button has loading state if async.

### 21. About Us

Component:

- `AboutUsSection`

Purpose:

- Build brand trust and explain why TheNextTrade exists.

Requirements:

- Keep it concise on homepage.
- Link to `/about` for full story.
- Do not add a wall of text.

Verification:

- Section does not feel heavier than product sections.

### 22. Daily Quote

Location:

- Bottom quote block with `QuoteDisplay`

Purpose:

- Give a memorable emotional ending.

Requirements:

- Keep it calm and elegant.
- Avoid making the bottom of homepage feel random.
- If quote feels disconnected, add a small label like `Trading mindset`.

Verification:

- Quote block does not create excessive page length.
- Firefly/dot effects do not hurt readability.

## Recommended Section Order

Keep the current order mostly intact, with these adjustments:

1. Keep `SaaSHeroSection` first.
2. Keep `HomeTrustMetrics` immediately after hero.
3. Keep `StartByGoalSection` early.
4. Keep `Trending Topics` and `Popular Guides` before the product preview.
5. Keep `HomeSectionCTA` as a bridge before `TradeJournalPreviewSection`.
6. Keep `TradeJournalPreviewSection` after content discovery, not immediately after Start By Goal.
7. Keep `SpreadsheetComparisonSection` immediately after product preview.
8. Keep tools, academy, reviews, partners, rankings, FAQ, newsletter after that.
9. Keep final setup path CTA near the bottom.

Do not add new large sections unless an existing section is removed or merged.

## Responsive Contract

### Desktop: `>= 1280px`

Expected:

- Hero is centered and focused.
- Metrics strip is horizontal and balanced.
- Start-by-goal cards use a 4-column grid.
- Popular Guides use 3 columns.
- Product preview uses 2 columns.
- Reviews/partners/tools use multi-column layouts.
- Final CTA blocks are compact, not full-page heroes.

Failure conditions:

- Too many CTAs visible in one viewport.
- Dashboard/product previews look dim.
- Section backgrounds feel inconsistent.
- Large empty gaps between sections.

### Tablet: `768px - 1279px`

Expected:

- Hero remains centered.
- Metrics use 2 or 3 columns.
- Start-by-goal uses 2 columns.
- Article cards use 2 columns.
- Product preview stacks earlier if cramped.
- CTA text never wraps awkwardly.

Failure conditions:

- Two-column layouts squeeze text.
- Buttons grow taller due text wrapping.
- Product previews become unreadable.
- Section rhythm becomes too dense.

### Mobile: `< 768px`

Expected:

- Single-column page.
- Primary CTA is always easy to tap.
- Cards stack with consistent spacing.
- Article thumbnails stay stable.
- Partner/tool lists become compact.
- Footer and bottom sections remain readable.

Failure conditions:

- Horizontal scroll.
- Header covers content.
- Buttons wrap to two lines.
- Large decorative backgrounds reduce readability.
- Any card content overflows its container.

## Performance Rules

Preserve the current dynamic import strategy in `src/app/page.tsx`.

Requirements:

- Keep heavy below-fold sections dynamically imported.
- Do not add client components unless interaction requires it.
- Do not add large animation libraries for simple effects.
- Keep image sizes constrained with `next/image`.
- Keep skeleton heights stable enough to prevent layout shift.
- Avoid duplicating dot/firefly effects too many times if it impacts performance.

Verification:

- `npm run type-check`
- `npm run lint`
- `npx next build`
- Playwright desktop/tablet/mobile smoke test.
- No console errors on `/`.
- No obvious layout shift while sections load.

## Accessibility Rules

Requirements:

- All icon-only buttons need accessible labels.
- CTAs need visible focus states.
- Text contrast must pass on light and dark mode.
- Card hover states must not be the only way to understand links.
- Heading order should be logical:
  - one H1 in hero
  - section titles as H2
  - card titles as H3 where appropriate
- Do not use tiny uppercase text as the only meaningful label.

Verification:

- Keyboard can reach header, CTAs, cards, newsletter form.
- Focus ring is visible.
- Mobile tap targets are at least `44px`.

## SEO Rules

Requirements:

- Homepage H1 should be product/value focused.
- Keep article content crawlable.
- Keep Popular Guides and Trending Topics server-rendered where possible.
- Do not hide important article links behind client-only interactions.
- Preserve category and article links:
  - `/knowledge?category={slug}`
  - `/articles/{slug}`
- Avoid duplicate generic headings.

Recommended SEO narrative:

- Hero: trading journal + MT5 sync + weekly coach.
- Content sections: guides and topics.
- Product sections: trade sync and weekly action plan.
- Trust sections: reviews, partners, disclaimers, FAQ.

Verification:

- Page has one H1.
- Main sections have meaningful headings.
- Article links are present in rendered HTML.

## Implementation Tasks

- [ ] Task 1: Audit current homepage screenshots at `1440px`, `1024px`, and `390px`.
  - Verify: identify sections with spacing, CTA, contrast, or wrapping issues.
- [ ] Task 2: Normalize global homepage section rhythm.
  - Verify: section spacing feels consistent; no sudden oversized or cramped blocks.
- [ ] Task 3: Polish hero copy and CTA hierarchy.
  - Verify: one primary CTA is obvious above the fold.
- [ ] Task 4: Finalize trust metrics strip.
  - Verify: metric labels/values are aligned and balanced on all breakpoints.
- [ ] Task 5: Polish Start By Goal and keep it separated from product preview.
  - Verify: user intent cards are readable and links work.
- [ ] Task 6: Keep Popular Guides and Latest Updates clean, content-first, and SEO-friendly.
  - Verify: article cards are readable and image layout is stable.
- [ ] Task 7: Polish product narrative blocks.
  - Verify: `HomeSectionCTA`, `TradeJournalPreviewSection`, and `SpreadsheetComparisonSection` tell one continuous story.
- [ ] Task 8: Simplify lower-page utility/trust sections.
  - Verify: tools, partners, rankings, FAQ, newsletter, and about sections do not feel repetitive.
- [ ] Task 9: Remove or prevent all prop firm remnants from homepage.
  - Verify: source search shows no user-facing prop firm references.
- [ ] Task 10: Run full verification.
  - Verify: type-check, lint, build, and responsive Playwright smoke test pass.

## Done When

- [ ] Homepage has a clear story from hero to final CTA.
- [ ] User can choose to learn, track trades, calculate risk, or compare brokers within the first few sections.
- [ ] Product value is clear without reading every section.
- [ ] Article/content SEO remains strong.
- [ ] CTA hierarchy is clean and not noisy.
- [ ] No prop trading firms or funded challenge references remain on homepage.
- [ ] Desktop, tablet, and mobile layouts have no overflow.
- [ ] Page feels premium, fast, and trustworthy.
- [ ] Type-check, lint, and build pass.
