-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "share_description" TEXT,
ADD COLUMN     "share_mode" TEXT DEFAULT 'full',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "JournalEntry_userId_exitDate_idx" ON "JournalEntry"("userId", "exitDate");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_accountId_exitDate_idx" ON "JournalEntry"("userId", "accountId", "exitDate");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_symbol_idx" ON "JournalEntry"("userId", "symbol");

-- CreateIndex
CREATE INDEX "User_xp_idx" ON "User"("xp" DESC);
