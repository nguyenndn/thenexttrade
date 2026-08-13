-- AlterTable Notification: Add dedupe_key, metadata, expires_at
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "dedupe_key" VARCHAR(180);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ(6);

-- Create unique index for Notification deduplication
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_notification_dedupe" ON "Notification"("userId", "dedupe_key") WHERE "dedupe_key" IS NOT NULL;

-- CreateTable trader_insight_snapshots
CREATE TABLE IF NOT EXISTS "trader_insight_snapshots" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" TEXT,
    "insightType" VARCHAR(80) NOT NULL,
    "fingerprint" VARCHAR(160) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "confidence" VARCHAR(20) NOT NULL,
    "periodStart" TIMESTAMPTZ(6) NOT NULL,
    "periodEnd" TIMESTAMPTZ(6) NOT NULL,
    "sourceLastSyncAt" TIMESTAMPTZ(6),
    "engineVersion" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "viewedAt" TIMESTAMPTZ(6),
    "dismissedAt" TIMESTAMPTZ(6),
    "supersededAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trader_insight_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable improvement_experiments
CREATE TABLE IF NOT EXISTS "improvement_experiments" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" TEXT,
    "sourceInsightId" TEXT,
    "coachActionPlanId" TEXT,
    "coachPlanItemId" TEXT,
    "actionType" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "primaryMetric" VARCHAR(60) NOT NULL,
    "targetTradeCount" INTEGER NOT NULL DEFAULT 10,
    "baseline" JSONB NOT NULL,
    "followUp" JSONB,
    "result" JSONB,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "outcome" VARCHAR(30),
    "acceptedAt" TIMESTAMPTZ(6),
    "reviewReadyAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "improvement_experiments_pkey" PRIMARY KEY ("id")
);

-- Unique constraint for trader_insight_snapshots
CREATE UNIQUE INDEX IF NOT EXISTS "trader_insight_snapshots_userId_fingerprint_engineVersion_key" ON "trader_insight_snapshots"("userId", "fingerprint", "engineVersion");

-- Indexes for trader_insight_snapshots
CREATE INDEX IF NOT EXISTS "trader_insight_snapshots_userId_status_createdAt_idx" ON "trader_insight_snapshots"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "trader_insight_snapshots_userId_accountId_insightType_idx" ON "trader_insight_snapshots"("userId", "accountId", "insightType");

-- Indexes for improvement_experiments
CREATE INDEX IF NOT EXISTS "improvement_experiments_userId_status_createdAt_idx" ON "improvement_experiments"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "improvement_experiments_userId_accountId_acceptedAt_idx" ON "improvement_experiments"("userId", "accountId", "acceptedAt");
CREATE INDEX IF NOT EXISTS "improvement_experiments_sourceInsightId_idx" ON "improvement_experiments"("sourceInsightId");

-- Database-enforced partial unique index: At most ONE active or review-ready experiment per user and account scope
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_experiment_per_user_account" ON "improvement_experiments"("userId", COALESCE("accountId", '00000000-0000-0000-0000-000000000000')) WHERE "status" IN ('ACTIVE', 'READY_FOR_REVIEW');

-- Add Foreign Keys (idempotent)
ALTER TABLE "trader_insight_snapshots" DROP CONSTRAINT IF EXISTS "trader_insight_snapshots_userId_fkey";
ALTER TABLE "trader_insight_snapshots" ADD CONSTRAINT "trader_insight_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trader_insight_snapshots" DROP CONSTRAINT IF EXISTS "trader_insight_snapshots_accountId_fkey";
ALTER TABLE "trader_insight_snapshots" ADD CONSTRAINT "trader_insight_snapshots_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "improvement_experiments" DROP CONSTRAINT IF EXISTS "improvement_experiments_userId_fkey";
ALTER TABLE "improvement_experiments" ADD CONSTRAINT "improvement_experiments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "improvement_experiments" DROP CONSTRAINT IF EXISTS "improvement_experiments_accountId_fkey";
ALTER TABLE "improvement_experiments" ADD CONSTRAINT "improvement_experiments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "improvement_experiments" DROP CONSTRAINT IF EXISTS "improvement_experiments_sourceInsightId_fkey";
ALTER TABLE "improvement_experiments" ADD CONSTRAINT "improvement_experiments_sourceInsightId_fkey" FOREIGN KEY ("sourceInsightId") REFERENCES "trader_insight_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
