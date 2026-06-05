# Trading Competition Platform Implementation Plan

## Goal

Build a professional trading competition system for TheNextTrade, inspired by the public positioning of TradeZolo: real trading competitions, transparent ranking, verified trade data, achievements, and prize operations.

This document is for future development. It should be detailed enough for an engineer or AI coding agent to implement without asking for product clarification.

Reference observed on TradeZolo homepage: https://tradezolo.com/

## Product Direction

TheNextTrade already has a strong base for trader tracking:

- MT5 account connection.
- TNT Connect sync.
- EA Sync.
- Trading journal.
- Dashboard analytics.
- Weekly reports.
- Public trader cards.
- Edge, badges, missions.
- Leaderboard.
- Admin reports and user monitoring.

The missing layer is a dedicated competition engine:

- Competitions with start/end windows.
- Participant registration and approval.
- Account locking.
- Starting balance/equity snapshots.
- Score calculation.
- Rule violation detection.
- Admin review.
- Public leaderboard.
- Winner and payout workflows.

## Main Decision

Do not reuse the existing `/dashboard/leaderboard` as the competition system.

The current leaderboard is a community leaderboard. It ranks users by Edge, streak, academy, or recent trading performance. A competition needs a separate lifecycle, fixed rules, locked participants, scoring snapshots, audit logs, and admin controls.

Existing leaderboard code can be used as UI/reference only.

## Current System Capabilities

### Already Available

| Capability | Current Source | Can Reuse? | Notes |
| --- | --- | --- | --- |
| User auth/profile | `User`, `Profile` | Yes | Needed for participant identity. |
| Public trader profile | `/trader/[username]` | Yes | Can add competition history later. |
| MT5 account records | `TradingAccount` | Yes | Needed for account locking and eligibility. |
| Sync API key | `User.syncApiKey`, account API key legacy | Yes | Used by TNT Connect and EA Sync. |
| TNT Connect trade import | `/api/sync/trades` | Yes | Good source for verified synced trades. |
| EA trade/history import | `/api/ea/*` | Yes | Good source for verified synced trades. |
| Journal entries | `JournalEntry` | Yes | Core trade source. |
| Sync history | `SyncHistory` | Yes | Useful for audit and stale-sync detection. |
| Import history | `ImportHistory` | Partial | Useful if manual/import competitions are ever allowed. |
| Dashboard analytics | `src/lib/analytics-queries.ts` | Partial | Can reuse formulas but competition scoring should be separate. |
| Trading reports | `TradingReport` | Partial | Weekly reports are user-facing, not competition snapshots. |
| Existing leaderboard | `/dashboard/leaderboard` | Partial | UI pattern only. |
| Edge/badges/missions | `EdgeEvent`, `UserBadge`, `UserMissionProgress` | Yes | Can award medals/badges after competitions. |
| Admin reports | `/admin/reports` | Partial | Useful for ops, but not competition-specific. |
| Admin users | `/admin/users` | Partial | Useful for participant investigation. |
| Admin IB/pro ops | `/admin/ib` | Partial | Useful if competitions are tied to partner brokers. |

### Not Yet Available

| Missing Capability | Why It Matters |
| --- | --- |
| Competition model | Need a first-class entity for each tournament. |
| Participant model | Need to track each user's registration/account/status. |
| Prize model | Need transparent reward tiers and payout status. |
| Score snapshot model | Need immutable audit history of rank/score over time. |
| Rule violation model | Need fair-play review and disqualification support. |
| Admin competition console | Needed to operate real tournaments. |
| Public competition pages | Needed for trust, signup, and viewing results. |
| Anti-cheat engine | Needed for professional competitions. |
| Finalization workflow | Needed to freeze ranking and declare winners. |
| Payout workflow | Needed for prize operations. |

## Recommended Product Phases

### Phase 1: Internal MVP Competition

Purpose:

- Let TheNextTrade run small free competitions with real synced MT5 accounts.
- No entry fee.
- Manual prize payout outside the system.

Required:

- Admin can create competition.
- User can join with one eligible trading account.
- System captures starting balance/equity.
- System ranks by return percentage.
- Public leaderboard is visible.
- Admin can disqualify a participant.
- Admin can mark winners and payout status manually.

Do not build yet:

- Payment/entry fee.
- Auto payout.
- Complex broker partner verification.
- Team competitions.
- Mobile-only broker API sync.

