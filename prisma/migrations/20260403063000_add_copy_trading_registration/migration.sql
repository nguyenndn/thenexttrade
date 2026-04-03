-- CreateEnum: CopyTradingStatus
CREATE TYPE "CopyTradingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AddEnumValues: NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'COPY_TRADING_REGISTERED';
ALTER TYPE "NotificationType" ADD VALUE 'COPY_TRADING_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'COPY_TRADING_REJECTED';

-- CreateTable: copy_trading_registrations
CREATE TABLE "copy_trading_registrations" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telegramHandle" TEXT,
    "tradingCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "brokerName" TEXT NOT NULL,
    "custom_broker_name" TEXT,
    "mt5_server" TEXT,
    "custom_server" TEXT,
    "mt5_account_number" TEXT NOT NULL,
    "master_password" TEXT,
    "message" TEXT,
    "status" "CopyTradingStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "reject_reason" TEXT,
    "admin_note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "copy_trading_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "copy_trading_registrations_userId_idx" ON "copy_trading_registrations"("userId");
CREATE INDEX "copy_trading_registrations_status_idx" ON "copy_trading_registrations"("status");
CREATE INDEX "copy_trading_registrations_created_at_idx" ON "copy_trading_registrations"("created_at");
CREATE UNIQUE INDEX "copy_trading_registrations_mt5_account_number_brokerName_key" ON "copy_trading_registrations"("mt5_account_number", "brokerName");

-- AddForeignKey
ALTER TABLE "copy_trading_registrations" ADD CONSTRAINT "copy_trading_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
