# TradeCoin Underground-Inspired Product Improvement Plan

**Project:** TheNextTrade  
**Status:** Implementation-ready specification  
**Audience:** Gemini / Claude / engineering team  
**Primary goal:** Learn from the useful product patterns of TradeCoinUnderground while preserving TheNextTrade's identity as a trading journal, analytics, education, and improvement system.

## 1. Product Decision

TradeCoinUnderground combines market content, crypto/forex information, signals, education, leaderboard, community, and partner offers. TheNextTrade should not copy that entire model.

TheNextTrade's stronger product promise is:

> Sync real trading history, understand what happened, and turn the evidence into one practical next action.

The implementation must therefore improve four areas:

1. **Trustworthy public performance proof** through a clearer leaderboard and public trader card.
2. **Market context** through an educational economic calendar that can be connected to journal analysis.
3. **Opt-in community learning** through anonymized trading lessons, not signals or copy trading.
4. **Academy activation** through clearer progress and the next lesson, without rebuilding the existing course system.

These upgrades must make the product feel more professional without turning the homepage or dashboard into a crowded portal.

## 2. What We Learned

The reference product demonstrates several patterns worth adapting:

### 2.1 Academy path

- Courses are grouped by learning level.
- Each course exposes lesson count, duration, access status, and progress.
- The user can understand the next step without opening several pages.
- The course page recommends what the user should do after finishing.

### 2.2 Public performance proof

- Rankings have multiple views instead of one unexplained score.
- The product explains eligibility and calculation rules.
- Each trader row shows enough context to compare participants.
- The user can open a public profile instead of trusting an anonymous number.

### 2.3 Economic event context

- Events show date, time, currency/country, impact, forecast, previous, and actual values.
- Users can filter the calendar instead of scanning an unstructured list.
- The page explains important events in plain language.
- Timezone is explicit.

### 2.4 Community loop

- Community activity gives users a reason to return.
- The useful unit is a contribution or learning insight, not an endless chat feed.
- Community content can be connected to education and performance.

## 3. Explicit Non-Goals

Do **not** implement the following as part of this plan:

- AI buy/sell signals or trade calls.
- Demo trading or paper-trading execution.
- Copy trading, strategy mirroring, or guaranteed returns.
- Backcom/affiliate-heavy funnels.
- A crypto news portal, live ticker wall, heatmap, or market media homepage.
- A new Sao Do-style points system. TheNextTrade keeps **Edge** as its branded progression system.
- A second Academy platform.
- A second weekly coach/report system.
- Fake performance data, fake community posts, or placeholder event data in production.

If a proposed change falls into a non-goal, stop and ask for an explicit product decision before coding.

## 4. Current Product Map

Use the existing routes and components as the starting point. Do not create duplicate routes for an existing capability.

| Area | Existing route | Existing role | Required treatment |
|---|---|---|---|
| Leaderboard | `/dashboard/leaderboard` | Edge rankings, tabs, personal stats | Upgrade methodology, filters, data trust, and mobile layout |
| Public trader profile | `/trader/[username]` | Public trading card | Add verification, sample size, period, data freshness, and privacy rules |
| Community | `/community` | Public community surface | Add opt-in learning insights only if the existing page supports it; do not create chat first |
| Economic calendar | `/tools/economic-calendar` | Existing public calendar/tool | Improve filters and connect it to journal context; do not create a duplicate calendar route |
| Academy | `/dashboard/academy` and `/academy` | Learning path, lessons, quizzes, certificates | Add progress/next lesson/inactivity guidance only |
| Weekly reports | `/dashboard/reports/weekly` | Weekly review and action plan | Reuse as the destination for actions; do not duplicate weekly coaching |
| Intelligence | `/dashboard/intelligence` | AI analysis and risk insights | Allow calendar context to inform analysis only when evidence is sufficient |
| Missions | `/dashboard/missions` | Edge missions and activation | Add only links that help users take the next action |

## 5. Priority and Delivery Order

### P0: Trustworthy leaderboard and public proof

This is the highest priority because public rankings are visible proof of product quality. Incorrect or unexplained rankings damage trust.

### P1: Economic calendar and journal context

The calendar already exists as a tool. The upgrade is to make it useful to a trader reviewing real trades, without pretending that an event caused a result when the data cannot prove causation.

### P1: Opt-in community learning insights

This creates a return loop and social proof while preserving user privacy. It must be moderated and must not become a signal channel.

### P2: Academy activation polish

