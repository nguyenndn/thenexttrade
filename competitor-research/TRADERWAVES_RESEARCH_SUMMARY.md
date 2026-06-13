# TraderWaves Research Summary

Date: 2026-06-12  
Source: TraderWaves Discord channels crawled through logged-in Discord Web with Playwright.

## Scope

Channels reviewed:

| Channel | URL | Messages Read | Date Range |
| --- | --- | ---: | --- |
| Main Chat | `https://discord.com/channels/1314385058114699264/1314385058651701272` | 3,991 | 2024-12-06 to 2026-06-12 |
| Feature Request | `https://discord.com/channels/1314385058114699264/1314385761281507349` | 650 | 2024-12-06 to 2026-06-12 |
| Total | Both channels | 4,641 | 2024-12-06 to 2026-06-12 |

Collection note:

- Browser was already logged in by the owner.
- Playwright opened each Discord channel, jumped to the latest message, then scrolled upward until the start of the channel was reached.
- Research is anonymized. No user profiling, member IDs, avatars, private data, or emails are kept in this final summary.
- This summary does not OCR images, inspect videos, or scrape hidden/thread-only/private content.

## TraderWaves Features Mentioned

These are product areas that appear to exist, be visible, or be actively discussed as part of TraderWaves.

### Core Product

- Trading journal
- Daily journal
- Trade metrics
- Calendar view
- Dashboard analytics
- Account dashboard
- Trade history
- Strategy tags / trade tags
- Chart screenshot support in journal
- Charts area or chart-related workflow
- Public/shareable dashboard or profile
- Leaderboard
- Backtesting, under paid plan
- TradeSync, under paid plan
- Multi-account support with free/paid limits
- Mobile web access
- iOS and Android mobile apps in beta or rollout
- Community Discord for support, updates, feature requests, and user feedback

### Sync / Import / Platform Support

- TradeSync or automatic trade syncing
- MT4/MT5-related sync discussions
- Tradovate OAuth/support mentioned
- Import repair/fix workflows discussed by users
- Timezone handling for imported trades mentioned as an active issue/improvement
- Telegram notification support mentioned
- Trade copier or copier-like behavior mentioned in community discussions

### Paid / Free Plan Behavior

- Backtesting appears to be a paid feature.
- TradeSync appears to be paid.
- Free plan account limits were discussed.
- CSV download/export access in free plan was requested.
- Trial/referral-related paid-plan access was discussed.

## Community Ideas Found

These are ideas users repeatedly requested or discussed. They are not all confirmed as implemented.

### 1. Guided Journal Templates

Problem:

Users do not always know what a good trade journal entry should look like.

Ideas:

- Default journal template.
- Daily journal sample template.
- Pre-trade template.
- Post-trade review template.
- Session review template.
- Screenshot field in journal.
- Notes for reasoning, emotion, setup, and execution.

Opportunity for TheNextTrade:

Make guided journaling a core UX, not just a blank notes box.

### 2. Pre-Trade Journal / Open-Trade Journal

Problem:

Users want to journal before or during a trade, not only after the trade closes.

Ideas:

- Journal an active/open/running trade.
- Add pre-trade checklist before entry.
- Track thoughts and reasons while trade is still open.
- Reconcile the planned trade with the synced trade after it closes.

Opportunity for TheNextTrade:

Create trade lifecycle states:

- `planned`
- `open`
- `closed`
- `reviewed`

This would make TheNextTrade more behavior-focused than a normal analytics dashboard.

### 3. Trading Targets / Goals

Problem:

Users want goals that keep them accountable.

Ideas:

- Monthly profit target.
- Weekly target.
- Daily target.
- Target progress on dashboard.
- Process goals, such as journal X trades or complete X reviews.

Opportunity for TheNextTrade:

Prefer behavior goals over pure profit goals:

- Journal 5 trades this week.
- Review every losing trade.
- Stop after 2 losses.
- Complete one weekly report.

### 4. Rulebook / Trading Rules System

Problem:

Users want the system to help them follow personal rules.

Ideas:

- Store trading rules.
- Show rules before entering trades.
- Mark whether a trade followed or broke rules.
- Weekly summary of most-broken rules.

Opportunity for TheNextTrade:

Connect rules directly to Journal, Psychology, Weekly Coach Report, and Edge scoring.

### 5. Consistency Score / Prop-Style Risk Tracking

Problem:

Some traders want to track prop-firm style consistency rules.

Ideas:

- Consistency score dashboard.
- Biggest winning day as percentage of target.
- Daily loss / drawdown / max loss tracking.
- Payout-readiness style metrics.

Opportunity for TheNextTrade:

Use the useful discipline parts, but do not make the whole product depend on prop firms. Frame it as "risk discipline" and "behavior consistency."

### 6. Data Export / Migration Tools

Problem:

Users want confidence that they can take data out and migrate data when needed.

Ideas:

- CSV import for migration/admin/advanced fallback only.
- JSON import.
- Manual/offline account.
- Export all trades, not just limited rows.
- Spreadsheet export.
- PDF report export.
- CSV download in free plan.

Opportunity for TheNextTrade:

This is a trust feature, but it should not be positioned as the main MT5 workflow. If a user already has MT5 open on PC, TNT Connect or EA Sync is the correct path. CSV import belongs to migration, broker portal exports, support/admin workflows, or non-MT5 sources.

### 7. Sync Health / Reliability

Problem:

Users worry when imports stop working or when sync/copy behavior misses trades.

Ideas:

- Show last sync status.
- Show last import time.
- Show sync errors clearly.
- Show missing TP/SL or missing data warnings.
- Recovery action when sync is stale.
- Telegram/email alert when sync fails.

Opportunity for TheNextTrade:

Build a Sync Health Center for TNT Connect and EA Sync:

- Healthy
- Stale
- Disconnected
- Missing data
- Import error

Every status should include the next action.

### 8. Privacy Mode For Public Sharing

Problem:

Users want to share performance without exposing account size or money.

Ideas:

- Hide monetary values.
- Show ROI or percentage only.
- Use nickname instead of real name.
- Hide broker/account number.
- Public dashboard privacy controls.

Opportunity for TheNextTrade:

Apply privacy mode to:

- Public Trader Card
- Shareable reports
- Calendar screenshots
- Leaderboard profile

### 9. Mobile Experience

Problem:

Users expect mobile access to be stable.

Ideas:

- Mobile app.
- Mobile web support.
- Calendar should not flicker/jump.
- Login should persist.
- 2FA should not reset when switching app context.
- Dashboard/journal should work well on phone.

Opportunity for TheNextTrade:

Mobile-first QA is important, especially for:

- Dashboard
- Journal
- Reports
- Onboarding
- Account Hub
- Date filters

### 10. Feature Education / Tooltips

Problem:

Users feel overwhelmed by advanced journal and analytics features.

Ideas:

- Explain what each feature does.
- Add hover tooltips.
- Add short descriptions for strategy tags and metrics.
- Create a feature guide or help room.
- Add small videos/images for how to use features.

Opportunity for TheNextTrade:

Use contextual education:

- Tooltip near metric.
- "Why this matters" under insight.
- Coach-style explanation inside reports.
- Academy article recommendations connected to the user's real issue.

### 11. Dashboard Customization

Problem:

Users want control, but too much customization can become confusing.

Ideas:

- Resize dashboard widgets.
- Save layout per device/breakpoint.
- Recreate dashboard templates.

Opportunity for TheNextTrade:

Do not rush into full widget-builder mode. Keep strong default layouts first. Add small customization only when it improves clarity.

### 12. Notifications / Alerts

Problem:

Users want to know when important events happen.

Ideas:

- Telegram notifications.
- Email announcements.
- Trade activity alerts.
- Error alerts.
- Sync failure alerts.
- Info messages.

Opportunity for TheNextTrade:

Start with in-app and email notifications:

- Sync stale.
- Weekly report ready.
- First insight ready.
- Risk/behavior warning.
- New lesson recommended.

Telegram can come later.

### 13. Broader Integrations

Problem:

Users request many integrations.

Ideas:

- NinjaTrader.
- Tradovate.
- Rithmic.
- Sierra Chart.
- IBKR.
- Bitget.
- Binance/crypto expansion.
- MT4/MT5.
- Telegram signal/copier integration.

Opportunity for TheNextTrade:

Do not chase every integration now. Prioritize:

1. Make MT5/TNT Connect/EA Sync reliable.
2. Add CSV export and migration-only import.
3. Add one high-demand integration only when stable and maintainable.

## Strongest Ideas For TheNextTrade

These are the ideas most worth adapting.

### P0 - Should Consider Soon

1. Guided Journal Templates
   - Users need help knowing what to write.
   - Connect this to Journal, Psychology, and Weekly Coach.

2. Sync Health Center
   - Make sync status obvious.
   - Give exact recovery actions.

3. First Insight Moment
   - After first sync, show one useful insight immediately.
   - Example: "Most of your profit came from one session" or "You traded XAUUSD 80% of the time."

4. Privacy Mode
   - Hide money, show percentages.
   - Protect identity on public sharing.

### P1 - High Value

5. Pre-Trade / Open-Trade Journal
   - Capture the plan before outcome bias.
   - Let users review the reasoning while the trade is still active.

6. Trading Rulebook
   - Let users define personal rules.
   - Track followed/broken rules per trade.

7. Goals / Targets
   - Weekly behavior goals.
   - Monthly progress goals.
   - Avoid pure profit-chasing.

8. Mobile Fallback
   - Manual trade log.
   - Send setup link to desktop for TNT Connect/EA.
   - Migration/import guidance only when the user is not on the normal MT5 sync path.

9. Contextual Feature Education
   - Tooltips.
   - Help text.
   - Coach explanations.

### P2 - Later

10. Data Export / Migration Tools
   - CSV export as a user trust feature.
   - CSV import only for migration, admin support, broker portal exports, or non-MT5 sources.

11. Telegram Alerts
12. Advanced Dashboard Layout Customization
13. Public Benchmarking
14. Extra Broker/Platform Integrations
15. Mobile Native App

## What TheNextTrade Should Avoid

- Do not copy every integration request.
- Do not make dashboard customization too complex too early.
- Do not expose money by default on public pages.
- Do not make alerts noisy after first sync.
- Do not bury sync/import problems behind generic errors.
- Do not make user start from a blank journal.

## Product Positioning Takeaway

Trader journal users are not only asking for more metrics. They want less uncertainty.

TheNextTrade should position around:

> Track your trades. Understand your behavior. Improve the next decision.

Every major feature should answer:

1. What happened?
2. Why did it happen?
3. What should I do next?

## Suggested Follow-Up Specs

If we decide to build from this research, create these implementation plans:

1. `guided-journal-templates-implementation-plan.md`
2. `pre-trade-open-trade-journal-plan.md`
3. `sync-health-center-implementation-plan.md`
4. `privacy-mode-public-sharing-plan.md`
5. `csv-import-export-data-ownership-plan.md`
6. `trading-rulebook-goals-plan.md`

## Final Recommendation

The highest-value direction is not to become a clone of TraderWaves. The opportunity is to become a more guided, clearer, behavior-improvement system.

TraderWaves has strong analytics/community momentum. TheNextTrade can win by being more focused:

- easier onboarding
- clearer next action
- stronger coaching loop
- cleaner sync status
- better journaling guidance
- safer public sharing
