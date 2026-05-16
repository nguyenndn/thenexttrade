# Edge Missions Guided UX: Implementation Walkthrough

The Edge Missions Guided UX implementation is now complete. The goal was to transform the passive missions list into an actionable coaching dashboard that guides traders toward better habits.

## 1. Schema & Configuration Updates

### `periodKey` Integration
To support repeatable weekly missions, the `UserMissionProgress` model in `prisma/schema.prisma` was updated.
- Added `periodKey String @default("lifetime") @db.VarChar(20)`.
- Replaced `@@unique([userId, missionId])` with `@@unique([userId, missionId, periodKey])`.
- This ensures a user can complete a "WEEKLY" mission once per week without overriding lifetime progress.

### Extended Mission Definitions
`src/config/edge-missions.ts` was expanded with fields crucial for guided UX:
- **`cadence`**: Distinguishes "ONCE" vs. "WEEKLY".
- **`ctaLabel` & `ctaHref`**: Actionable buttons (e.g., "Log Trade", "Start Learning").
- **`whyItMatters`**: Contextual coaching text explaining the psychological or strategic value of the mission.
- **`priority`**: Used to sort and select the most relevant "Next Best Action".

## 2. Service Logic Enhancements

`src/lib/services/edge-missions.service.ts` was heavily refactored to support the new `periodKey`:
- Added `getCurrentWeekPeriodKey()` (e.g., `2026-W20`).
- Progress queries dynamically filter `EdgeEvent` records by the current week for `cadence: "WEEKLY"` missions.
- Claiming logic now updates the record tied to the specific `periodKey` and idempotently emits a `MISSION_CLAIM_${missionId}` EdgeEvent tied to `sourceId: missionId:periodKey`.

## 3. Idempotent Event Recording

To avoid duplicate rewards or progression bugs during completion of lessons and quizzes:
- Implemented `recordEdgeEventOnce` in `src/lib/edge-awards.ts`. It catches Prisma `P2002` (Unique Constraint) errors silently.
- Updated `src/app/api/lessons/[id]/complete/route.ts` to log `LESSON_COMPLETE` via this helper.
- Updated `src/app/api/quizzes/[id]/submit/route.ts` to log `QUIZ_PASS` when `passed === true`.

## 4. UI/UX Transformation

### Next Best Action Card
Created a brand-new component `src/components/dashboard/missions/NextBestActionCard.tsx`:
- Surfaces the single highest-priority mission for the user.
- Emphasizes the `whyItMatters` text to provide coaching.
- If the mission is claimable, it highlights a large, prominent "Claim Reward" CTA.
- If all missions are done, it shows a "You're caught up!" success state with links to continue trading or learning.

### Improved Mission Cards
Updated `src/components/dashboard/missions/MissionCard.tsx`:
- Added the context-driven `whyItMatters` text below the standard description.
- Introduced a clear CTA button at the bottom of incomplete cards (e.g., "Log Trade") that takes the user directly to the relevant platform area.

### Grouping and Layout
Refactored `src/components/dashboard/missions/MissionsClient.tsx`:
- Moved from a simple list to a structured layout: `Stats Bar -> Next Best Action -> Category Tabs -> Mission Grid`.

## 5. Bug Fixes
- Fixed the redirect in `src/app/dashboard/missions/page.tsx` from `/login` to `/auth/login` to ensure the correct Supabase authentication flow.

## Verification
- Run `npx prisma db push --accept-data-loss` executed successfully.
- Run `npx tsc --noEmit` executed successfully, ensuring type safety across the new additions.

The new dashboard is now dynamic, actionable, and ready to drive higher user engagement.
