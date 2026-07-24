ALTER TABLE "EconomicEvent"
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'forexfactory',
  ADD COLUMN "sourceName" TEXT NOT NULL DEFAULT 'Forex Factory Calendar',
  ADD COLUMN "sourceUrl" TEXT NOT NULL DEFAULT 'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "eventStatus" TEXT NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN "isFallback" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lastSyncedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "EconomicEvent_date_impact_idx" ON "EconomicEvent"("date", "impact");