### Phase 2: Professional Competition

Purpose:

- Support serious public competitions with prize operations and admin review.

Required:

- Rule engine.
- Score snapshots.
- Anti-cheat dashboard.
- Participant approval flow.
- Freeze leaderboard at end.
- Winner announcement page.
- Email/notification flows.
- Export CSV.
- Audit logs.

### Phase 3: Sponsored/Partner Competition

Purpose:

- Support sponsor/broker campaigns similar to a dedicated competition platform.

Required:

- Sponsor/partner fields.
- Broker eligibility.
- Partner account verification.
- Prize pool landing pages.
- Competition badges/medals.
- Social share cards.
- Post-event recap.

## User-Facing URLs

### Public

| URL | Purpose |
| --- | --- |
| `/competitions` | Public list of upcoming/running/finished competitions. |
| `/competitions/[slug]` | Competition landing page with prize, rules, countdown, CTA. |
| `/competitions/[slug]/leaderboard` | Public live/final leaderboard. |
| `/competitions/[slug]/rules` | Dedicated rulebook if content is long. |
| `/competitions/[slug]/winners` | Final winners and payout status after competition ends. |
| `/trader/[username]` | Add competition medals/history later. |

### Authenticated Trader

| URL | Purpose |
| --- | --- |
| `/dashboard/competitions` | User's competition hub. Shows joined, eligible, and upcoming competitions. |
| `/dashboard/competitions/[slug]` | User-specific competition detail. Shows status, account, score, violations, next action. |
| `/dashboard/competitions/[slug]/join` | Join/registration flow. Can be a modal or page. |
| `/dashboard/competitions/[slug]/leaderboard` | Authenticated version with "my rank" and nearby rivals. |
| `/dashboard/accounts` | Existing account hub. Add CTA when an account is eligible for competitions. |

## Admin URLs

### Required Admin Module

| URL | Purpose |
| --- | --- |
| `/admin/competitions` | Competition command center. |
| `/admin/competitions/new` | Create a new competition. |
| `/admin/competitions/[id]` | Competition overview. |
| `/admin/competitions/[id]/participants` | Participant review and management. |
| `/admin/competitions/[id]/leaderboard` | Admin leaderboard with recompute/freeze controls. |
| `/admin/competitions/[id]/violations` | Rule violations and anti-cheat review. |
| `/admin/competitions/[id]/snapshots` | Score snapshot history. |
| `/admin/competitions/[id]/payouts` | Winner and payout workflow. |
| `/admin/competitions/[id]/communications` | Send competition notifications/emails. |
| `/admin/competitions/[id]/audit` | Immutable admin/system audit logs. |
| `/admin/competitions/[id]/settings` | Edit rules, dates, visibility, prizes. |

## Data Model

Use Prisma models. Names below are recommended.

### Enums

```prisma
enum CompetitionStatus {
  DRAFT
  UPCOMING
  REGISTRATION_OPEN
  REGISTRATION_CLOSED
  RUNNING
  FINISHED
  CANCELLED
  ARCHIVED
}

enum CompetitionVisibility {
  PUBLIC
  PRIVATE
  UNLISTED
}

enum CompetitionAccountMode {
  REAL_ONLY
  DEMO_ALLOWED
  PARTNER_ONLY
}

enum CompetitionScoringMode {
  RETURN_PERCENT
  RISK_ADJUSTED
  NET_PNL
}

enum CompetitionParticipantStatus {
  REGISTERED
  PENDING_REVIEW
  APPROVED
  ACTIVE
  REJECTED
  WITHDRAWN
  DISQUALIFIED
  COMPLETED
  WINNER
}

enum CompetitionPayoutStatus {
  NONE
  PENDING
  APPROVED
  PAID
  REJECTED
}

enum CompetitionViolationSeverity {
  INFO
  WARNING
  MAJOR
  DISQUALIFY
}
```

### `Competition`