This is a low-risk improvement to an existing fixed feature. Do not redesign the Academy data model or course structure.

## 6. P0 - Leaderboard Upgrade

### 6.1 User-facing outcome

When a user opens `/dashboard/leaderboard`, they must understand:

- What is being ranked.
- Which time period is active.
- How many trades qualify.
- When the data was refreshed.
- Why a user is or is not eligible.
- How to open a public trader card.

The page must never imply that the top-ranked trader is automatically the safest or most profitable trader in the future.

### 6.2 Tabs and ranking views

Keep the existing Edge identity. Add or complete these views only if the underlying data is available:

1. **Edge Ranking** - the branded composite progression score.
2. **Win Rate** - closed-trade win rate for the selected period.
3. **Net P&L** - net realized P&L for the selected period, displayed with currency context.
4. **My Stats** - the current user's rank, percentile, qualifying trade count, and improvement areas.

Do not display a metric tab that uses fallback or incomplete data. If a metric cannot be computed, show `Not enough data` and explain the minimum requirement.

### 6.3 Period filters

Provide a clear period control:

- `7D`
- `30D` (default)
- `90D`
- `All time`

Rules:

- The selected period must be visible beside the leaderboard title.
- Every row and metric must use the same period.
- The URL should preserve the selected tab and period when practical, for example `?tab=edge&period=30d`.
- Changing period must not silently retain values from the previous period.
- Show `As of <localized timestamp>` and a relative freshness indicator.
- If the selected period has no qualifying data, show an intentional empty state.

### 6.4 Eligibility rules

Use one shared server-side eligibility service. Do not duplicate the rules in React components, API routes, and database queries.

Minimum rules for the initial release:

- Only **closed** trades count toward win rate, P&L, trade count, and Edge performance inputs.
- Pending/open positions do not count until closed.
- Duplicate imports must be excluded using the existing trade identity/deduplication rules.
- Deleted, invalid, test, or quarantined trades must be excluded.
- A user must explicitly enable public profile/leaderboard participation.
- A user must have at least **10 qualifying closed trades** before appearing in Win Rate ranking.
- A user must have at least **10 qualifying closed trades** before appearing in Net P&L ranking.
- Edge ranking may use its existing eligibility rules, but those rules must be displayed in the methodology UI.
- One-trade 100% win rate must never appear as a meaningful ranking result.
- A user without enough data may still view their own progress, but must not be ranked as a qualified public participant.
- A user who disables public visibility must disappear from public rankings after cache invalidation.

If the existing product already has stricter eligibility rules, preserve the stricter rules and document the final values. Never weaken an existing safety or privacy rule silently.

### 6.5 Ranking calculation rules

Implement calculations in a server-side domain service. The UI must receive computed values, not reconstruct them from partial rows.

Required behavior:

- Win rate = winning closed trades / qualifying closed trades x 100.
- Breakeven trades must be classified consistently and documented. The default recommendation is to exclude breakeven trades from wins and losses, while still showing them in total trades.
- Net P&L = sum of realized P&L for qualifying closed trades in the selected period.
- Edge is the existing branded score. Do not rename it to Sao Do, XP, or a competitor term.
- Currency and sign must be explicit for P&L.
- Percentages must be rounded consistently across leaderboard, public card, and reports.
- Ties must use a deterministic secondary sort, such as qualifying trade count and last activity timestamp.
- No ranking may use account balance as a proxy for skill.
- No ranking may expose account number, broker login, investor password, API key, or raw account identity.

### 6.6 Leaderboard UI

Keep the existing medal strip/table direction but make the information calmer and more comparable:

- Top 3 must be a compact medal strip or balanced horizontal layout, not oversized podium cards.
- The top 3 must not consume most of the first viewport.
- Every top-3 item must expose the same fields: rank, avatar, display name, primary metric, qualifying trades, and profile link.
- Do not visually imply certainty from medal color alone.
- The ranking table must use stable column widths on desktop and a deliberate stacked row on mobile.
- Use one primary CTA: `View Trader Card` or `View My Stats`, depending on context.
- Add a methodology/info button with a tooltip and a modal/drawer explaining eligibility, formulas, period, and privacy.
- Keep the Gold + teal visual language. Use gold for rank emphasis and teal for healthy/progress states; do not copy the reference site's palette.
- Do not use a large gradient hero, decorative blobs, or animated numbers that make comparison harder.

### 6.7 Empty, loading, and error states

Implement all states explicitly:

- Loading: skeleton rows with stable dimensions.
- No qualified traders: explain the minimum data requirement and link to `Accounts & Props` or `Trading Journal`.
- User not eligible: show their private progress and the exact missing requirement.
- API failure: show a retry action and a neutral message; never show stale-looking zeroes as if they were real.
- Partial data: label the affected metric as unavailable instead of mixing periods.

## 7. P0 - Public Trader Card Upgrade

### 7.1 Route and purpose

Keep `/trader/[username]` as the canonical public profile. The card is proof of journaling discipline and observed performance, not a trade signal or promise.

### 7.2 Required content

Show:

- Display name, avatar, username, and optional Edge level.
- Public profile verification state.
- Selected period, for example `Last 90 days`.
- Qualifying closed-trade count.
- Win rate, average R:R, and Edge/trade score only when sample thresholds are met.
- Top three symbols/pairs by qualifying closed-trade count, not an arbitrary long list.
- Achievement badges earned from real product events.
- Last data refresh time.
- Data source statement: `Based on synced closed trades` or the correct source.
- A methodology link.
- A clear disclaimer that the card is historical information and not financial advice.

Hide:

- Broker account number.
- Login credentials and API keys.
- Account balance/equity unless the user explicitly chooses a safe public value and the product owner approves the rule.
- Exact entries/exits of recent trades by default.
- Private journal notes, screenshots, or personal metadata.

### 7.3 Share behavior

- Share must copy a canonical public URL.
- Open Graph data must use the same period and public metrics as the page.
- Never include private fields in OG metadata.
- A share preview must not claim `best trader`, `guaranteed`, `profitable`, or similar unsupported language.
- If the profile is disabled or deleted, the public route must return the correct not-found/private state.

## 8. P1 - Economic Calendar and Trading Context

### 8.1 Existing route

Use `/tools/economic-calendar` as the existing calendar surface. Do not create `/dashboard/calendar` unless a later product decision requires a separate authenticated experience.

### 8.2 Calendar data contract

Every event displayed in the product must have:

- Stable internal `id`.
- External source/provider identifier.
- Event title.
- Country and currency.
- Impact: `LOW`, `MEDIUM`, or `HIGH`.
- Scheduled timestamp stored in UTC.
- Forecast, previous, and actual values when supplied by the source.
- Source name and source URL.
- Event status: scheduled, released, revised, cancelled, or unavailable.
- Last synchronized timestamp.

Data rules:

- Store UTC; convert only at the presentation layer.
- Default display timezone must follow the user's saved timezone, then browser timezone, then the product default.
- The UI must visibly show the active timezone.
- Events with missing actual values must not render fake zeroes.
- Revisions must not overwrite history without preserving the source update timestamp.
- External provider access must go through an adapter. Do not call a provider directly from a client component.
- Provider credentials must stay server-side and be read from environment variables.
- If no provider is configured, show a clear `Calendar data unavailable` state instead of invented events.

### 8.3 Calendar UX

Keep and improve:

- This week / next week / date range filters.
- High-impact filter.
- Currency/country filter.
- Search by event.
- Compact list view on mobile.
- Event detail drawer with plain-language explanation.
- Educational links for FOMC, CPI, NFP, PCE, GDP, and similar events.

Do not add a trading signal, direction, or “buy/sell before news” recommendation.

### 8.4 Journal integration

Add contextual links, not aggressive alerts:

- On a journal trade detail, show nearby high-impact events only when the trade's open/close timestamp and symbol/currency mapping are reliable.
- Label it as `Market context`, not `Cause of result`.
- If the event is within a configurable window, display the event and source timestamp.
- Do not state that the event caused a win/loss without a statistically supported, user-visible analysis.
- Weekly reports may mention event exposure only when there is enough data and the statement is phrased as an observation.
- Allow users to open the calendar from the context card.

## 9. P1 - Community Learning Insights

### 9.1 Product shape

Use `/community` as the public community surface. The first release is an insight feed, not live chat.

The feed should contain short, opt-in learning notes such as:

- What the trader noticed.
- What rule they followed.
- What they will change next.
- Which product area helped: journal, report, academy, or mission.

The feed must not be a place for:

- Buy/sell calls.
- Broker promotion disguised as education.
- Performance guarantees.
- Private trade data.
- Unmoderated claims about another user.

### 9.2 Privacy and consent

Add or reuse public-profile settings:

- `Show my public trader card`.
- `Allow my anonymized learning insight in Community`.
- `Show display name` versus `Post anonymously`.
- `Allow comments/reactions` if those features are actually implemented.

