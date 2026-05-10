# IB-Powered Pro Access Plan - 2026-05-10

## Product Direction

TheNextTrade should be positioned as:

> TheNextTrade helps traders find the mistakes costing them money and fix them with data, discipline, and personalized lessons.

Business model:

> Pro is free for verified Gold Scalper Ninja VIP traders. Users unlock Pro by opening or linking a broker account under the IB/referral flow.

This avoids subscription friction, supports the trading community, and gives the admin visibility into whether referred users are actually active traders.

## Current Foundation Already In The Codebase

Existing pieces to reuse:

- `VipRequest`: user submits broker/account/Telegram info and admin approves/rejects.
- `EABroker`: stores broker affiliate URLs and IB codes.
- `TradingAccount`: stores broker, account number, sync status, balance/equity, heartbeats, trade sync, trading rules.
- `JournalEntry`: stores synced/manual trades, PnL, psychology, mistakes, strategy, account relation.
- `CopyTradingRegistration`: stores broker/account registration and `partnerCode`.
- `Partner`: supports external partner API.
- `AnalyticsEvent` / `PageView`: can track affiliate clicks and funnel events.
- Admin community/copy-trading/security areas already exist.

Important existing issue to handle:

- `VipRequest.screenshotUrl` exists in Prisma schema, but `submitVipRequest()` currently does not save `screenshotUrl` into the create data.
- `CopyTradingRegistration.masterPassword` has a TODO to encrypt before storing. Do not expand any IB/VIP flow around storing broker passwords until this is fixed or removed.

## Core Concept

Separate these concepts:

1. **Lead / Attribution**
   - A visitor clicked a broker/referral link or came from Telegram.
   - Tracks source, campaign, broker, landing page, device/session, user if logged in.

2. **VIP Request**
   - User claims: "I opened/linked this broker account under your IB."
   - This is a review workflow, not the entitlement itself.

3. **VIP Membership / Pro Entitlement**
   - System says user currently has Pro access.
   - Can be active, pending, expired, revoked, grace-period, or manual.

4. **Trading Activity**
   - The user is actually trading or syncing data.
   - Comes from MT5/TNT Connect sync, journal imports, broker API/webhook, or manual admin verification.

5. **IB Performance**
   - Admin-facing view that answers:
     - Who registered?
     - Who verified?
     - Who connected MT5?
     - Who is active?
     - Who stopped trading?
     - Which broker/ref link is converting?
     - Estimated IB value, if broker commission data is not available.

## User Journey

### Journey A - New Trader From Telegram

1. User clicks Telegram CTA: "Unlock TheNextTrade Pro Free".
2. Lands on `/vip` or `/brokers/vip`.
3. Page explains:
   - Pro is free for verified VIP traders.
   - User keeps full control of broker account.
   - TheNextTrade is analytics/education, not financial advice.
   - IB relationship is disclosed clearly.
4. User creates TheNextTrade account.
5. User clicks broker referral link.
6. Event is tracked: `broker_ref_click`.
7. User submits VIP request with broker/account/Telegram/screenshot.
8. Admin verifies.
9. User receives `VIP_APPROVED` notification.
10. User unlocks Pro features.
11. App nudges user to connect TNT Connect / MT5 sync.
12. Weekly AI Coach starts after enough trade data exists.

### Journey B - Trader Already Has Data

1. User signs up and imports/syncs trades first.
2. App shows immediate free value:
   - Basic journal
   - Basic analytics
   - Mistake summary preview
3. Pro features show preview:
   - "You have 3 recurring mistakes. Verify VIP to unlock the full breakdown."
4. User submits IB/VIP verification.
5. Once approved, app unlocks:
   - AI Weekly Coach
   - Edge Leak Detector
   - Rule Violation Tracker
   - Advanced analytics

### Journey C - Existing VIP Group Member

1. User signs in.
2. User enters Telegram handle and broker account.
3. Admin can mark as `MANUAL_VIP` or `IB_VERIFIED`.
4. User gets Pro access immediately or after account proof.

## Feature Access Model

### Free

- Public Academy
- Trading tools
- Basic journal
- Manual trade log
- Basic analytics
- Basic strategy tags
- Basic psychology fields
- Limited weekly recap

### VIP / Pro

- AI Weekly Coach
- Edge Leak Detector
- Advanced psychology analytics
- Rule Violation Tracker
- Playbook/strategy analytics
- Advanced reports/export
- Full MT5/TNT sync history
- VIP lessons/resources
- VIP Telegram access link

### Grace Period

Recommended:

- Give new VIP applicants 7-14 days of temporary Pro after submitting a request.
- If approved, convert to full VIP.
- If rejected or not verified, downgrade gently.

This lets users experience the product before admin review and reduces support friction.

## Tracking Model

### Minimum Useful Tracking

For each user, admin should see:

- VIP status: `NONE`, `PENDING`, `GRACE`, `ACTIVE`, `EXPIRED`, `REVOKED`
- Broker
- Account number, masked in most views
- Telegram handle
- Referral source/campaign
- First referral click date
- VIP request date
- Approved date
- First MT5/TNT sync date
- Last heartbeat
- Last trade date
- Trades in last 7/30/90 days
- Lot volume in last 7/30/90 days
- Net PnL, optional and privacy-controlled
- Estimated IB value, if no broker commission API exists