```prisma
model Competition {
  id                    String                @id @default(cuid())
  slug                  String                @unique
  title                 String
  subtitle              String?
  description           String?
  status                CompetitionStatus     @default(DRAFT)
  visibility            CompetitionVisibility @default(PUBLIC)
  accountMode           CompetitionAccountMode @default(REAL_ONLY)
  scoringMode           CompetitionScoringMode @default(RETURN_PERCENT)

  registrationOpenAt    DateTime?
  registrationCloseAt   DateTime?
  startsAt              DateTime
  endsAt                DateTime
  timezone              String                @default("Etc/UTC")

  prizePoolLabel        String?
  prizeDescription      String?
  rulesContent          String?
  coverImageUrl         String?

  allowedBrokers        String[]              @default([])
  minStartingBalance    Float?
  maxStartingBalance    Float?
  minTrades             Int                   @default(0)
  minTradingDays        Int                   @default(0)
  maxDailyDrawdownPct   Float?
  maxOverallDrawdownPct Float?
  maxLotSize            Float?
  lateSyncGraceMinutes  Int                   @default(60)

  createdById           String?               @db.Uuid
  createdAt             DateTime              @default(now()) @db.Timestamptz(6)
  updatedAt             DateTime              @updatedAt @db.Timestamptz(6)

  participants          CompetitionParticipant[]
  prizes                CompetitionPrize[]
  snapshots             CompetitionScoreSnapshot[]
  violations            CompetitionRuleViolation[]
  auditLogs             CompetitionAuditLog[]

  @@index([status])
  @@index([startsAt])
  @@index([endsAt])
}
```

### `CompetitionPrize`

```prisma
model CompetitionPrize {
  id             String      @id @default(cuid())
  competitionId  String
  rankFrom       Int
  rankTo         Int
  label          String
  amount         Float?
  currency       String      @default("USD")
  description    String?
  createdAt      DateTime    @default(now()) @db.Timestamptz(6)

  competition    Competition @relation(fields: [competitionId], references: [id], onDelete: Cascade)

  @@index([competitionId])
}
```

### `CompetitionParticipant`

```prisma
model CompetitionParticipant {
  id                    String                       @id @default(cuid())
  competitionId          String
  userId                 String                       @db.Uuid
  tradingAccountId       String
  status                 CompetitionParticipantStatus @default(REGISTERED)

  joinedAt               DateTime                     @default(now()) @db.Timestamptz(6)
  approvedAt             DateTime?                    @db.Timestamptz(6)
  rejectedAt             DateTime?                    @db.Timestamptz(6)
  disqualifiedAt         DateTime?                    @db.Timestamptz(6)
  disqualificationReason String?

  baselineBalance        Float?
  baselineEquity         Float?
  baselineCapturedAt     DateTime?                    @db.Timestamptz(6)

  latestBalance          Float?
  latestEquity           Float?
  latestReturnPct        Float?
  latestNetPnl           Float?
  latestScore            Float?
  latestRank             Int?
  latestMaxDrawdownPct   Float?
  latestTotalTrades      Int                          @default(0)
  latestTradingDays      Int                          @default(0)
  latestSyncedAt         DateTime?                    @db.Timestamptz(6)

  payoutStatus           CompetitionPayoutStatus      @default(NONE)
  payoutAmount           Float?
  payoutCurrency         String?
  payoutProofUrl         String?
  payoutNote             String?
  payoutReviewedAt       DateTime?                    @db.Timestamptz(6)

  adminNote              String?
  createdAt              DateTime                     @default(now()) @db.Timestamptz(6)
  updatedAt              DateTime                     @updatedAt @db.Timestamptz(6)

  competition            Competition                  @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  user                   User                         @relation(fields: [userId], references: [id], onDelete: Cascade)
  tradingAccount         TradingAccount               @relation(fields: [tradingAccountId], references: [id], onDelete: Cascade)
  snapshots              CompetitionScoreSnapshot[]
  violations             CompetitionRuleViolation[]

  @@unique([competitionId, userId])
  @@unique([competitionId, tradingAccountId])
  @@index([competitionId, status])
  @@index([userId])
  @@index([tradingAccountId])
}
```

### `CompetitionScoreSnapshot`

```prisma
model CompetitionScoreSnapshot {
  id                    String      @id @default(cuid())
  competitionId          String
  participantId          String
  userId                 String      @db.Uuid
  tradingAccountId       String

  snapshotAt             DateTime    @default(now()) @db.Timestamptz(6)
  balance                Float?
  equity                 Float?
  realizedPnl            Float       @default(0)
  returnPct              Float       @default(0)
  score                  Float       @default(0)
  rank                   Int?

  totalTrades            Int         @default(0)
  winCount               Int         @default(0)
  lossCount              Int         @default(0)
  breakEvenCount         Int         @default(0)
  winRate                Float?
  lotVolume              Float       @default(0)
  activeTradingDays      Int         @default(0)
  maxDrawdownPct         Float?
  violationCount         Int         @default(0)

  metadata               Json?
  createdAt              DateTime    @default(now()) @db.Timestamptz(6)

  competition            Competition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  participant            CompetitionParticipant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@index([competitionId, snapshotAt])
  @@index([competitionId, rank])
  @@index([participantId, snapshotAt])
}
```