Defaults:

- Community publishing is OFF by default for existing users.
- A user must explicitly confirm before publishing their first insight.
- Removing consent must hide future visibility and mark existing posts for removal/review according to the retention policy.
- Never infer consent from public leaderboard participation.

### 9.3 Moderation workflow

Required states:

- Draft.
- Pending review.
- Published.
- Hidden by author.
- Rejected.
- Removed by moderator.

Admin requirements:

- Admin queue with filters by status, category, report count, and date.
- View the original submitted text and moderation reason.
- Approve, reject, hide, restore, and mark spam.
- Audit every moderation action with actor and timestamp.
- Rate-limit creation and reporting.

### 9.4 Community UI

- Use a calm feed with category chips: `Process`, `Risk`, `Psychology`, `Review`, `Learning`.
- Keep one clear CTA: `Share a lesson learned`.
- Show source context without exposing private trades.
- Link a published insight to the author's public trader card only when the author chose attribution.
- Provide report/hide controls.
- Use a useful empty state that directs the user to create their first journal review or complete an Academy lesson.
- Do not add infinite auto-loading before moderation and pagination are reliable.

## 10. P2 - Academy Activation Polish

### 10.1 Scope

Keep the existing Academy content, levels, modules, lessons, quizzes, and certificates. This is an activation polish, not a rebuild.

### 10.2 Required improvements

On `/dashboard/academy` show:

- Current learning path.
- Next incomplete lesson.
- Progress percentage based on real completed lessons.
- Last lesson activity.
- Estimated remaining lessons when the data exists.
- A friendly inactivity reminder when the user has not studied for a configurable period, initially 7 days.
- A direct `Continue learning` CTA.

Rules:

- Do not show an inactivity warning for a user with no Academy enrollment or no available lesson.
- Do not show a reminder immediately after completing a lesson.
- The reminder must be dismissible and should not reappear on every page load after dismissal for the configured cooldown.
- Use the actual `lastLessonAt`; never derive activity from login time.
- If progress data is unavailable, show `Progress unavailable` rather than fake percentages.
- Completed paths should show the next optional path or a completion state, not a broken empty card.
- Link recommended content to an existing lesson/article; never invent a route.

## 11. Shared Design System Rules

### 11.1 Visual direction

- Preserve TheNextTrade's Gold + teal identity.
- Gold is for emphasis, achievement, primary CTA, and important highlights.
- Teal is for healthy states, progress, confirmation, and live/verified status.
- Use neutral surfaces for dense data.
- Keep light mode as the default public experience and ensure dark mode tokens remain readable.
- Do not copy TradeCoinUnderground's branding, name, labels, iconography, or Sao Do terminology.

### 11.2 Layout

- One primary action per section.
- Avoid stacking multiple banners that communicate the same thing.
- Preserve stable dimensions for cards, rows, avatars, and loading states.
- Use responsive tables or deliberate mobile cards; never allow columns to collide or wrap into unreadable fragments.
- Keep important data visible above the fold, but do not make hero blocks consume the entire page.
- Use familiar Lucide icons and tooltips for unfamiliar controls.
- No decorative UI should compete with ranking, metric, event, or action content.

### 11.3 Copy rules

- Say what the metric means in plain language.
- Always include sample size and time period for performance metrics.
- Do not use unsupported superlatives such as `best`, `guaranteed`, or `proven winner`.
- Use historical language: `observed`, `recorded`, `based on synced trades`.
- Explain unavailable data instead of hiding it.
- All financial education disclaimers must be visible at the relevant point of use, not only in a footer.

## 12. Data and Architecture Rules

### 12.1 Inspect before changing

Before adding a migration or endpoint, inspect:

- Prisma/schema files and existing enums.
- Current leaderboard queries and Edge calculation service.
- Public profile visibility fields.
- Existing calendar provider and synchronization flow.
- Existing community/admin moderation models.
- Existing report/intelligence data services.

Map existing names before introducing new names. Do not create duplicate tables or APIs because a similar capability already exists.

### 12.2 Suggested data additions only when missing

Use the existing ORM conventions and adapt names to the current schema. Add only missing concepts:

**Economic event**

- `externalId` + `source` unique constraint.
- `scheduledAtUtc`, `country`, `currency`, `impact`, `forecast`, `previous`, `actual`.
- `status`, `sourceUrl`, `syncedAt`.
- Indexes on `scheduledAtUtc`, `impact`, and `currency`.

**Community insight**

