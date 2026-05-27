-- CreateTable
CREATE TABLE "trader_signals" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "signalType" VARCHAR(80) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "sourceType" VARCHAR(80),
    "sourceId" VARCHAR(120),
    "title" VARCHAR(160) NOT NULL,
    "summary" TEXT NOT NULL,
    "actionLabel" VARCHAR(80),
    "actionHref" TEXT,
    "metadata" JSONB,
    "firstSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(6),

    CONSTRAINT "trader_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_action_plans" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "periodStart" TIMESTAMPTZ(6),
    "periodEnd" TIMESTAMPTZ(6),
    "type" VARCHAR(30) NOT NULL DEFAULT 'WEEKLY',
    "title" VARCHAR(160) NOT NULL,
    "summary" TEXT NOT NULL,
    "keepDoing" TEXT,
    "fixNext" TEXT,
    "nextActions" JSONB NOT NULL,
    "lessonSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "coach_action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trader_signals_userId_signalType_sourceType_sourceId_key" ON "trader_signals"("userId", "signalType", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "trader_signals_userId_status_severity_idx" ON "trader_signals"("userId", "status", "severity");

-- CreateIndex
CREATE INDEX "trader_signals_signalType_status_idx" ON "trader_signals"("signalType", "status");

-- CreateIndex
CREATE INDEX "coach_action_plans_userId_status_idx" ON "coach_action_plans"("userId", "status");

-- CreateIndex
CREATE INDEX "coach_action_plans_userId_type_createdAt_idx" ON "coach_action_plans"("userId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "trader_signals" ADD CONSTRAINT "trader_signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_action_plans" ADD CONSTRAINT "coach_action_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