### `CompetitionRuleViolation`

```prisma
model CompetitionRuleViolation {
  id             String                       @id @default(cuid())
  competitionId  String
  participantId  String
  userId         String                       @db.Uuid

  ruleCode       String
  severity       CompetitionViolationSeverity @default(WARNING)
  title          String
  message        String
  evidence       Json?

  detectedAt     DateTime                     @default(now()) @db.Timestamptz(6)
  resolvedAt     DateTime?                    @db.Timestamptz(6)
  resolvedById   String?                      @db.Uuid
  resolutionNote String?

  competition    Competition                  @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  participant    CompetitionParticipant       @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@index([competitionId, severity])
  @@index([participantId])
  @@index([ruleCode])
}
```

### `CompetitionAuditLog`

```prisma
model CompetitionAuditLog {
  id             String      @id @default(cuid())
  competitionId  String
  actorUserId    String?     @db.Uuid
  actorType      String      @default("SYSTEM")
  action         String
  targetType     String?
  targetId       String?
  message        String?
  metadata       Json?
  createdAt      DateTime    @default(now()) @db.Timestamptz(6)

  competition    Competition @relation(fields: [competitionId], references: [id], onDelete: Cascade)

  @@index([competitionId, createdAt])
  @@index([action])
}
```

## Scoring Rules

### MVP Scoring

Use return percentage, not raw PnL.

```text
returnPct = ((latestEquity - baselineEquity) / baselineEquity) * 100
score = returnPct
```

Why:

- Fairer across account sizes.
- Easy for users to understand.
- Easy for admin to audit.

### Tie Breakers

If two participants have the same score:

1. Lower max drawdown wins.
2. More active trading days wins.
3. More closed trades wins, if within rules.
4. Earlier final valid trade wins.
5. Earlier registration wins.

### Phase 2 Risk-Adjusted Scoring

```text
score =
  returnPct
  - maxDrawdownPenalty
  + consistencyBonus
  - violationPenalty
```

Suggested:

- `maxDrawdownPenalty = maxDrawdownPct * 0.5`
- `consistencyBonus = min(activeTradingDays, 10) * 0.25`
- `violationPenalty = warningCount * 2 + majorCount * 10`

Do not overcomplicate Phase 1. Start with return percentage.

## Trade Eligibility

For professional competitions, only count synced trades.

Allowed `JournalEntry.syncSource`:

- `APP`
- `EA_SYNC`
- `EA_HISTORY`

Do not count manual trades by default:

- `MANUAL`
- CSV imports, unless an admin explicitly enables import competitions.

Trade counting rules:

- `status = CLOSED`.
- `exitDate` must be within competition window.
- `entryDate` can be before competition start only if the competition allows holding pre-existing positions. Default: not allowed.
- `accountId` must match the locked participant trading account.
- `externalTicket` must exist for synced trades.

Default:

- Count trades opened and closed during the competition only.

## Account Eligibility

### MVP Rules

Participant account must:

- Belong to the authenticated user.
- Have an account number.
- Be synced at least once.
- Be marked as non-demo if competition is `REAL_ONLY`.
- Not already be used by another participant in the same competition.
- Not be changed after approval/start.

### Partner/Broker Rules

If `accountMode = PARTNER_ONLY`:

- Broker must match `allowedBrokers`.
- Account may need active `ProEntitlement` or approved `VipRequest`.
- Admin can override eligibility manually.

## Participant Lifecycle

```text
User views competition
-> clicks Join
-> selects account
-> accepts rules
-> participant created
-> eligibility check
-> status APPROVED or PENDING_REVIEW
-> baseline captured at competition start
-> status ACTIVE
-> snapshots generated during competition
-> leaderboard updates
-> competition ends
-> leaderboard frozen
-> winners marked
-> payout workflow
-> archived
```

### Status Meaning

