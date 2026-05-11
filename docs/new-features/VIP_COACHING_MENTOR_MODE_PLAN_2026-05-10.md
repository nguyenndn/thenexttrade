# VIP Coaching / Mentor Mode Plan - 2026-05-10

Product: TheNextTrade

Purpose:

Build a mentor/coaching system for TheNextTrade that lets a coach review student traders, leave feedback on trades, and prioritize the traders who need help most.

This should not be a plain clone of TradeZella Mentor Mode. TheNextTrade should make mentor mode more useful for a trading community by combining:

- Journal data.
- Mistakes.
- Rule violations.
- Pro / VIP access.
- IB trader activity.
- Trade Replay / Trade Autopsy.

## Product Positioning

Recommended feature name:

**VIP Coaching Mode**

Alternative names:

- Mentor Dashboard
- Community Coaching Mode
- Accountability Mode
- Coaching Workspace

Recommended UI labels:

- `Coaching`
- `Students`
- `Review Queue`
- `Trade Feedback`

Core promise:

> Help the mentor know who needs help, what trade to review, what mistake repeated, and what action the student should take next.

## Current State

TheNextTrade already has useful foundations:

- User dashboard.
- Admin dashboard.
- Trading journal.
- Analytics.
- Mistake tagging.
- Rule Violation Tracker.
- Pro Access / VIP verification.
- IB trader monitor.
- Notifications.
- Reports.
- Trade detail sheet.
- Planned Trade Replay / Trade Autopsy feature.

What does not exist yet:

- Mentor-student relationship.
- Invite/accept/revoke mentorship.
- Mentor permission model.
- Mentor dashboard.
- View-only student dashboard context.
- Trade comments/feedback.
- Review queue.
- Student feedback inbox.
- Compare students.
- Mentor activity tracking.

## Strategic Direction

TradeZella-style Mentor Mode mostly answers:

> Can a mentor see a student's trading data?

TheNextTrade should answer:

> Which student needs help today, what exactly went wrong, and what should the mentor tell them?

This is the differentiation.

## The 3 Phases

| Phase | Name | Goal | Value |
| --- | --- | --- | --- |
| Phase 1 | Coaching Access MVP | Mentor invites students, student accepts, mentor sees read-only student list and basic performance | Foundation and permissions |
| Phase 2 | Trade Feedback Workspace | Mentor comments on trades, assigns feedback, student gets notifications and can resolve | Real coaching loop |
| Phase 3 | Intelligent Review Queue | System prioritizes students/trades by mistakes, rule violations, inactivity, IB activity, replay/autopsy | The moat |

Build in this order.

## Roles And Permissions

Existing role:

`UserRole` currently has admin/user behavior through `Profile.role`.

Recommended:

Do not add a global `MENTOR` role in Phase 1 unless needed. Instead, a user becomes a mentor by having accepted `Mentorship` relationships.

Reason:

- A normal user may mentor someone later.
- Admin can also mentor.
- Role explosion is avoided.

Permission rules:

- Admin can see everything through Admin dashboard.
- Mentor can only see students who accepted mentorship.
- Student can revoke mentor access.
- Mentor access is view-only by default.
- Mentor cannot edit student trades.
- Mentor cannot delete student trades.
- Mentor cannot access student security settings.
- Mentor cannot see API keys, account numbers, sync keys, personal security sessions, or private billing/security info.

## Privacy Principle

Student must understand what is shared.

When accepting mentor invite, show:

Mentor can view:

- Journal entries.
- Analytics summary.
- Mistakes.
- Trading reports.
- Rule violations.
- Trade screenshots if attached.
- Replay/autopsy if available.

Mentor cannot:

- Place trades.
- Edit/delete trades.
- See passwords/API keys.
- Change account settings.
- Revoke Pro access.
- Access private security settings.

Student controls:

- Accept.
- Decline.
- Revoke.
- Optional: choose which trading accounts to share.

## Phase 1 - Coaching Access MVP

### Goal

Create the foundation:

- Mentor can invite a student.
- Student can accept/decline.
- Student can revoke later.
- Mentor can see accepted students in a Coaching dashboard.
- Mentor can open read-only student overview.

### Scope

In scope:

- Prisma models for mentorship.
- Server actions for invite/accept/decline/revoke.
- Mentor dashboard route.
- Student coaching settings route.
- Basic student cards.
- Basic read-only student overview.
- Notifications.
- Permission helpers.
- E2E tests.

Out of scope:

- Trade comments.
- View-only full impersonation.
- Compare students.
- AI prioritization.
- Replay comments.

### Prisma Schema

Add enums:

```prisma
enum MentorshipStatus {
  PENDING
  ACTIVE
  DECLINED
  REVOKED
  REMOVED
}

enum MentorshipInviteMethod {
  EMAIL
  LINK
  MANUAL
}
```

Add model:

```prisma
model Mentorship {
  id             String                 @id @default(cuid())

  mentorId       String                 @db.Uuid
  mentor         User                   @relation("MentorRelations", fields: [mentorId], references: [id], onDelete: Cascade)

  studentId      String?                @db.Uuid
  student        User?                  @relation("StudentRelations", fields: [studentId], references: [id], onDelete: Cascade)

  studentEmail   String?                @db.VarChar(255)
  status         MentorshipStatus       @default(PENDING)
  inviteMethod   MentorshipInviteMethod @default(EMAIL)

  inviteToken    String                 @unique @db.VarChar(128)
  inviteExpiresAt DateTime?             @db.Timestamptz

  acceptedAt     DateTime?              @db.Timestamptz
  declinedAt     DateTime?              @db.Timestamptz
  revokedAt      DateTime?              @db.Timestamptz
  removedAt      DateTime?              @db.Timestamptz

  note           String?                @db.Text
  shareAllAccounts Boolean              @default(true)
  sharedAccountIds String[]             @default([])

  createdAt      DateTime               @default(now()) @db.Timestamptz
  updatedAt      DateTime               @updatedAt @db.Timestamptz

  @@unique([mentorId, studentId])
  @@index([mentorId, status])
  @@index([studentId, status])
  @@index([studentEmail])
}
```

Add relations to `User`:

```prisma
mentorRelations Mentorship[] @relation("MentorRelations")
studentRelations Mentorship[] @relation("StudentRelations")
```

Optional later:

Add `MentorProfile`, but skip for Phase 1.

### Routes

Add mentor routes:

```txt
src/app/dashboard/coaching/page.tsx
src/app/dashboard/coaching/students/page.tsx
src/app/dashboard/coaching/students/[studentId]/page.tsx
src/app/dashboard/coaching/invites/page.tsx
```

Add student settings:

```txt
src/app/dashboard/settings/coaching/page.tsx
```

Add public/authenticated invite route:

```txt
src/app/coaching/invite/[token]/page.tsx
```

### Navigation

Add to user dashboard nav:

- `Coaching`

Visibility:

- Show if user has at least one mentorship as mentor, or if admin, or if feature flag allows.
- Student coaching settings should be available under Settings for all users.

### Server Actions

Create:

`src/actions/mentorship.ts`

Functions:

```ts
export async function createMentorshipInvite(input: {
  studentEmail?: string;
  note?: string;
  shareAllAccounts?: boolean;
  sharedAccountIds?: string[];
})

export async function getMentorStudents()

export async function getMentorshipInvite(token: string)

export async function acceptMentorshipInvite(token: string)

export async function declineMentorshipInvite(token: string)

export async function revokeMentorship(mentorshipId: string)

export async function removeStudent(mentorshipId: string)

export async function getMyMentors()

export async function canMentorViewStudent(mentorId: string, studentId: string)
```

Rules:

- Auth required for all except reading invite metadata if desired.
- Mentor cannot invite self.
- Invite token must be random and unguessable.
- Pending invite can be accepted only by logged-in user whose email matches `studentEmail`, unless invite method is link and no email is set.
- Accepted mentorship stores `studentId`.
- Only student can revoke.
- Only mentor can remove.
- `canMentorViewStudent` must check `status = ACTIVE`.

