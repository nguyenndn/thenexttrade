-- CreateEnum
CREATE TYPE "VipRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProStatus" AS ENUM ('NONE', 'GRACE', 'ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProSource" AS ENUM ('IB_VERIFIED', 'MANUAL_ADMIN', 'PROMO', 'INTERNAL');

-- CreateEnum
CREATE TYPE "IbLeadSource" AS ENUM ('TELEGRAM', 'HOMEPAGE', 'BROKER_PAGE', 'ACADEMY', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('NEW_LEAD', 'SIGNED_UP', 'PENDING_VERIFY', 'VERIFIED_INACTIVE', 'CONNECTED_NO_TRADES', 'ACTIVE_TRADER', 'HIGH_VALUE_ACTIVE', 'AT_RISK', 'DORMANT');

-- AlterEnum
ALTER TYPE "CopyTradingStatus" ADD VALUE 'DISCONNECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'VIP_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'VIP_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'FEEDBACK_RECEIVED';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "country" VARCHAR(100),
ADD COLUMN     "main_trading_account_id" TEXT,
ADD COLUMN     "telegram_id" VARCHAR(50);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sync_api_key" VARCHAR(64),
ADD COLUMN     "sync_api_key_created_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "copy_trading_registrations" ADD COLUMN     "disconnect_reason" TEXT,
ADD COLUMN     "disconnected_at" TIMESTAMPTZ,
ADD COLUMN     "partner_code" TEXT,
ADD COLUMN     "phone" VARCHAR(20);

-- AlterTable
ALTER TABLE "ea_brokers" ADD COLUMN     "commission_currency" VARCHAR(10) DEFAULT 'USD',
ADD COLUMN     "commission_per_lot" DOUBLE PRECISION,
ADD COLUMN     "is_vip_eligible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requires_country" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requires_screenshot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_instructions" TEXT;

-- AlterTable
ALTER TABLE "trading_accounts" ADD COLUMN     "app_last_heartbeat" TIMESTAMPTZ,
ADD COLUMN     "resync_request" VARCHAR(20),
ADD COLUMN     "sync_source" VARCHAR(20) NOT NULL DEFAULT 'EA';

-- DropTable
DROP TABLE "Broker";

-- CreateTable
CREATE TABLE "partners" (
    "id" SERIAL NOT NULL,
    "partner_code" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "webhook_url" TEXT,
    "allowed_ips" TEXT,
    "allowed_domains" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_requests" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "tradingAccountId" TEXT,
    "broker" VARCHAR(50) NOT NULL,
    "accountNumber" VARCHAR(50) NOT NULL,
    "balance" VARCHAR(50) NOT NULL,
    "fullName" VARCHAR(100),
    "email" TEXT NOT NULL,
    "country" VARCHAR(100),
    "telegramId" VARCHAR(100) NOT NULL,
    "screenshotUrl" TEXT,
    "status" "VipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vip_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "referrer" TEXT,
    "country" VARCHAR(2),
    "city" TEXT,
    "region" TEXT,
    "device" VARCHAR(10),
    "browser" VARCHAR(30),
    "os" VARCHAR(30),
    "sessionId" VARCHAR(64) NOT NULL,
    "utmSource" VARCHAR(100),
    "utmMedium" VARCHAR(100),
    "utmCampaign" VARCHAR(200),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "data" JSONB,
    "pathname" TEXT,
    "country" VARCHAR(2),
    "sessionId" VARCHAR(64) NOT NULL,
    "userId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "path" VARCHAR(500),
    "detail" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_ips" (
    "id" TEXT NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "reason" TEXT,
    "blockedBy" UUID,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pro_entitlements" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "tradingAccountId" TEXT,
    "status" "ProStatus" NOT NULL DEFAULT 'NONE',
    "source" "ProSource",
    "vipRequestId" TEXT,
    "broker" VARCHAR(50),
    "accountNumber" VARCHAR(50),
    "accountNumberMasked" VARCHAR(50),
    "startsAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "lastReviewedAt" TIMESTAMPTZ,
    "reviewedBy" UUID,
    "adminNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pro_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ib_leads" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "sessionId" VARCHAR(64) NOT NULL,
    "broker" VARCHAR(50) NOT NULL,
    "affiliateUrl" TEXT,
    "source" "IbLeadSource" NOT NULL,
    "utmSource" VARCHAR(100),
    "utmMedium" VARCHAR(100),
    "utmCampaign" VARCHAR(200),
    "clickedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMPTZ,
    "vipRequestId" TEXT,
    "tradingAccountId" TEXT,

    CONSTRAINT "ib_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ib_activity_snapshots" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "tradingAccountId" TEXT,
    "broker" VARCHAR(50),
    "accountNumberMasked" VARCHAR(50),
    "periodStart" TIMESTAMPTZ NOT NULL,
    "periodEnd" TIMESTAMPTZ NOT NULL,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "closedLotVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTradeAt" TIMESTAMPTZ,
    "lastHeartbeatAt" TIMESTAMPTZ,
    "estimatedIbRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activityStatus" "ActivityStatus" NOT NULL DEFAULT 'SIGNED_UP',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ib_activity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_partner_code_key" ON "partners"("partner_code");

-- CreateIndex
CREATE INDEX "vip_requests_userId_idx" ON "vip_requests"("userId");

-- CreateIndex
CREATE INDEX "vip_requests_status_idx" ON "vip_requests"("status");

-- CreateIndex
CREATE INDEX "vip_requests_tradingAccountId_idx" ON "vip_requests"("tradingAccountId");

-- CreateIndex
CREATE INDEX "vip_requests_createdAt_idx" ON "vip_requests"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_pathname_idx" ON "page_views"("pathname");

-- CreateIndex
CREATE INDEX "page_views_country_idx" ON "page_views"("country");

-- CreateIndex
CREATE INDEX "page_views_sessionId_idx" ON "page_views"("sessionId");

-- CreateIndex
CREATE INDEX "page_views_utmCampaign_idx" ON "page_views"("utmCampaign");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_name_idx" ON "analytics_events"("name");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "security_logs_type_idx" ON "security_logs"("type");

-- CreateIndex
CREATE INDEX "security_logs_ip_idx" ON "security_logs"("ip");

-- CreateIndex
CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_ips_ip_key" ON "blocked_ips"("ip");

-- CreateIndex
CREATE INDEX "blocked_ips_ip_idx" ON "blocked_ips"("ip");

-- CreateIndex
CREATE INDEX "blocked_ips_expiresAt_idx" ON "blocked_ips"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "pro_entitlements_tradingAccountId_key" ON "pro_entitlements"("tradingAccountId");

-- CreateIndex
CREATE INDEX "pro_entitlements_userId_status_idx" ON "pro_entitlements"("userId", "status");

-- CreateIndex
CREATE INDEX "pro_entitlements_tradingAccountId_status_idx" ON "pro_entitlements"("tradingAccountId", "status");

-- CreateIndex
CREATE INDEX "pro_entitlements_status_idx" ON "pro_entitlements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pro_entitlements_userId_tradingAccountId_key" ON "pro_entitlements"("userId", "tradingAccountId");

-- CreateIndex
CREATE INDEX "ib_leads_userId_idx" ON "ib_leads"("userId");

-- CreateIndex
CREATE INDEX "ib_leads_broker_idx" ON "ib_leads"("broker");

-- CreateIndex
CREATE INDEX "ib_leads_clickedAt_idx" ON "ib_leads"("clickedAt");

-- CreateIndex
CREATE INDEX "ib_leads_tradingAccountId_idx" ON "ib_leads"("tradingAccountId");

-- CreateIndex
CREATE INDEX "ib_activity_snapshots_userId_idx" ON "ib_activity_snapshots"("userId");

-- CreateIndex
CREATE INDEX "ib_activity_snapshots_activityStatus_idx" ON "ib_activity_snapshots"("activityStatus");

-- CreateIndex
CREATE INDEX "ib_activity_snapshots_periodEnd_idx" ON "ib_activity_snapshots"("periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "ib_activity_snapshots_userId_periodStart_periodEnd_key" ON "ib_activity_snapshots"("userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "User_sync_api_key_key" ON "User"("sync_api_key");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_main_trading_account_id_fkey" FOREIGN KEY ("main_trading_account_id") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_trading_registrations" ADD CONSTRAINT "copy_trading_registrations_partner_code_fkey" FOREIGN KEY ("partner_code") REFERENCES "partners"("partner_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_requests" ADD CONSTRAINT "vip_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_requests" ADD CONSTRAINT "vip_requests_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_entitlements" ADD CONSTRAINT "pro_entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_entitlements" ADD CONSTRAINT "pro_entitlements_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ib_leads" ADD CONSTRAINT "ib_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ib_leads" ADD CONSTRAINT "ib_leads_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ib_activity_snapshots" ADD CONSTRAINT "ib_activity_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

