-- CreateEnum
CREATE TYPE "LicenseGitHubSyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "license_github_sync_jobs" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "payload" JSONB,
    "status" "LicenseGitHubSyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "license_github_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "license_github_sync_jobs_eventKey_key" ON "license_github_sync_jobs"("eventKey");

-- CreateIndex
CREATE INDEX "license_github_sync_jobs_status_nextAttemptAt_idx" ON "license_github_sync_jobs"("status", "nextAttemptAt");