### Mentor Dashboard Data

Create:

`src/actions/coaching-dashboard.ts`

Functions:

```ts
export async function getCoachingOverview()

export async function getStudentCoachingSummary(studentId: string)
```

Student summary fields:

```ts
interface StudentCoachingSummary {
  studentId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  activeSince: string;
  lastTradeAt: string | null;
  totalTrades30d: number;
  netPnl30d: number;
  winRate30d: number;
  topMistakes30d: Array<{ code: string; name: string; count: number }>;
  planCompliance30d: number | null;
  hasProAccess: boolean;
  proStatus: string;
  ibBroker: string | null;
}
```

Keep this query read-only.

### UI Components

Add:

```txt
src/components/coaching/CoachingOverview.tsx
src/components/coaching/StudentCard.tsx
src/components/coaching/StudentList.tsx
src/components/coaching/CreateInviteModal.tsx
src/components/coaching/InviteLinkCard.tsx
src/components/coaching/StudentOverview.tsx
src/components/coaching/MentorsSettingsPanel.tsx
src/components/coaching/AcceptInviteCard.tsx
```

### Mentor Dashboard UX

`/dashboard/coaching`

Sections:

- Header: `Coaching`
- CTA: `Invite student`
- Stats:
  - Active students.
  - Pending invites.
  - Trades reviewed this week.
  - Students at risk.
- Student list:
  - Name.
  - Last trade.
  - 30d PnL.
  - Win rate.
  - Top mistake.
  - Pro/VIP status.
  - Action: `View`

### Student Overview UX

`/dashboard/coaching/students/[studentId]`

Read-only overview:

- Student profile.
- Last 30 days metrics.
- Equity/PnL summary.
- Top mistakes.
- Recent trades.
- Rule compliance summary if Pro data exists.
- Button: `Open Journal View` can be added later.

Do not allow edit/delete actions.

### Student Settings UX

`/dashboard/settings/coaching`

Sections:

- Active mentors.
- Pending invitations.
- Revoked/previous mentors.

Actions:

- Accept.
- Decline.
- Revoke.
- Choose shared accounts later.

### Notifications

Use existing `Notification` model if possible.

Notification events:

- Mentor invite received.
- Invite accepted.
- Invite declined.
- Student revoked access.

If existing `NotificationType` enum does not have types, add:

- `MENTOR_INVITE`
- `MENTOR_ACCEPTED`
- `MENTOR_DECLINED`
- `MENTOR_REVOKED`

Only add enum values if the project uses strict enum for notification type.

### Phase 1 Acceptance Criteria

Mentor:

- Can create invite.
- Can see pending invites.
- Can see accepted students.
- Can remove student.
- Cannot see unaccepted student data.

Student:

- Can open invite.
- Can accept invite.
- Can decline invite.
- Can revoke mentor access.
- Can see current mentor list.

Security:

- Mentor cannot access another user without active mentorship.
- Mentor cannot edit/delete student trades.
- Invite token is not guessable.
- Expired invite cannot be accepted.

UI:

- Coaching route works on desktop.
- Coaching route works on mobile.
- Settings page works on mobile.

### Phase 1 Tests

Unit/integration:

- Invite self fails.
- Create invite succeeds.
- Accept invite creates active mentorship.
- Decline invite sets declined.
- Revoke sets revoked.
- `canMentorViewStudent` returns true only for active.
- Mentor cannot view random user summary.

E2E:

- Create mentor user.
- Create student user.
- Mentor creates invite.
- Student accepts invite.
- Mentor sees student in dashboard.
- Mentor opens student overview.
- Student revokes.
- Mentor can no longer access student overview.

### Phase 1 Claude Prompt