- `authorId` nullable when anonymous attribution is selected.
- `body`, `category`, `visibility`, `moderationStatus`.
- `publishedAt`, `createdAt`, `updatedAt`.
- Optional links to an existing report, lesson, mission, or public trader profile, never raw private trade IDs in public responses.
- Indexes on `moderationStatus`, `publishedAt`, and `category`.

**Moderation report/audit**

- `insightId`, reporter, reason, status, moderator, decision timestamp, audit note.

For leaderboard data, prefer a shared query/service and short-lived cache over a second denormalized ranking table unless profiling proves that persistence is required.

### 12.3 API rules

All new or changed API responses must:

- Enforce authentication/authorization server-side.
- Return stable typed fields.
- Include period, sample size, and freshness when returning performance metrics.
- Avoid leaking private account identifiers.
- Validate query parameters with the project's existing validation library.
- Use pagination for community and leaderboard lists.
- Return explicit empty/error states.
- Log request identifiers for admin debugging without logging secrets or full private content.

Suggested API responsibilities, to be mapped to existing conventions:

- `GET /api/dashboard/leaderboard?tab=edge&period=30d`
- `GET /api/tools/economic-calendar?...`
- `GET /api/community/insights?...`
- `POST /api/community/insights`
- `POST /api/community/insights/:id/report`
- Admin moderation endpoints under the existing admin API convention.

Do not implement these exact paths if an equivalent existing route already exists. Reuse the existing route and update its contract instead.

## 13. Performance and Reliability Rules

- Server-render first meaningful leaderboard/calendar content when the current architecture allows it.
- Do not fetch the same leaderboard or calendar data from multiple client components.
- Avoid waterfalls between profile, ranking, and metric requests.
- Cache public leaderboard results by `tab + period` with a short TTL and invalidate on relevant profile/privacy changes.
- Cache calendar data by date range and timezone-independent UTC data.
- Paginate community content; do not load every post at once.
- Use skeletons with fixed layout dimensions.
- No provider/network request from a client component for secret-backed data.
- Measure before and after with the existing performance tooling.
- Verify desktop and mobile loading, not only desktop screenshots.

## 14. Gemini Mandatory Pre-Code Checklist

Gemini must complete this checklist before writing code. A code change is not approved if the checklist is skipped.

### 14.1 Repository understanding

- [ ] Read `docs/FEATURE_SPECS.md` and the relevant route/component files.
- [ ] Locate the existing leaderboard, public trader card, community, economic calendar, Academy, report, and privacy implementations.
- [ ] Locate the schema, migrations, validation, auth, and API conventions.
- [ ] Search for duplicate or legacy routes before adding a new one.
- [ ] Confirm which requirements already exist and which are genuinely new.

### 14.2 Implementation checklist

- [ ] Write the exact files/routes/services to change.
- [ ] Write the data flow from database/provider to server service to UI.
- [ ] Write the eligibility and privacy rules in code comments or a nearby domain spec where the logic is non-obvious.
- [ ] Confirm no fake production data is needed.
- [ ] Confirm every external provider has an adapter, env configuration, timeout, and failure state.
- [ ] Confirm the feature will not duplicate Weekly Coach, Edge Missions, Academy, or Intelligence output.
- [ ] Confirm mobile, light mode, dark mode, loading, empty, and error states.
- [ ] Confirm financial disclaimer and privacy behavior.

### 14.3 Stop conditions before coding

Gemini must stop and ask for a decision if:

- The source data does not support a requested metric.
- A calculation conflicts with an existing product rule.
- A new provider or paid service is required but not configured.
- A privacy choice is ambiguous.
- The change would expose account numbers, credentials, or private journal content.
- The requested UI duplicates an existing feature.

## 15. Gemini Mandatory Post-Code Checklist

After coding, Gemini must run every relevant item and report the result. Do not report `complete` based only on a successful TypeScript build.

### 15.1 Automated verification

- [ ] Typecheck passes.
- [ ] Lint passes or all existing unrelated warnings are listed.
- [ ] Relevant unit/integration tests pass.
- [ ] Database migration applies cleanly to a fresh database and the current development database.
- [ ] No secret, API key, account number, or private journal field appears in client bundles or public responses.
- [ ] No new `any`/unsafe cast was added to bypass the data contract.

### 15.2 Playwright matrix

