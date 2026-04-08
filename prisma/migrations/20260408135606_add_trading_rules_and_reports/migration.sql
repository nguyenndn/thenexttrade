/*
  Warnings:

  - The values [FAQ,LISTICLE] on the enum `ArticleSchemaType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `updatedAt` on the `Challenge` table. All the data in the column will be lost.
  - You are about to alter the column `profile_headline` on the `Profile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(160)`.
  - Made the column `endDate` on table `Challenge` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startDate` on table `Challenge` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Challenge` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_public_profile` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `show_badges` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `show_pair_stats` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `show_session_stats` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `show_trade_score` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Quote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ToolView` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterEnum
BEGIN;
CREATE TYPE "ArticleSchemaType_new" AS ENUM ('ARTICLE', 'HOWTO');
ALTER TABLE "Article" ALTER COLUMN "schemaType" DROP DEFAULT;
ALTER TABLE "Article" ALTER COLUMN "schemaType" TYPE "ArticleSchemaType_new" USING ("schemaType"::text::"ArticleSchemaType_new");
ALTER TYPE "ArticleSchemaType" RENAME TO "ArticleSchemaType_old";
ALTER TYPE "ArticleSchemaType_new" RENAME TO "ArticleSchemaType";
DROP TYPE "ArticleSchemaType_old";
ALTER TABLE "Article" ALTER COLUMN "schemaType" SET DEFAULT 'ARTICLE';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'WEEKLY_REPORT';
ALTER TYPE "NotificationType" ADD VALUE 'MONTHLY_REPORT';
ALTER TYPE "NotificationType" ADD VALUE 'NO_TRADES_NUDGE';

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_userId_fkey";

-- DropIndex
DROP INDEX "ToolView_viewCount_idx";

-- DropIndex
DROP INDEX "User_streak_idx";

-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "updatedAt",
ALTER COLUMN "endDate" SET NOT NULL,
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'xp';

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "is_public_profile" SET NOT NULL,
ALTER COLUMN "profile_headline" SET DATA TYPE VARCHAR(160),
ALTER COLUMN "show_badges" SET NOT NULL,
ALTER COLUMN "show_pair_stats" SET NOT NULL,
ALTER COLUMN "show_session_stats" SET NOT NULL,
ALTER COLUMN "show_trade_score" SET NOT NULL,
ALTER COLUMN "show_trade_score" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ToolView" ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "trading_accounts" ADD COLUMN     "cooldown_after_losses" INTEGER,
ADD COLUMN     "max_daily_loss" DOUBLE PRECISION,
ADD COLUMN     "max_daily_trades" INTEGER,
ADD COLUMN     "max_risk_percent" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "trading_reports" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ReportType" NOT NULL,
    "periodStart" TIMESTAMPTZ NOT NULL,
    "periodEnd" TIMESTAMPTZ NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPnL" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "largestWin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "largestLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prevPnL" DOUBLE PRECISION,
    "prevWinRate" DOUBLE PRECISION,
    "prevTrades" INTEGER,
    "bySymbol" JSONB,
    "byStrategy" JSONB,
    "bySession" JSONB,
    "byDay" JSONB,
    "avgConfidence" DOUBLE PRECISION,
    "planCompliance" DOUBLE PRECISION,
    "topEmotions" JSONB,
    "topMistakes" JSONB,
    "bestTrades" JSONB,
    "worstTrades" JSONB,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trading_reports_userId_type_idx" ON "trading_reports"("userId", "type");

-- CreateIndex
CREATE INDEX "trading_reports_createdAt_idx" ON "trading_reports"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "trading_reports_userId_type_periodStart_key" ON "trading_reports"("userId", "type", "periodStart");

-- CreateIndex
CREATE INDEX "ToolView_viewCount_idx" ON "ToolView"("viewCount" DESC);

-- CreateIndex
CREATE INDEX "User_streak_idx" ON "User"("streak" DESC);

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_reports" ADD CONSTRAINT "trading_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
