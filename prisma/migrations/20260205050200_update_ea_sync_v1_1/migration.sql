/*
  Warnings:

  - You are about to drop the `TradingAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_accountId_fkey";

-- DropForeignKey
ALTER TABLE "TradingAccount" DROP CONSTRAINT "TradingAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "import_history" DROP CONSTRAINT "import_history_account_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_history" DROP CONSTRAINT "sync_history_trading_account_id_fkey";

-- DropTable
DROP TABLE "TradingAccount";

-- CreateTable
CREATE TABLE "trading_accounts" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#00C888',
    "broker" TEXT,
    "server" VARCHAR(100),
    "account_number" VARCHAR(50),
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "platform" TEXT DEFAULT 'MetaTrader 4',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "api_key" VARCHAR(64),
    "api_key_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "last_heartbeat" TIMESTAMP(3),
    "last_sync" TIMESTAMP(3),
    "ea_version" VARCHAR(20),
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "sync_open_trades" BOOLEAN NOT NULL DEFAULT false,
    "equity" DOUBLE PRECISION DEFAULT 0,
    "leverage" VARCHAR(10),
    "account_type" VARCHAR(30) NOT NULL DEFAULT 'PERSONAL',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notify_disconnect" BOOLEAN NOT NULL DEFAULT true,
    "disconnect_threshold_hours" INTEGER NOT NULL DEFAULT 24,
    "api_key_expires_at" TIMESTAMP(3),
    "ip_whitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trading_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_notifications" (
    "id" TEXT NOT NULL,
    "trading_account_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_email" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ea_commands" (
    "id" TEXT NOT NULL,
    "trading_account_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "result" JSONB,
    "error_message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "ip_address" TEXT,

    CONSTRAINT "ea_commands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trading_accounts_api_key_key" ON "trading_accounts"("api_key");

-- CreateIndex
CREATE INDEX "trading_accounts_userId_idx" ON "trading_accounts"("userId");

-- CreateIndex
CREATE INDEX "account_notifications_user_id_is_read_idx" ON "account_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "ea_commands_trading_account_id_status_created_at_idx" ON "ea_commands"("trading_account_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "ea_commands_user_id_created_at_idx" ON "ea_commands"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_notifications" ADD CONSTRAINT "account_notifications_trading_account_id_fkey" FOREIGN KEY ("trading_account_id") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_notifications" ADD CONSTRAINT "account_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ea_commands" ADD CONSTRAINT "ea_commands_trading_account_id_fkey" FOREIGN KEY ("trading_account_id") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ea_commands" ADD CONSTRAINT "ea_commands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_history" ADD CONSTRAINT "import_history_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "trading_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_trading_account_id_fkey" FOREIGN KEY ("trading_account_id") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