```text
Implement Phase 1 from docs/VIP_COACHING_MENTOR_MODE_PLAN_2026-05-10.md.

Goal:
- Build Coaching Access MVP.

Scope:
- Add MentorshipStatus and MentorshipInviteMethod enums.
- Add Mentorship model and User relations.
- Add migration.
- Add mentorship server actions.
- Add coaching dashboard route.
- Add student coaching settings route.
- Add invite accept route.
- Add basic mentor student overview.
- Add notifications if existing notification type supports it cleanly.
- Add tests and Playwright coverage.

Constraints:
- Mentor access is read-only.
- Student must accept before mentor sees data.
- Student can revoke access.
- Do not implement trade comments yet.
- Do not implement AI review queue yet.
- Do not expose API keys, account numbers, or security settings.

Verification:
- npx prisma format
- npx prisma generate
- npx tsc --noEmit
- npm run lint
- npx dotenv -e .env -- npx playwright test tests/e2e/coaching-mode-qa.spec.ts --project=chromium --reporter=list
```

## Phase 2 - Trade Feedback Workspace

### Goal

Create the actual coaching loop:

- Mentor reviews student trades.
- Mentor leaves comments/feedback.
- Student receives notification.
- Student can mark feedback resolved.
- Mentor can track unresolved feedback.

### Scope

In scope:

- Feedback/comment model.
- Comments on journal trades.
- Feedback status workflow.
- Mentor feedback inbox.
- Student feedback inbox.
- Notifications.
- Read/unread states.
- Optional trade detail integration.

Out of scope:

- AI-generated feedback.
- Replay chart comments.
- Multi-student comparison.
- Automated review queue.

### Prisma Schema

Add enums:

```prisma
enum CoachingFeedbackStatus {
  OPEN
  RESOLVED
  ARCHIVED
}

enum CoachingFeedbackType {
  GENERAL
  TRADE_REVIEW
  RULE_VIOLATION
  MISTAKE_REVIEW
}
```

Add model:

```prisma
model CoachingFeedback {
  id             String                 @id @default(cuid())

  mentorshipId   String
  mentorship     Mentorship             @relation(fields: [mentorshipId], references: [id], onDelete: Cascade)

  mentorId       String                 @db.Uuid
  mentor         User                   @relation("CoachingFeedbackMentor", fields: [mentorId], references: [id], onDelete: Cascade)

  studentId      String                 @db.Uuid
  student        User                   @relation("CoachingFeedbackStudent", fields: [studentId], references: [id], onDelete: Cascade)

  journalEntryId String?
  journalEntry   JournalEntry?          @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)

  type           CoachingFeedbackType   @default(GENERAL)
  status         CoachingFeedbackStatus @default(OPEN)

  body           String                 @db.Text
  mentorPrivateNote String?             @db.Text

  readByStudentAt DateTime?             @db.Timestamptz
  resolvedAt      DateTime?             @db.Timestamptz
  archivedAt      DateTime?             @db.Timestamptz

  createdAt      DateTime               @default(now()) @db.Timestamptz
  updatedAt      DateTime               @updatedAt @db.Timestamptz

  @@index([mentorId, status])
  @@index([studentId, status])
  @@index([journalEntryId])
  @@index([mentorshipId])
}
```

Add relations if needed:

```prisma
coachingFeedbackGiven CoachingFeedback[] @relation("CoachingFeedbackMentor")
coachingFeedbackReceived CoachingFeedback[] @relation("CoachingFeedbackStudent")
```

Add to `JournalEntry`:

```prisma
coachingFeedback CoachingFeedback[]
```

Add to `Mentorship`:

```prisma
feedback CoachingFeedback[]
```

### Server Actions

Create:

`src/actions/coaching-feedback.ts`

Functions:

```ts
export async function createTradeFeedback(input: {
  studentId: string;
  journalEntryId?: string;
  body: string;
  type?: CoachingFeedbackType;
  mentorPrivateNote?: string;
})

export async function getMentorFeedback(filter?: {
  studentId?: string;
  status?: CoachingFeedbackStatus;
})

export async function getStudentFeedback(filter?: {
  status?: CoachingFeedbackStatus;
})

export async function markFeedbackRead(feedbackId: string)

export async function resolveFeedback(feedbackId: string)

export async function archiveFeedback(feedbackId: string)

export async function deleteFeedback(feedbackId: string)
```