| Status | Meaning |
| --- | --- |
| `REGISTERED` | User submitted join form. |
| `PENDING_REVIEW` | Needs admin approval or eligibility issue. |
| `APPROVED` | Ready before competition starts. |
| `ACTIVE` | Competition is running and participant is live. |
| `REJECTED` | Admin rejected registration. |
| `WITHDRAWN` | User/admin withdrew before start. |
| `DISQUALIFIED` | Rule violation removed participant. |
| `COMPLETED` | Finished without winning. |
| `WINNER` | Final winner. |

## Admin Experience

The admin side is the most important missing part. Without it, the competition cannot be operated professionally.

### `/admin/competitions`

Purpose:

- Command center for all competitions.

Show:

- Running competitions.
- Upcoming competitions.
- Draft competitions.
- Finished competitions.
- Total participants.
- Pending review count.
- Violation count.
- Prize payout pending count.

Primary actions:

- Create competition.
- Open running competition.
- Review pending participants.
- Review violations.
- Finalize finished competition.

### `/admin/competitions/new`

Form fields:

- Title.
- Slug.
- Subtitle.
- Description.
- Visibility.
- Status.
- Registration open/close.
- Start/end date.
- Timezone.
- Account mode.
- Allowed brokers.
- Min/max starting balance.
- Scoring mode.
- Min trades.
- Min trading days.
- Max daily drawdown.
- Max overall drawdown.
- Max lot size.
- Late sync grace.
- Prize pool label.
- Prize tiers.
- Rules content.
- Cover image.

Validation:

- `startsAt < endsAt`.
- `registrationOpenAt <= registrationCloseAt <= startsAt`.
- Slug unique.
- Prize ranks do not overlap.
- If `PARTNER_ONLY`, at least one allowed broker is required.

### `/admin/competitions/[id]/participants`

Table columns:

- User.
- Email.
- Country.
- Account number.
- Broker/server.
- Account status.
- Participant status.
- Baseline balance/equity.
- Current return.
- Current rank.
- Last sync.
- Violations.
- Admin actions.

Filters:

- Status.
- Broker.
- Sync health.
- Violation severity.
- Country.
- Search user/account.

Actions:

- Approve.
- Reject.
- Withdraw.
- Disqualify.
- Reinstate.
- Add admin note.
- Open user detail.
- Open account detail.
- Open participant audit.

### `/admin/competitions/[id]/leaderboard`

Show:

- Current ranking.
- Latest score snapshot time.
- Recompute score button.
- Freeze leaderboard button.
- Export CSV.

Columns:

- Rank.
- Previous rank.
- Trader.
- Account.
- Starting equity.
- Current equity.
- Return %.
- Net PnL.
- Total trades.
- Win rate.
- Max drawdown.
- Violations.
- Last sync.
- Status.

Admin actions:

- Recompute selected participant.
- Recompute all.
- Freeze ranking.
- Mark final winners.

### `/admin/competitions/[id]/violations`

Show:

- All rule violations.
- Severity.
- Evidence.
- Participant.
- Rule code.
- Status resolved/unresolved.

Actions:

- Resolve.
- Escalate.
- Disqualify participant.
- Add admin note.

### `/admin/competitions/[id]/snapshots`

Show:

- Snapshot history.
- Participant rank changes.
- Score changes over time.
- Export snapshot CSV.

This is important for disputes.

### `/admin/competitions/[id]/payouts`

Show:

- Prize tiers.
- Winners.
- Payout amount.
- Payout status.
- Payout proof URL.
- Admin note.

Actions:

- Mark payout pending.
- Mark payout approved.
- Mark payout paid.
- Upload/add proof URL.

### `/admin/competitions/[id]/communications`

Admin can send:

- Registration open announcement.
- Competition started.
- Ending soon.
- Sync reminder.
- Rule warning.
- Final results.
- Payout update.

Targeting:

- All participants.
- Pending review.
- Active participants.
- Users with stale sync.
- Winners only.

### `/admin/competitions/[id]/audit`

Record:

- Competition created/updated.
- Participant joined.
- Participant approved/rejected.
- Baseline captured.
- Score recomputed.
- Rule violation detected.
- Participant disqualified/reinstated.
- Leaderboard frozen.
- Winner marked.
- Payout updated.

Audit logs should be append-only.

## Anti-Cheat Rules

