# TraderWaves Gap Production Hardening Plan

## Goal

Make the TraderWaves-inspired upgrade production-ready, not just build-pass ready.

Current status:

- Core files/routes exist.
- Homepage smoke test passes.
- Public trader OG route is fixed.
- Build/type-check pass.

Remaining work:

- Authenticated user flows must be tested end-to-end.
- Privacy presets must be enforced across UI, public card, OG image, and share card.
- Rulebook, behavior goals, trade plans, and weekly coach must form one coherent improvement loop.
- Schema and existing user data must be safe before release.
- Lint/code quality debt from the new feature area should be reduced so future bugs are easier to see.

This plan is for final hardening and QA. Do not rebuild the features from scratch.

## Non-Negotiable Product Rule

The user should feel this loop:

1. Connect or log trades.
2. See sync health clearly.
3. Create rules and goals.
4. Plan a trade before execution.
5. Link the actual trade to the plan.
6. Review whether rules were followed or broken.
7. Weekly Coach turns this into one next action.
8. Public sharing is safe by default.

If a screen does not help that loop, keep it quiet.

## Current Source To Preserve

Do not remove these foundations:

- `src/lib/sync/sync-source.ts`
- `src/lib/sync-health.ts`
- `src/app/api/sync/health/route.ts`
- `src/components/trading-accounts/SyncHealthCenter.tsx`
- `src/components/trading-accounts/SyncHealthSummaryCard.tsx`
- `src/components/trading-accounts/SyncHealthAccountRow.tsx`
- `src/components/trading-accounts/SyncRecoveryAction.tsx`
- `src/lib/profile/privacy-presets.ts`
- `src/app/dashboard/settings/profile/ProfileClient.tsx`
- `src/app/api/og/trader/[username]/route.tsx`
- `src/app/dashboard/rules/page.tsx`
- `src/components/rules/RulebookClient.tsx`
- `src/actions/rulebook.ts`
- `src/actions/trade-plans.ts`
- `src/app/api/trade-plans/route.ts`
- `src/app/api/trade-plans/[id]/route.ts`
- `src/app/api/trade-plans/[id]/link-trade/route.ts`
- `src/components/journal/TradePlanList.tsx`
- `src/components/journal/TradePlanCard.tsx`
- `src/components/journal/TradePlanModal.tsx`
- `src/components/journal/PlanVsActualPanel.tsx`

## Phase 1: Lock Down Data And Migration Safety

### Task 1.1: Verify Prisma schema relations

Check:

- `TradePlan.userId -> User.id` cascades correctly.
- `TradePlan.accountId -> TradingAccount.id` does not delete user data unexpectedly.
- `TradePlan.journalEntryId` is unique and safe for one plan to one actual trade.
- `TradingRule.userId -> User.id` cascades correctly.
- `TradeRuleCheck.journalEntryId -> JournalEntry.id` cascades correctly.
- `TraderGoal.userId -> User.id` cascades correctly.

Files:

- `prisma/schema.prisma`

Implementation notes:

- Keep `TradePlan.journalEntryId @unique`.
- If deleting a trading account leaves trade plans orphaned, decide intentionally:
  - either use `onDelete: SetNull`
  - or block account deletion if plans exist
  - or cascade only if the product truly wants account deletion to remove plans

Verification:

```bash
npx prisma validate
npm run type-check
```

Done when:

- Prisma validates.
- No relation ambiguity.
- Deleting a user cleans up new feature data.
- Deleting an account does not unexpectedly destroy user learning history.

### Task 1.2: Add a syncSource backfill audit

Current source values may include:

- `MANUAL`
- `APP`
- `TNT`
- `TNT_CONNECT`
- `EA`
- `EA_SYNC`
- `EA_HISTORY`
- `MT5_SYNC`
- unknown legacy values

Create a one-time audit script:

- `scripts/audit-sync-source.ts`

Script behavior:

- Query distinct `TradingAccount.syncSource`.
- Print count per value.
- Print normalized value using `normalizeSyncSource`.
- Exit with non-zero only if an unrecognized value maps to `UNKNOWN` and account has sync evidence.

Suggested output:

