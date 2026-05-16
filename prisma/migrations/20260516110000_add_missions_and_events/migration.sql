-- CreateTable
CREATE TABLE "edge_events" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "sourceType" VARCHAR(80),
    "sourceId" VARCHAR(120),
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edge_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mission_progress" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "missionId" VARCHAR(50) NOT NULL,
    "periodKey" VARCHAR(20) NOT NULL DEFAULT 'lifetime',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 1,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_mission_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "edge_events_userId_eventType_idx" ON "edge_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "edge_events_userId_createdAt_idx" ON "edge_events"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "edge_events_userId_eventType_sourceType_sourceId_key" ON "edge_events"("userId", "eventType", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "user_mission_progress_userId_claimed_idx" ON "user_mission_progress"("userId", "claimed");

-- CreateIndex
CREATE INDEX "user_mission_progress_userId_missionId_periodKey_idx" ON "user_mission_progress"("userId", "missionId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "user_mission_progress_userId_missionId_periodKey_key" ON "user_mission_progress"("userId", "missionId", "periodKey");

-- AddForeignKey
ALTER TABLE "edge_events" ADD CONSTRAINT "edge_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mission_progress" ADD CONSTRAINT "user_mission_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