Build anti-cheat as a service, not scattered UI logic.

Recommended file:

- `src/lib/competitions/anti-cheat.ts`

### Rule Codes

| Rule Code | Severity | Meaning |
| --- | --- | --- |
| `DUPLICATE_ACCOUNT_IN_COMPETITION` | DISQUALIFY | Same trading account used by multiple participants. |
| `ACCOUNT_OWNER_MISMATCH` | DISQUALIFY | Trading account no longer belongs to participant. |
| `ACCOUNT_CHANGED_AFTER_LOCK` | DISQUALIFY | Participant changed account after approval/start. |
| `DEMO_ACCOUNT_NOT_ALLOWED` | MAJOR | Demo account in real-only competition. |
| `UNSUPPORTED_BROKER` | MAJOR | Broker not allowed for partner competition. |
| `LATE_SYNC_AFTER_CUTOFF` | WARNING/MAJOR | Trades synced after allowed grace window. |
| `BACKDATED_TRADE_DETECTED` | MAJOR | Trade appears after cutoff with old exit date. |
| `MANUAL_TRADE_NOT_ALLOWED` | MAJOR | Manual trade included in score. |
| `MAX_DRAWDOWN_BREACH` | DISQUALIFY | Drawdown exceeds competition rule. |
| `MAX_LOT_SIZE_BREACH` | MAJOR | Lot size exceeds rule. |
| `MIN_TRADES_NOT_MET` | INFO | Participant not eligible for final ranking. |
| `MIN_TRADING_DAYS_NOT_MET` | INFO | Participant not eligible for final ranking. |
| `STALE_SYNC` | WARNING | No sync heartbeat for configured period. |
| `PNL_SPIKE_REVIEW` | WARNING | PnL jump exceeds review threshold. |

### Important Anti-Cheat Notes

- Do not automatically disqualify for every warning.
- Major and disqualify rules should appear in admin review.
- Keep evidence JSON for every violation.
- Evidence should include relevant trade IDs, timestamps, account ID, and computed values.

## Services To Build

Recommended folder:

- `src/lib/competitions/`

Files:

| File | Purpose |
| --- | --- |
| `eligibility.ts` | Check if a user/account can join. |
| `scoring.ts` | Compute score, return %, drawdown, tie-breakers. |
| `snapshots.ts` | Create score snapshots and update participant latest fields. |
| `anti-cheat.ts` | Detect rule violations. |
| `leaderboard.ts` | Query live/frozen leaderboard. |
| `lifecycle.ts` | Move competition and participant statuses. |
| `audit.ts` | Append competition audit logs. |
| `payouts.ts` | Manage winner/payout state. |
| `notifications.ts` | Trigger competition notifications/emails. |

## Score Snapshot Strategy

### MVP

Create snapshots:

- When admin clicks recompute.
- When participant syncs new trades.
- When competition starts.
- When competition ends.

### Phase 2

Add cron:

- Every 15 minutes for running competitions.
- Every hour for lower traffic.
- On-demand after sync.

Implementation:

- After TNT Connect/EA sync succeeds, enqueue/recompute active competition participants for that account.
- If no queue system exists yet, call lightweight recompute inline only for the synced account.

## Integration With Existing Sync

### TNT Connect `/api/sync/trades`

After successful import/update:

1. Update account as it already does.
2. If imported/updated trades belong to an active competition account:
   - Recompute participant score.
   - Detect violations.
   - Create snapshot.
   - Update participant latest fields.

### EA Sync `/api/ea/*`

Apply the same post-sync hook:

```ts
await recomputeActiveCompetitionsForAccount(accountId)
```

Do not duplicate scoring logic inside sync routes.

## Public Competition Page Requirements

### `/competitions/[slug]`

Above the fold:

- Competition title.
- Status badge.
- Countdown.
- Prize pool.
- Join CTA.
- Current participant count.
- Start/end date.

Sections:

- Leaderboard preview.
- Prize tiers.
- Rules.
- Eligibility.
- How to join.
- FAQ.

CTA rules:

- Anonymous user: `Sign up to join`.
- Authenticated with no account: `Connect MT5 account`.
- Authenticated with eligible account: `Join competition`.
- Already joined: `View my rank`.
- Registration closed: `View leaderboard`.
- Finished: `View winners`.

## Trader Dashboard Requirements

### `/dashboard/competitions`