```text
syncSource audit
APP: 14 -> TNT_CONNECT
EA_HISTORY: 3 -> EA_SYNC
MANUAL: 9 -> MANUAL
NULL/empty: 0
UNKNOWN_WITH_SYNC_DATA: 0
```

Optional migration/backfill:

- If existing production rows use `APP`, `TNT`, or `MT5_SYNC`, normalize them to `TNT_CONNECT`.
- If existing production rows use `EA` or `EA_HISTORY`, normalize them to `EA_SYNC`.
- Keep `MANUAL` unchanged.

Verification:

```bash
npx tsx scripts/audit-sync-source.ts
```

Done when:

- No synced account is reported as `UNKNOWN`.
- Account Hub, `/api/sync/status`, and `/api/sync/health` agree on the same label.

### Task 1.3: Add a production-safe feature flag check

Feature flags in `.env.example`:

- `NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER`
- `NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS`
- `NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS`
- `NEXT_PUBLIC_ENABLE_TRADE_PLANS`

Required behavior:

- If flag is missing, default should be safe.
- Missing flag must not crash the page.
- Disabled flag should hide the UI entry point but not break existing data.

Files to check:

- `.env.example`
- `src/app/dashboard/accounts/page.tsx` or account page client
- `src/app/dashboard/settings/profile/ProfileClient.tsx`
- `src/app/dashboard/rules/page.tsx`
- `src/components/journal/JournalList.tsx`

Verification:

- Temporarily set each flag to false locally.
- Confirm app still builds.
- Confirm protected route either hides feature or redirects to stable fallback.

Done when:

- Admin can turn a new feature off without breaking dashboards.

## Phase 2: Authenticated E2E Test Foundation

### Task 2.1: Create test users and storage states

Add a deterministic QA helper for Playwright:

- `tests/e2e/helpers/auth.ts`
- `tests/e2e/helpers/fixtures.ts`
- `tests/e2e/.auth/fresh-user.json`
- `tests/e2e/.auth/trader-with-data.json`
- `tests/e2e/.auth/public-profile-user.json`

Required user states:

1. Fresh user, no account, no trades.
2. User with account but no sync.
3. User with TNT account and trades.
4. User with EA account and trades.
5. User with stale/disconnected account.
6. User with public profile enabled.
7. User with public profile disabled.
8. User with rules and goals.
9. User with no rules and no goals.

If Supabase auth makes direct seeding difficult:

- Use existing dev login flow.
- Store `storageState`.
- Never commit real credentials.
- Use `.env.local` test credentials.

Suggested env vars:

```env
E2E_FRESH_EMAIL=
E2E_FRESH_PASSWORD=
E2E_TRADER_EMAIL=
E2E_TRADER_PASSWORD=
E2E_PUBLIC_EMAIL=
E2E_PUBLIC_PASSWORD=
```

Verification:

```bash
npx playwright test tests/e2e/auth-smoke.spec.ts
```

Done when:

- Playwright can open `/dashboard` as a logged-in user without manual login.
- Tests do not depend on the current browser session.

### Task 2.2: Add a route smoke spec for all TraderWaves routes

Create:

- `tests/e2e/traderwaves-routes.spec.ts`

Routes:

- `/dashboard/accounts?health=sync`
- `/dashboard/settings/profile`
- `/trader/{username}`
- `/api/og/trader/{username}`
- `/dashboard/journal`
- `/dashboard/journal?action=log-trade`
- `/dashboard/rules`
- `/dashboard/reports/weekly`
- `/admin/reports`

Assertions:

- No 404.
- No 500.
- No console errors.
- No horizontal overflow at `390px`, `1024px`, `1440px`.
- Authenticated routes render the intended page when using storage state.
- Unauthenticated routes redirect to `/auth/login`.

Verification:

```bash
npx playwright test tests/e2e/traderwaves-routes.spec.ts
```

Done when:

- These routes are protected, reachable, and visually stable.

## Phase 3: Sync Health Center Hardening

### Task 3.1: Test health states with fixture accounts

Create fixture accounts for:

- healthy TNT account
- healthy EA account
- manual account
- account connected but no trades
- stale account
- disconnected account
- account with last sync error

Expected copy:

- healthy: "Synced" or equivalent, no warning tone
- no trades: "Sync first trades" or equivalent
- stale: clear next action to reconnect or sync
- disconnected: clear next action to setup
- error: clear next action to review error

Files:

- `src/lib/sync-health.ts`
- `src/components/trading-accounts/SyncHealthCenter.tsx`
- `src/components/trading-accounts/SyncHealthAccountRow.tsx`
- `src/components/trading-accounts/SyncRecoveryAction.tsx`

Verification:

- Unit test `computeSyncHealth`.
- Playwright test Account Hub with mocked/seeded accounts.

Suggested unit tests:

- `tests/unit/sync-health.test.ts`

Done when:

- Every status has one primary action.
- No duplicate badges/buttons for the same meaning.
- User can answer: "Is my sync healthy and what should I do next?"

### Task 3.2: Make `/dashboard/accounts?health=sync` deterministic

Expected behavior:

- Visiting `/dashboard/accounts?health=sync` opens Sync Health Center automatically.
- Closing it removes or ignores the query without reopening in a loop.
- The modal/drawer is usable on mobile.

Files:

- `src/components/trading-accounts/AccountListClient.tsx`
- `src/components/trading-accounts/SyncHealthCenter.tsx`

Verification:

Playwright:

1. Login as user with accounts.
2. Visit `/dashboard/accounts?health=sync`.
3. Assert Sync Health Center is visible.
4. Close it.
5. Assert it stays closed.
6. Repeat at mobile viewport.

Done when:

- Direct support links can open Sync Health reliably.

## Phase 4: Privacy Mode Enforcement

### Task 4.1: Verify privacy presets update all profile flags

Presets should be clear:

- Safe Public
- Performance Only
- Full Transparent

Each preset must update:

- `isPublicProfile`
- `showRealName`
- `showMoney`
- `showBroker`
- `showAccountNumber`
- `showPercentMetrics`
- `showTradeScore`
- `showPairStats`
- `showSessionStats`
- `showBadges`

Files:

- `src/lib/profile/privacy-presets.ts`
- `src/app/dashboard/settings/profile/ProfileClient.tsx`
- `src/app/api/profile/settings/route.ts`

Verification:

- Unit test `applyPrivacyPreset`.
- Playwright toggles each preset and verifies visible toggles.

Done when:

- One preset click creates a predictable privacy configuration.
- Manual toggles still work after selecting a preset.

### Task 4.2: Enforce privacy on public trader page

Route:

- `/trader/{username}`

For each preset:

- Safe Public should not show money, broker, account number, or real name.
- Performance Only should show percent metrics but not money, broker, account number, or real name.
- Full Transparent may show money, broker, account number, and real name only if user chose it.

Files:

- `src/lib/profile-queries.ts`
- `src/components/profile/PublicProfileCard.tsx`
- `src/app/trader/[username]/page.tsx`

Verification:

Playwright:

1. Login as profile owner.
2. Set each privacy preset.
3. Visit public route in a clean context.
4. Assert forbidden fields are absent from DOM text, not merely hidden visually.

Done when:

- Public visitor cannot see private fields in HTML or visible UI.

### Task 4.3: Enforce privacy on OG image

Route:

- `/api/og/trader/{username}`

Required:

- `200 image/png` for valid public profile.
- No private money/broker/account number/real name when preset hides them.
- Graceful fallback for missing avatar/stats.
- Disabled public profile should return safe fallback or 404, not private content.

Files:

- `src/app/api/og/trader/[username]/route.tsx`
- `src/lib/profile-queries.ts`
- `src/lib/profile/privacy-presets.ts`

Verification:

```bash
curl -I http://localhost:3000/api/og/trader/keeloren
```

Playwright or screenshot-based check:

- Generate OG image for each preset.
- Save screenshots to `test-results/privacy-og/`.
- Manually confirm no private fields leak.

Done when:

- Social previews are safe by default.

### Task 4.4: Align trade share privacy with profile privacy

Routes/components:

- `src/components/journal/ShareTradeModal.tsx`
- `src/components/journal/TradeShareCard.tsx`
- `/share/[id]`

Required:

- Default share mode should be safe.
- If profile privacy hides money, trade share should not accidentally reveal money by default.
- User can explicitly choose a more transparent share mode.
- Share preview should show exactly what public visitor will see.

Verification:

Playwright:

1. Create or select a journal entry.
2. Open share modal.
3. Verify default mode hides private fields.
4. Generate share.
5. Open `/share/{id}` in clean context.
6. Verify public view matches preview.

Done when:

- Public profile privacy and trade share privacy feel like one system.

## Phase 5: Rulebook And Goals End-To-End

### Task 5.1: Rulebook CRUD and empty states

Route:

- `/dashboard/rules`

Test:

- user with no rules sees friendly starter empty state
- click "Add starter rules"
- create rule manually
- edit rule
- deactivate rule
- delete rule
- rule scoped to account
- rule scoped to strategy

Files:

- `src/app/dashboard/rules/page.tsx`
- `src/components/rules/RulebookClient.tsx`
- `src/components/rules/TradingRuleModal.tsx`
- `src/components/rules/TradingRuleCard.tsx`
- `src/actions/rulebook.ts`

Verification:

Playwright:

- `tests/e2e/rulebook.spec.ts`

Done when:

- Rulebook works for new users and experienced users.
- Empty state does not feel scary.
- Actions show success/error feedback.

### Task 5.2: Behavior goals CRUD and progress

Goal types:

- `JOURNAL_COUNT`
- `REVIEW_LOSSES`
- `CHECK_RULES`
- `STOP_AFTER_LOSSES`
- `STUDY`
- `CUSTOM`

Current progress logic is implemented for:

- `JOURNAL_COUNT`
- `REVIEW_LOSSES`
- `CHECK_RULES`

Required decision:

- Either implement progress for `STOP_AFTER_LOSSES`, `STUDY`, `CUSTOM`
- or clearly label them as manual goals and show manual status only.

Files:

- `src/actions/rulebook.ts`
- `src/components/rules/GoalModal.tsx`
- `src/components/rules/GoalCard.tsx`
- `src/components/rules/RulebookClient.tsx`

Verification:

- Create each goal type.
- Confirm progress calculation is correct or explicitly manual.
- Complete/cancel/delete goal.

Done when:

- Goals do not show misleading progress.
- Weekly/monthly date windows use the user's intended timezone/date boundary.

### Task 5.3: Rule checks inside journal entry

Required:

- Active rules appear in journal form.
- User can mark each rule:
  - followed
  - broken
  - skipped
- User can add a note to a broken/skipped rule.
- Saved checks appear on trade detail.
- Editing the same trade updates existing checks without duplicates.

Files:

- `src/components/journal/JournalForm.tsx`
- `src/components/journal/TradeDetailSheet.tsx`
- `src/actions/rulebook.ts`
- `src/actions/journal.ts`
- `src/app/api/journal-entries/route.ts`
- `src/app/api/journal-entries/[id]/route.ts`

Verification:

Playwright:

1. Create rule.
2. Log trade.
3. Mark one rule followed and one broken.
4. Save.
5. Open trade detail.
6. Confirm checks are shown.
7. Edit trade and change rule status.
8. Confirm no duplicate `TradeRuleCheck`.

Done when:

- Rule compliance data is attached to actual trades.

## Phase 6: Trade Plan Lifecycle

### Task 6.1: Trade plan creation

Route:

- `/dashboard/journal`

Required:

- Clear "Plan Trade" entry point.
- Create plan with:
  - account
  - symbol
  - buy/sell
  - planned entry
  - stop loss
  - take profit
  - lot size
  - risk amount
  - setup name
  - thesis
  - invalidation
  - emotion before
  - confidence
  - rule checklist

Files:

- `src/components/journal/TradePlanModal.tsx`
- `src/components/journal/TradePlanList.tsx`
- `src/actions/trade-plans.ts`

Verification:

- Create plan.
- Reload page.
- Plan persists.
- Validation errors are clear.

Done when:

- User can plan before entry without needing a broker trade yet.

### Task 6.2: Plan status lifecycle

Statuses:

- `PLANNED`
- `ACTIVE`
- `MATCHED`
- `REVIEWED`
- `CANCELLED`

Expected transitions:

- `PLANNED -> ACTIVE`
- `PLANNED -> CANCELLED`
- `ACTIVE -> MATCHED`
- `MATCHED -> REVIEWED`
- do not allow `REVIEWED -> ACTIVE`
- do not allow `CANCELLED -> ACTIVE` unless explicit restore exists

Files:

- `src/actions/trade-plans.ts`
- `src/app/api/trade-plans/[id]/route.ts`
- `src/components/journal/TradePlanCard.tsx`

Verification:

- Unit test status transitions.
- Playwright clicks status buttons.
- Invalid transition returns error and does not mutate DB.

Done when:

- Plan lifecycle cannot enter nonsense states.

### Task 6.3: Link actual trade to plan

Required:

- User can link a manual or synced journal entry to a trade plan.
- System should suggest matching plans by:
  - same user
  - same account if provided
  - same symbol
  - compatible direction
  - planned date near trade open date
- User can override manually.
- Linked plan shows `MATCHED`.
- Trade detail shows Plan vs Actual.

Files:

- `src/actions/trade-plans.ts`
- `src/app/api/trade-plans/[id]/link-trade/route.ts`
- `src/components/journal/PlanVsActualPanel.tsx`
- `src/components/journal/TradeDetailSheet.tsx`
- `src/components/journal/JournalList.tsx`

Verification:

Playwright:

1. Create trade plan for XAUUSD.
2. Log actual XAUUSD trade.
3. Link plan to trade.
4. Open trade detail.
5. Confirm planned vs actual values render.
6. Mark plan reviewed.

Done when:

- User can compare what they planned vs what happened.

### Task 6.4: Auto matching guardrail

Do not silently auto-link if confidence is low.

Suggested levels:

- High confidence: same account, symbol, type, close date range.
- Medium confidence: same symbol/type, account missing.
- Low confidence: only symbol match.

Behavior:

- High confidence can show "Suggested match".
- User still confirms.
- Low confidence should not auto-select.

Verification:

- Unit test matching function.
- Add helper file if needed:
  - `src/lib/trade-plans/matching.ts`

Done when:

- The system helps without making wrong assumptions.

## Phase 7: Weekly Coach Integration

### Task 7.1: Add rule compliance summary to Weekly Coach

Route:

- `/dashboard/reports/weekly`

Required:

- If rule data exists, weekly report should show:
  - most followed rule
  - most broken rule
  - compliance rate
  - one next action tied to broken rule
- If no rule data exists, show a quiet CTA:
  - "Create your first trading rule"
- Do not show scary warnings to users with no rules.

Files:

- `src/lib/coach/weekly-action-plan.server.ts`
- `src/components/reports/ReportView.tsx`
- `src/actions/rulebook.ts`

Verification:

Seed:

- user with 5 rule checks, 2 broken
- user with no rule checks

Assertions:

- first user sees rule compliance summary
- second user sees starter CTA only

Done when:

- Weekly Coach can say what behavior to fix, not just display metrics.

### Task 7.2: Add trade plan review insight

Required:

- Weekly report should detect:
  - planned trades that were reviewed
  - planned trades not linked to actual trades
  - actual trades without a plan
- Copy must be practical, not judgmental.

Example:

```text
You planned 3 trades and reviewed 2. Two actual trades had no plan. Next week, plan before entry for your first 3 trades.
```

Files:

- `src/lib/coach/weekly-action-plan.server.ts`
- `src/actions/trade-plans.ts`
- `src/components/reports/ReportView.tsx`

Verification:

- Seed trade plans and journal entries.
- Generate weekly report.
- Confirm correct counts and next action.

Done when:

- Trade plans are part of the improvement loop, not just a separate tab.

## Phase 8: Existing User Regression Protection

### Task 8.1: Old user with many trades should not get onboarding-like noise

Test user:

- existing account
- synced trades
- no rulebook
- no trade plans

Expected:

- Dashboard still works.
- No forced Rulebook modal.
- No forced Trade Plan modal.
- Weekly Coach may suggest rulebook gently, but should not block dashboard usage.

Routes:

- `/dashboard`
- `/dashboard/accounts`
- `/dashboard/journal`
- `/dashboard/reports/weekly`

Done when:

- Existing users feel upgraded, not interrupted.

### Task 8.2: Fresh user should see clear next step

Test user:

- no account
- no trades
- no rules
- no plans

Expected:

- Dashboard focuses on first account/sync action.
- Rulebook and trade plans are secondary, not the first CTA.
- No account/date filters if there is no account/trade data.

Done when:

- New users still know the first action is connect or log first trade.

### Task 8.3: Account with no trades should prioritize sync

Test user:

- has account
- no trades
- maybe has rules/plans

Expected:

- Primary CTA: sync first trades.
- Sync Health Center shows account has no trade data.
- Weekly review and coach report are not prematurely promoted.

Done when:

- User does not see "weekly review ready" before meaningful trade data.

## Phase 9: Code Quality Cleanup In New Feature Area

Do not try to fix all 441 lint warnings in the whole repo in this scope.

Focus only new or touched TraderWaves feature files:

- `src/actions/rulebook.ts`
- `src/actions/trade-plans.ts`
- `src/app/api/sync/health/route.ts`
- `src/app/api/trade-plans/**/*.ts`
- `src/app/dashboard/rules/page.tsx`
- `src/components/rules/**/*.tsx`
- `src/components/journal/TradePlan*.tsx`
- `src/components/journal/PlanVsActualPanel.tsx`
- `src/components/trading-accounts/SyncHealth*.tsx`
- `src/lib/profile/privacy-presets.ts`
- `src/lib/sync/sync-source.ts`
- `src/lib/sync-health.ts`

Fix:

- unused imports
- unused local vars
- obvious `any` where a local type is easy
- console logs in production paths unless they are `console.warn` or `console.error`
- missing hook dependencies where it can cause stale UI

Verification:

```bash
npm run lint
```

Done when:

- Total warnings decrease.
- New TraderWaves files do not introduce obvious lint noise.

## Phase 10: Final Verification

Run commands:

```bash
npx prisma validate
npm run type-check
npm run lint
npx next build
npx playwright test tests/e2e/traderwaves-routes.spec.ts
npx playwright test tests/e2e/rulebook.spec.ts
npx playwright test tests/e2e/trade-plans.spec.ts
npx playwright test tests/e2e/privacy-sharing.spec.ts
```

Manual QA routes:

- `/`
- `/dashboard`
- `/dashboard/accounts?health=sync`
- `/dashboard/settings/profile`
- `/trader/keeloren`
- `/api/og/trader/keeloren`
- `/dashboard/journal`
- `/dashboard/journal?action=log-trade`
- `/dashboard/rules`
- `/dashboard/reports/weekly`
- `/admin/reports`

Manual QA viewports:

- `390px`
- `768px`
- `1024px`
- `1440px`

Acceptance:

- No 404/500 on tested routes.
- No console errors.
- No horizontal overflow.
- OG route returns `200 image/png`.
- Public privacy does not leak hidden fields.
- Rulebook CRUD works.
- Goal CRUD works.
- Trade plan lifecycle works.
- Plan vs Actual works.
- Weekly Coach references rule/trade-plan data only when data exists.
- Existing users with data are not interrupted.
- New users still see clear first action.

## Release Checklist

Before release:

- [ ] Production DB migration reviewed.
- [ ] Sync source audit run on production snapshot or staging clone.
- [ ] Feature flags set intentionally.
- [ ] Authenticated E2E tests pass.
- [ ] Public privacy tested in incognito/clean context.
- [ ] OG image tested with `curl -I`.
- [ ] Existing user with trade data tested.
- [ ] Fresh user tested.
- [ ] Account with no trade data tested.
- [ ] `docs/PRODUCT.md` updated.
- [ ] `docs/FEATURE_SPECS.md` updated.
- [ ] `docs/SYSTEM.md` updated.

## What Not To Do

- Do not add CSV import as a core MT5 workflow.
- Do not add new broker integrations in this scope.
- Do not make Rulebook mandatory for every user on first login.
- Do not force Trade Plans before the user understands basic sync/journal flow.
- Do not expose money, broker, or account number publicly by default.
- Do not treat unauthenticated `401` from protected APIs as a bug.
- Do not spend time fixing all historical lint warnings outside the touched feature area.