Rules:

- Mentor can create feedback only for active students.
- Student can read only own feedback.
- Student can resolve feedback.
- Mentor can archive/delete own feedback.
- Mentor cannot create feedback for random user.
- Mentor cannot attach feedback to a trade that does not belong to the student.

### UI Integration

Add components:

```txt
src/components/coaching/feedback/FeedbackComposer.tsx
src/components/coaching/feedback/FeedbackThread.tsx
src/components/coaching/feedback/FeedbackCard.tsx
src/components/coaching/feedback/FeedbackInbox.tsx
src/components/coaching/feedback/FeedbackStatusBadge.tsx
```

Routes:

```txt
src/app/dashboard/coaching/feedback/page.tsx
src/app/dashboard/coaching/students/[studentId]/trades/page.tsx
src/app/dashboard/settings/coaching/feedback/page.tsx
```

Optional:

- Add feedback section inside `TradeDetailSheet`.
- If current viewer is mentor viewing student trade, show `Leave Feedback`.
- If current viewer is student, show mentor feedback read-only with resolve action.

### Mentor Trade Review UX

Mentor opens student overview:

- Recent trades list.
- Click trade.
- Trade detail opens read-only.
- Right panel or tab: `Feedback`.
- Mentor writes feedback.
- Student receives notification.

Feedback form fields:

- Feedback body.
- Type:
  - General.
  - Trade Review.
  - Rule Violation.
  - Mistake Review.
- Optional private mentor note, visible only to mentor.

### Student Feedback UX

Student dashboard:

- Notification bell shows new feedback.
- `/dashboard/settings/coaching/feedback` or `/dashboard/coaching/feedback` shows feedback inbox.
- Student can:
  - Mark read.
  - Resolve.
  - Open related trade.

### Phase 2 Acceptance Criteria

Mentor:

- Can leave feedback on accepted student's trade.
- Can see own open/resolved feedback.
- Can archive feedback.
- Cannot leave feedback on non-student trade.

Student:

- Receives notification.
- Can read feedback.
- Can resolve feedback.
- Cannot see mentor private note.

Security:

- Feedback ownership enforced server-side.
- Journal trade relation enforced.
- Revoked mentorship blocks new feedback creation.

UI:

- Feedback works on desktop and mobile.
- Empty states are clear.

### Phase 2 Tests

Integration:

- Mentor feedback creation succeeds for active mentorship.
- Feedback creation fails for revoked mentorship.
- Feedback creation fails for wrong trade owner.
- Student resolve succeeds.
- Other user cannot read feedback.

E2E:

- Mentor creates feedback on student trade.
- Student sees notification/inbox.
- Student resolves.
- Mentor sees resolved status.

### Phase 2 Claude Prompt

```text
Implement Phase 2 from docs/VIP_COACHING_MENTOR_MODE_PLAN_2026-05-10.md.

Goal:
- Build Trade Feedback Workspace.

Scope:
- Add CoachingFeedback model/enums and relations.
- Add coaching feedback server actions.
- Add mentor feedback page.
- Add student feedback inbox.
- Integrate feedback into student trade review surface if straightforward.
- Add notifications.
- Add tests.

Constraints:
- Mentor can only feedback active students.
- Mentor cannot edit/delete student trades.
- Student cannot see mentorPrivateNote.
- Revoked mentorship blocks new feedback.
- Keep UI consistent with dashboard.

Verification:
- npx prisma format
- npx prisma generate
- npx tsc --noEmit
- npm run lint
- npx dotenv -e .env -- npx playwright test tests/e2e/coaching-feedback-qa.spec.ts --project=chromium --reporter=list
```

## Phase 3 - Intelligent Review Queue

### Goal