Show:

- My active competitions.
- Available competitions.
- Upcoming competitions.
- Finished competitions.

For each competition card:

- Status.
- Prize pool.
- Dates.
- My status.
- My rank if joined.
- Main CTA.

### `/dashboard/competitions/[slug]`

Show:

- My participant status.
- Locked account.
- Current rank.
- Current score.
- Return %.
- Net PnL.
- Total trades.
- Max drawdown.
- Last sync.
- Rule warnings.
- Next action.

Next action examples:

- `Connect an eligible MT5 account`.
- `Join this competition`.
- `Sync your first competition trades`.
- `You are in prize range - keep sync active`.
- `Resolve stale sync`.
- `Competition finished - view final results`.

## Notifications And Email

### User Notifications

| Event | In-app | Email |
| --- | --- | --- |
| Registration submitted | Yes | Optional |
| Registration approved | Yes | Yes |
| Registration rejected | Yes | Yes |
| Competition starting soon | Yes | Yes |
| Competition started | Yes | Yes |
| Sync stale during competition | Yes | Yes |
| Rule warning | Yes | Yes |
| Entered prize zone | Yes | Optional |
| Competition ending soon | Yes | Yes |
| Final ranking ready | Yes | Yes |
| Winner/payout update | Yes | Yes |

### Admin Notifications

| Event | Notify Admin? |
| --- | --- |
| New participant pending review | Yes |
| Major violation detected | Yes |
| Disqualify-level violation detected | Yes |
| Competition ending soon | Yes |
| Payout pending | Yes |

## Analytics Events

Track:

- `competition_viewed`
- `competition_join_clicked`
- `competition_join_submitted`
- `competition_join_approved`
- `competition_join_rejected`
- `competition_leaderboard_viewed`
- `competition_rules_viewed`
- `competition_score_snapshot_created`
- `competition_violation_detected`
- `competition_participant_disqualified`
- `competition_winner_marked`
- `competition_payout_marked_paid`

Metadata:

- `competitionId`
- `slug`
- `userId`
- `tradingAccountId`
- `participantId`
- `status`
- `source`

## Permissions

Public:

- Can view public competitions and public leaderboards.

Authenticated user:

- Can join eligible competitions.
- Can view own participant details.
- Can withdraw only before competition starts if allowed.

Admin:

- Full competition management.
- Can approve/reject/disqualify/reinstate.
- Can freeze leaderboard.
- Can mark payouts.

Do not expose:

- Full account numbers publicly.
- Sync API keys.
- Admin notes.
- Internal violation evidence publicly.

## Privacy And Public Display

Public leaderboard should show:

- Display name.
- Username.
- Avatar if public.
- Country if user allows it.
- Rank.
- Return %.
- Score.
- Total trades.
- Max drawdown if competition rules require transparency.
- Public trader card link.

Public leaderboard should not show:

- Full email.
- Full account number.
- Private notes.
- API keys.
- Full trade history unless explicitly public.

Mask account:

```text
600001145 -> ******145
```

## Edge And Badges Integration

After competition finalization:

- Award Edge for participation.
- Award badge for top 3.
- Award badge for winner.
- Award badge for clean competition with no violations.
- Add competition history to public trader card.

Recommended Edge events:

- `competition_joined`
- `competition_completed`
- `competition_top_10`
- `competition_podium`
- `competition_winner`
- `competition_clean_run`

## MVP Implementation Order

### 1. Database

- Add competition models and enums.
- Add relations to `User` and `TradingAccount`.
- Run migration.
- Add indexes for leaderboard and participant queries.

Verify:

- Prisma generate succeeds.
- Migration applies locally.

### 2. Core Services

- Build eligibility service.
- Build scoring service.
- Build snapshot service.
- Build audit service.

Verify:

- Unit tests for return %.
- Unit tests for eligibility.
- Unit tests for tie-breakers.

### 3. Admin Create/List

- Build `/admin/competitions`.
- Build `/admin/competitions/new`.
- Build edit/settings page.

Verify:

- Admin can create draft.
- Admin can publish registration-open competition.

### 4. Public Competition Pages

- Build `/competitions`.
- Build `/competitions/[slug]`.
- Build `/competitions/[slug]/leaderboard`.

Verify:

- Public user can view.
- Authenticated user sees correct CTA.

### 5. Join Flow