- [ ] `/dashboard/leaderboard` as an eligible user.
- [ ] `/dashboard/leaderboard` as an ineligible/new user.
- [ ] `/dashboard/leaderboard` with no ranking data.
- [ ] `/trader/[username]` public profile enabled.
- [ ] `/trader/[username]` private/deleted profile.
- [ ] `/community` as signed-out visitor.
- [ ] `/community` as opted-out user.
- [ ] `/community` create, cancel, submit, report, and moderation states if implemented.
- [ ] `/tools/economic-calendar` filters, timezone, missing values, and mobile layout.
- [ ] `/dashboard/academy` active learner, inactive learner, completed path, and missing-progress state.
- [ ] Light mode and dark mode.
- [ ] Desktop and mobile viewport.
- [ ] Browser console has no new errors.
- [ ] No horizontal overflow or overlapping controls.

### 15.3 Data verification

- [ ] Win rate uses closed qualifying trades only.
- [ ] Breakeven treatment matches the documented rule.
- [ ] Period switching changes every metric consistently.
- [ ] Minimum sample threshold blocks false rankings.
- [ ] Public visibility changes remove private profiles from rankings after invalidation.
- [ ] Calendar times remain correct when timezone changes.
- [ ] Missing actual/forecast values are not rendered as zero.
- [ ] Community posts cannot be published without the required consent.
- [ ] Admin moderation actions are audited.

### 15.4 Required handover report

Gemini must report:

- Changed files.
- Changed routes and URLs.
- Database migrations.
- New environment variables.
- Existing functionality intentionally preserved.
- Tests run and outcomes.
- Known limitations and follow-up items.
- Screenshots or Playwright evidence for UI changes.

## 16. Acceptance Criteria by Release

### P0 acceptance

- A user can select ranking tab and period without inconsistent metrics.
- Every public performance metric shows sample size and period.
- Users below the minimum sample are not publicly ranked as qualified.
- Methodology is discoverable and understandable.
- Public profile privacy is respected immediately after change.
- The page is usable on mobile without a broken table or oversized podium.

### P1 calendar acceptance

- Existing calendar route remains functional.
- Events are sourced from real configured data or show an honest unavailable state.
- Timezone and impact filters work together.
- Journal context never presents an unsupported causal claim.
- No provider secret reaches the browser.

### P1 community acceptance

- Existing public community page still works for visitors.
- Publishing requires authentication and explicit consent.
- Moderation status is enforced server-side.
- Private journal/account data is never exposed.
- The feed has pagination, empty, loading, error, and report states.

### P2 Academy acceptance

- The next lesson is derived from real progress.
- Inactivity reminder uses lesson activity, has a cooldown, and is dismissible.
- Completed learners do not see a dead-end card.
- Existing lesson, quiz, and certificate flows continue to work.

## 17. Rollout Plan

1. **Discovery:** complete the mandatory pre-code checklist and map existing code.
2. **P0 data/service:** finalize leaderboard eligibility and calculation tests.
3. **P0 UI:** update leaderboard, methodology, and public trader card.
4. **P1 calendar:** improve existing calendar data contract, filters, and journal context behind a feature flag if the provider is not yet production-ready.
5. **P1 community:** ship read-only feed first, then consented publishing, then moderation tools.
6. **P2 Academy:** add next-lesson and inactivity polish.
7. **QA:** run the full post-code checklist and Playwright matrix.
8. **Release:** enable each feature independently so a failed provider or moderation flow does not break the core journal.

## 18. Final Engineering Rules

These rules are mandatory:

1. Do not copy TradeCoinUnderground's brand, terminology, colors, text, assets, or layout one-to-one.
2. Do not build a signals/copy-trading product under the name of education.
3. Do not invent numbers, events, community activity, or achievements.
4. Do not expose private trading account data.
5. Do not duplicate an existing route, service, dashboard block, or weekly coach output.
6. Do not put provider keys in client code.
7. Do not claim causation from a calendar event without evidence.
8. Do not rank users using one lucky trade or an unexplained score.
9. Do not ship without the pre-code checklist and the post-code checklist.
10. When a requirement is ambiguous, preserve user safety and data integrity first, then ask for a product decision.

## Definition of Done

This plan is complete only when:

- P0 leaderboard and public proof are accurate, explainable, private by default, and responsive.
- P1 calendar is useful as market context without becoming a signal engine.
- P1 community is opt-in, moderated, paginated, and privacy-safe.
- P2 Academy clearly tells learners what to do next without duplicating the coach system.
- All required tests pass across desktop/mobile and light/dark modes.
- Documentation, routes, environment variables, migrations, and known limitations are handed over.