Make the mentor dashboard smarter than a passive data viewer.

The system should tell the mentor:

- Who needs help first.
- Which trade to review.
- Which mistake is repeating.
- Which student is inactive.
- Which VIP/IB trader is not trading.
- Which student is breaking rules.

### Scope

In scope:

- Review queue action.
- Student risk scoring.
- Trade prioritization.
- Mistake/rule/inactivity signals.
- IB activity signals.
- Comparison view for up to 5 students.
- Replay/autopsy integration.
- Weekly mentor digest.

Out of scope:

- Predictive trading advice.
- Auto-generated trading signals.
- Ranking students publicly.

### Review Queue Model

Do not add a DB model immediately unless caching is needed.

Start with computed server action:

`src/actions/coaching-review-queue.ts`

Function:

```ts
export async function getCoachingReviewQueue(input?: {
  accountId?: string;
  days?: number;
  limit?: number;
})
```

Return:

```ts
interface CoachingReviewQueueItem {
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  priority: "high" | "medium" | "low";
  reasonType:
    | "big_loss"
    | "repeated_mistake"
    | "rule_violation"
    | "inactive"
    | "overtrading"
    | "ib_dormant"
    | "new_feedback_needed";
  title: string;
  description: string;
  journalEntryId?: string;
  mistakeIds: string[];
  metrics: {
    pnl?: number;
    tradeCount?: number;
    daysInactive?: number;
    violationCount?: number;
    repeatedMistakeCount?: number;
  };
  suggestedAction:
    | "review_trade"
    | "leave_feedback"
    | "send_check_in"
    | "open_replay"
    | "assign_lesson";
}
```

### Priority Signals

High priority:

- Biggest loss in last 7 days.
- Repeated same mistake 3+ times in 14 days.
- Max risk rule violated.
- Daily loss rule exceeded.
- IB Pro user dormant 14+ days.
- New student with first big loss.

Medium priority:

- No trades in 7 days.
- Plan compliance below 50%.
- Winrate dropped sharply.
- More than max daily trades.
- Unresolved feedback older than 7 days.

Low priority:

- Positive progress.
- Student needs routine check-in.
- New trade waiting for review.

### Student Risk Score

Create:

`src/lib/coaching/risk-score.ts`

Inputs:

- PnL trend.
- Trade count.
- Last trade date.
- Mistake frequency.
- Rule violations.
- Plan compliance.
- IB activity snapshot.
- Unresolved feedback.

Output:

```ts
interface StudentRiskScore {
  score: number; // 0-100
  level: "healthy" | "watch" | "at_risk" | "urgent";
  reasons: string[];
}
```

Suggested scoring:

- Big loss last 7 days: +25
- Repeated mistake: +20
- Rule violation: +20
- Dormant Pro/IB user: +15
- Unresolved feedback older than 7d: +10
- Plan compliance under 50%: +10

Clamp to 100.

### Mentor Dashboard UI

Update:

`/dashboard/coaching`

Add:

- `Review Queue`
- `At-risk Students`
- `Recent Feedback`
- `Student Comparison`

Review queue item actions:

- `Open Trade`
- `Open Replay`
- `Leave Feedback`
- `Send Check-in`
- `Assign Lesson`

### Student Comparison

Support selecting up to 5 students.

Compare:

- Net PnL.
- Trade count.
- Win rate.
- Plan compliance.
- Top mistake.
- Last trade date.
- Feedback open count.

Use existing chart library if available, likely `recharts`.

This is useful but should be lower priority than review queue.

### Replay / Autopsy Integration

If Trade Replay exists:

- Queue item for big loss should open trade directly in Replay tab.
- Mentor can comment from replay/autopsy view.
- Autopsy can suggest feedback draft, but mentor must approve manually.

Do not auto-send AI feedback.

### Weekly Mentor Digest

Add later in Phase 3:

- Weekly summary page or notification.

Digest:

- Students active this week.
- Students inactive.
- Top repeated mistakes.
- Biggest loss to review.
- Feedback unresolved.