- Build account selection.
- Validate eligibility.
- Create participant.
- Accept rules checkbox.
- Add audit log.

Verify:

- User with no account cannot join.
- User with eligible account can join.
- Same account cannot join same competition twice.

### 6. Baseline Capture

- Capture baseline at approval/start.
- Store balance/equity.
- Prevent account changes after lock.

Verify:

- Participant has baseline fields.
- Baseline does not change after recompute.

### 7. Leaderboard

- Compute return %.
- Rank participants.
- Store latest participant fields.
- Show public and admin leaderboard.

Verify:

- Ranking updates after trade sync.
- Tie-breakers work.

### 8. Anti-Cheat MVP

- Duplicate account detection.
- Demo account detection.
- Manual trade exclusion.
- Late sync warning.
- Stale sync warning.
- Max drawdown breach if configured.

Verify:

- Violations appear in admin.
- Disqualify action removes participant from active ranking.

### 9. Finalization And Payout

- Freeze leaderboard.
- Mark winners.
- Create payout records/status on participants.
- Add winners page.

Verify:

- Final leaderboard no longer changes after freeze.
- Admin can mark payout paid.

### 10. QA And Docs

- Playwright smoke test public and admin pages.
- Update `docs/FEATURE_SPECS.md`.
- Add release checklist.

Verify:

- New docs mention all new URLs.
- Old user flows still work.

## QA Checklist

### Public

- `/competitions` empty state.
- `/competitions` with upcoming/running/finished competitions.
- `/competitions/[slug]` anonymous CTA.
- `/competitions/[slug]` logged-in no account CTA.
- `/competitions/[slug]` eligible account join CTA.
- `/competitions/[slug]/leaderboard` displays ranks.
- Finished competition shows winners.

### Trader

- User joins with eligible account.
- User cannot join with demo account when `REAL_ONLY`.
- User cannot join same competition twice.
- User cannot change locked account after start.
- User sees own rank.
- User sees stale sync warning.
- User sees rule warning.

### Admin

- Admin creates draft competition.
- Admin opens registration.
- Admin approves participant.
- Admin rejects participant.
- Admin disqualifies participant.
- Admin reinstates participant.
- Admin recomputes leaderboard.
- Admin freezes leaderboard.
- Admin marks winners.
- Admin marks payout paid.
- Admin exports CSV.

### Sync

- TNT Connect sync updates competition score.
- EA Sync updates competition score.
- Duplicate trade sync does not inflate score.
- Manual trade does not count by default.
- Late sync creates warning.

### Scoring

- Return % calculation.
- Net PnL calculation.
- Max drawdown calculation.
- Tie-breaker ordering.
- No baseline returns no rank.
- Zero/invalid baseline is handled safely.

### Security/Privacy

- Public pages do not expose email.
- Public pages do not expose full account number.
- Non-admin cannot access admin competition pages.
- User cannot join using another user's account.
- User cannot modify competition participant status.

## Open Product Decisions

These can be decided before Phase 2, not required for MVP:

1. Should demo accounts ever be allowed?
2. Should competitions require partner broker accounts?
3. Should manual journal competitions exist?
4. Should there be entry fees?
5. Should winner payout be cash, Edge, Pro access, or broker credit?
6. Should public leaderboard show max drawdown?
7. Should participants be anonymous by default?
8. Should competitions be country-limited?

## Recommended MVP Defaults

- Competition account mode: `REAL_ONLY`.
- Score: `RETURN_PERCENT`.
- Public leaderboard: yes.
- Manual trades: excluded.
- Entry fee: no.
- Payout: manual admin tracking.
- Broker restriction: optional.
- Participant approval: automatic if eligible.
- Disqualification: manual admin action after violation.
- Snapshot: on sync and admin recompute.

## What Not To Build First

- Paid entry fee.
- Automated payout.
- Broker API direct mobile-only sync.
- Team leagues.
- Copy trading tournaments.
- Complex risk-adjusted formula.
- Social feed.
- Live streaming.

## Final Recommendation

TheNextTrade can launch a credible MVP competition if it builds the competition engine as a separate module on top of the existing trade sync and journal data.

The highest-risk missing pieces are:

1. Admin operations.
2. Account locking.
3. Baseline snapshots.
4. Scoring snapshots.
5. Anti-cheat and audit logs.

Build those before investing heavily in visual polish.

