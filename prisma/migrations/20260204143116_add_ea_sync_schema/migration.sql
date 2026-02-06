/*
  Warnings:

  - A unique constraint covering the columns `[accountId,external_ticket]` on the table `JournalEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,accountId,external_ticket]` on the table `JournalEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[api_key]` on the table `TradingAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "commission" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "external_hash" VARCHAR(64),
ADD COLUMN     "external_ticket" VARCHAR(100),
ADD COLUMN     "import_id" UUID,
ADD COLUMN     "swap" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "sync_source" VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "synced_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TradingAccount" ADD COLUMN     "api_key" VARCHAR(64),
ADD COLUMN     "api_key_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "auto_sync" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ea_version" VARCHAR(20),
ADD COLUMN     "last_heartbeat" TIMESTAMP(3),
ADD COLUMN     "last_sync" TIMESTAMP(3),
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "sync_open_trades" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "total_trades" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "import_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" TEXT,
    "source" VARCHAR(50) NOT NULL,
    "filename" VARCHAR(255),
    "file_size" INTEGER,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_history" (
    "id" UUID NOT NULL,
    "trading_account_id" TEXT NOT NULL,
    "trades_received" INTEGER NOT NULL DEFAULT 0,
    "trades_imported" INTEGER NOT NULL DEFAULT 0,
    "trades_skipped" INTEGER NOT NULL DEFAULT 0,
    "ea_version" VARCHAR(20),
    "client_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_history_user_id_idx" ON "import_history"("user_id");

-- CreateIndex
CREATE INDEX "sync_history_trading_account_id_idx" ON "sync_history"("trading_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_accountId_external_ticket_key" ON "JournalEntry"("accountId", "external_ticket");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_userId_accountId_external_ticket_key" ON "JournalEntry"("userId", "accountId", "external_ticket");

-- CreateIndex
CREATE UNIQUE INDEX "TradingAccount_api_key_key" ON "TradingAccount"("api_key");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "import_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_history" ADD CONSTRAINT "import_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_history" ADD CONSTRAINT "import_history_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "TradingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_trading_account_id_fkey" FOREIGN KEY ("trading_account_id") REFERENCES "TradingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