Optional email later.

### Phase 3 Acceptance Criteria

Review queue:

- Returns meaningful items for active students.
- Does not include revoked/removed students.
- Prioritizes severe issues first.
- Includes suggested action.

Risk score:

- Deterministic.
- Explainable reasons.
- Tested with fixtures.

UI:

- Mentor can open queue.
- Mentor can open related trade.
- Mentor can leave feedback from queue.
- Empty state is useful.

Security:

- Queue only includes active students for current mentor.
- No private security/account key data exposed.

### Phase 3 Tests

Unit:

- Risk score big loss.
- Risk score repeated mistakes.
- Risk score inactivity.
- Priority sorting.

Integration:

- Queue excludes revoked students.
- Queue includes repeated mistake item.
- Queue includes IB dormant item when snapshot exists.

E2E:

- Create mentor/student.
- Create several student trades.
- Create mistakes/rule violations.
- Open coaching dashboard.
- Verify review queue.
- Open trade from queue.
- Leave feedback.

### Phase 3 Claude Prompt

```text
Implement Phase 3 from docs/VIP_COACHING_MENTOR_MODE_PLAN_2026-05-10.md.

Goal:
- Build Intelligent Review Queue for mentors.

Scope:
- Add coaching review queue server action.
- Add student risk score helper.
- Add review queue UI to /dashboard/coaching.
- Add at-risk student cards.
- Add optional student comparison if straightforward.
- Integrate with trade feedback and trade replay if those features exist.
- Add tests.

Constraints:
- Do not auto-send AI feedback.
- Do not generate trading signals.
- Queue must only include active mentorship students.
- Keep scoring explainable.
- Avoid broad refactors.

Verification:
- npx tsc --noEmit
- npm run lint
- npm test -- coaching
- npx dotenv -e .env -- npx playwright test tests/e2e/coaching-review-queue-qa.spec.ts --project=chromium --reporter=list
```

## Cross-Phase Security Checklist

Every server action must check:

- Current authenticated user.
- Active mentorship relationship.
- Resource ownership.
- Revoked/removed status.

Never expose:

- API keys.
- Sync API keys.
- Session data.
- Account numbers unless masked.
- Security settings.
- Admin-only notes.

Student controls:

- Accept.
- Decline.
- Revoke.
- See what is shared.

Mentor limits:

- Read-only student trade data.
- Can create feedback.
- Cannot mutate student trade/account/settings.

## Cross-Phase QA Checklist

Test desktop:

- 1440x980.

Test mobile:

- 390x844.

Test roles:

- Mentor.
- Student.
- Admin.
- Random unrelated user.

Test states:

- Pending invite.
- Active mentorship.
- Declined invite.
- Revoked mentorship.
- Removed student.

Test security:

- Mentor cannot view non-student.
- Student cannot view mentor dashboard unless they are also mentor.
- Revoked mentor loses access immediately.
- Feedback cannot be created after revoke.

## Suggested File Naming

Use:

```txt
src/actions/mentorship.ts
src/actions/coaching-dashboard.ts
src/actions/coaching-feedback.ts
src/actions/coaching-review-queue.ts
src/lib/coaching/permissions.ts
src/lib/coaching/risk-score.ts
src/components/coaching/*
tests/e2e/coaching-mode-qa.spec.ts
tests/e2e/coaching-feedback-qa.spec.ts
tests/e2e/coaching-review-queue-qa.spec.ts
```

## Final Recommendation

Build this after Pro Access is stable and preferably after Trade Replay Phase 1 exists.

Why:

- Pro Access gives the business loop.
- Trade Replay gives the review object.
- VIP Coaching Mode gives the community loop.

Together they become hard to copy:

1. User trades.
2. Data syncs.
3. Mistakes are detected.
4. Replay shows what happened.
5. Mentor gives feedback.
6. Student improves.
7. IB/VIP community becomes more valuable.

This is stronger than a normal journal and more aligned with anh's community than a generic SaaS mentor feature.