### Activity Status

Define activity labels:

- `NEW_LEAD`: clicked broker link but not signed up.
- `SIGNED_UP`: created account but no VIP request.
- `PENDING_VERIFY`: submitted VIP request.
- `VERIFIED_INACTIVE`: approved but no connected/synced trading account.
- `CONNECTED_NO_TRADES`: account connected, no closed trades yet.
- `ACTIVE_TRADER`: at least 1 trade in last 30 days.
- `HIGH_VALUE_ACTIVE`: configurable threshold, e.g. 30+ trades/month or lot volume threshold.
- `AT_RISK`: no activity for 14 days.
- `DORMANT`: no activity for 30+ days.

### IB Value Estimate

If broker does not provide commission data:

- Store broker-specific estimate config:
  - `commissionPerLot`
  - `currency`
  - `activeThresholdLots`
  - `minMonthlyTrades`
- Estimate:
  - `estimatedIbRevenue = closedLotVolume * commissionPerLot`

Label it clearly as estimated, not exact.

## Suggested Data Model

Keep `VipRequest` as request history. Add separate entitlement and attribution tables.

### `ProEntitlement`

Fields:

- `id`
- `userId`
- `status`: `NONE | GRACE | ACTIVE | EXPIRED | REVOKED`
- `source`: `IB_VERIFIED | MANUAL_ADMIN | PROMO | INTERNAL`
- `vipRequestId`
- `broker`
- `accountNumberMasked`
- `linkedTradingAccountId`
- `startsAt`
- `expiresAt`
- `lastReviewedAt`
- `reviewedBy`
- `adminNote`
- `createdAt`
- `updatedAt`

Why:

- Pro access should not depend only on the latest `VipRequest`.
- Admin can revoke/extend access without rewriting request history.

### `IbLead`

Fields:

- `id`
- `userId` nullable
- `sessionId`
- `broker`
- `affiliateUrl`
- `source`: `telegram | homepage | broker_page | academy | dashboard`
- `utmSource`
- `utmMedium`
- `utmCampaign`
- `clickedAt`
- `convertedAt`
- `vipRequestId`

Why:

- Tracks which funnel actually brings verified users.

### `IbAccountActivitySnapshot`

Fields:

- `id`
- `userId`
- `tradingAccountId`
- `broker`
- `accountNumberMasked`
- `periodStart`
- `periodEnd`
- `tradeCount`
- `closedLotVolume`
- `netPnl`
- `lastTradeAt`
- `lastHeartbeatAt`
- `estimatedIbRevenue`
- `activityStatus`
- `createdAt`

Why:

- Admin dashboards should read snapshots, not recompute heavy trade stats on every page load.

### `BrokerPartnerConfig`

May extend existing `EABroker` or create a dedicated table.

Fields:

- `broker`
- `displayName`
- `affiliateUrl`
- `ibCode`
- `commissionPerLot`
- `isVipEligible`
- `requiresScreenshot`
- `requiresCountry`
- `verificationInstructions`
- `status`

Why:

- Keeps broker-specific VIP requirements out of hardcoded UI.

## Admin Screens

### 1. IB Overview

Cards:

- Total leads
- VIP requests pending
- Verified VIP users
- Active VIP traders
- Dormant VIP traders
- Estimated monthly IB value
- Conversion rate: click -> signup -> request -> approval -> active trader

Charts:

- Leads by source
- Approved users by broker
- Active traders by broker
- Estimated IB revenue by month

### 2. VIP Pipeline

Table:

- User
- Telegram
- Broker
- Account masked
- Status
- Submitted date
- Screenshot/proof
- Last sync
- Last trade
- Admin actions

Actions:

- Approve
- Reject
- Request more proof
- Grant grace
- Revoke Pro
- Link to trading account
- Add admin note

### 3. Active Trader Monitor

Table:

- User
- Broker
- Account
- Last heartbeat
- Last trade
- Trades 30d
- Lot volume 30d
- Estimated IB value
- Activity status

Filters:

- Broker
- Activity status
- VIP status
- Date range
- Has sync / no sync

### 4. Dormant / At-Risk Users

List users who:

- Approved but never connected MT5.
- Connected but no trade for 14+ days.
- No heartbeat for 7+ days.
- Started VIP request but never completed proof.

Actions:

- Send notification
- Send email
- Copy Telegram follow-up text
- Downgrade after grace period

## User Screens

### 1. VIP Status Widget

Show in dashboard:

- `Pro Active`
- `Verification Pending`
- `Grace Access`
- `Action Needed`
- `Expired`

CTA:

- Connect MT5/TNT
- Submit proof
- Open broker account
- Join VIP Telegram

### 2. Unlock Pro Page

Sections:

- Why Pro is free
- What users unlock
- How verification works
- Broker partner disclosure
- Risk disclaimer
- Step-by-step:
  1. Open account using official partner link
  2. Submit broker account info
  3. Wait for approval
  4. Connect MT5 sync
  5. Receive weekly coaching reports

### 3. Pro Feature Preview

For non-VIP users:

- Show blurred/limited insights.
- Example:
  - "You have recurring rule violations in your last 12 trades."
  - "Unlock Pro Free with VIP verification to see exact mistakes and fixes."

Do not block basic journaling.

## Verification Strategy

### MVP Verification

Manual admin review:

- User submits broker/account/Telegram/proof.
- Admin checks broker back office or user screenshot.
- Admin approves.
- User gets Pro entitlement.

### Better Verification

Semi-automated:

- Match submitted broker/account with `TradingAccount.accountNumber`.
- Require TNT Connect heartbeat from the same account.
- Mark as `CONNECTED_VERIFIED` when account sync confirms broker/server/account number.

### Best Verification

Broker/IB API or periodic CSV import:

- Import broker IB report with account numbers, lots, commissions.
- Match to users.
- Update activity snapshots and estimated/exact IB revenue.

## Privacy And Trust Rules

This product will work only if users trust it.

Rules:

- Disclose IB relationship clearly.
- Do not promise profit.
- Do not frame broker signup as investment advice.
- Do not store broker master passwords in plaintext.
- Mask account numbers in admin list views.
- Let users know what activity data is tracked after they connect MT5/TNT.
- Allow users to disconnect sync and revoke API keys.
- Keep detailed PnL visibility optional where possible.
- Store screenshots/proofs privately.

Recommended public wording:

> TheNextTrade Pro is free for verified Gold Scalper Ninja VIP traders. We may receive IB/partner commission from broker activity. Your funds remain with your broker, and TheNextTrade does not manage your money or guarantee trading results.

## Implementation Roadmap

### Phase 1 - MVP Tracking And Pro Unlock

Goal:

Admin can know who registered, who verified, and who is active enough to justify VIP/Pro access.

Build:

- Fix `VipRequest.screenshotUrl` persistence.
- Add `ProEntitlement`.
- Add `IbLead`.
- Track broker affiliate clicks as `IbLead` + `AnalyticsEvent`.
- Add VIP status widget in user dashboard.
- Add Pro gating helper, e.g. `getUserProAccess(userId)`.
- Add Admin VIP Pipeline page.
- Add manual approve/revoke Pro.
- Add basic Active Trader Monitor using `TradingAccount` + `JournalEntry`.

Verification:

- User can submit VIP request.
- Admin can approve.
- User gets Pro access.
- Admin can see last sync/trade activity.
- Revoked user loses Pro access.

### Phase 2 - Activity Scoring

Goal:

Admin can see whether IB users actually trade.

Build:

- Add activity snapshot generation.
- Compute 7/30/90 day:
  - trade count
  - lot volume
  - last trade
  - last heartbeat
  - activity status
  - estimated IB value
- Add dormant/at-risk segmentation.
- Add notifications for:
  - approved but not connected
  - no heartbeat
  - no trades in 14/30 days

Verification:

- Snapshot job produces correct stats.
- Admin filters active/dormant users.
- User receives helpful nudge, not spam.

### Phase 3 - Pro Value Features

Goal:

Make VIP/Pro feel meaningfully better than free.

Build:

- AI Weekly Coach.
- Edge Leak Detector.
- Rule Violation Tracker.
- Mistake-to-Lesson recommendations.

Verification:

- User with synced trades receives weekly report.
- Report names concrete mistakes and recommended lessons.
- Rule violation counts match journal data.

### Phase 4 - Broker Reconciliation

Goal:

Move from estimated tracking to real IB performance where possible.

Build:

- Broker/IB CSV import.
- Optional partner webhook/API adapter.
- Match broker account numbers to users.
- Store exact commission/lot volume if available.
- Show estimated vs exact revenue.

Verification:

- CSV import matches accounts safely.
- Duplicate imports do not double-count.
- Admin can audit matched/unmatched rows.

## Success Metrics

Product metrics:

- Signups from Telegram.
- Broker link clicks.
- VIP request conversion rate.
- Approval rate.
- MT5/TNT connect rate.
- Weekly active traders.
- Weekly report open rate.
- Pro feature usage.

Business metrics:

- Verified IB accounts.
- Active IB traders.
- Lots/month from verified users.
- Estimated or exact IB revenue.
- Dormant rate.
- Reactivation rate.

User value metrics:

- Mistake repeat rate decreasing.
- Rule adherence score improving.
- Journal consistency.
- Reduced overtrading/revenge trading patterns.
- Academy lesson completion tied to actual mistakes.

## Recommended First Milestone

Ship this first:

1. VIP/Pro entitlement layer.
2. Broker click attribution.
3. Admin VIP Pipeline.
4. Active Trader Monitor.
5. User VIP status widget.

Do not start with AI Weekly Coach. First make the business loop measurable:

Telegram traffic -> broker click -> VIP request -> verified user -> connected account -> active trader.

Once that loop is visible, AI Coach becomes the retention engine.
