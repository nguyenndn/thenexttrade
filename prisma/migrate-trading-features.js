/**
 * Safe Production Migration — Trading Rules + Reports
 * Only ADDs new columns and tables. Does NOT modify existing data.
 * 
 * Usage: node prisma/migrate-trading-features.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Resolve Production DB URL
let supabaseUrl = process.env.SUPABASE_DATABASE_URL;
let supabaseDirectUrl = null;

if (!supabaseUrl) {
  try {
    const envProd = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf-8');
    const directMatch = envProd.match(/DIRECT_URL="([^"]+)"/);
    if (directMatch) supabaseDirectUrl = directMatch[1];
    const dbMatch = envProd.match(/DATABASE_URL="([^"]+)"/);
    if (dbMatch) supabaseUrl = dbMatch[1];
    if (!supabaseUrl) supabaseUrl = supabaseDirectUrl;
    if (supabaseDirectUrl) supabaseUrl = supabaseDirectUrl;
  } catch (e) {}
}

if (!supabaseUrl) {
  console.error('❌ Cannot find Supabase DATABASE_URL.');
  console.error('Set SUPABASE_DATABASE_URL in .env.local or .env.production');
  process.exit(1);
}

console.log(`📡 Production DB: ${supabaseUrl.replace(/:[^:@]+@/, ':***@')}\n`);

// Safe SQL — only ADD operations, no DROP/ALTER NOT NULL
const safeSql = `
-- ============================================================================
-- SAFE MIGRATION: Trading Rules + Performance Reports
-- Only ADD columns and CREATE new table/enum. No destructive changes.
-- ============================================================================

-- 1. Add ReportType enum (if not exists)
DO $$ BEGIN
  CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Add NotificationType enum values (if not exists)
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WEEKLY_REPORT';
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MONTHLY_REPORT';
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NO_TRADES_NUDGE';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Add Trading Rules columns to trading_accounts (nullable = safe)
ALTER TABLE "trading_accounts" ADD COLUMN IF NOT EXISTS "max_daily_loss" DOUBLE PRECISION;
ALTER TABLE "trading_accounts" ADD COLUMN IF NOT EXISTS "max_daily_trades" INTEGER;
ALTER TABLE "trading_accounts" ADD COLUMN IF NOT EXISTS "max_risk_percent" DOUBLE PRECISION;
ALTER TABLE "trading_accounts" ADD COLUMN IF NOT EXISTS "cooldown_after_losses" INTEGER;

-- 4. Create trading_reports table (if not exists)
CREATE TABLE IF NOT EXISTS "trading_reports" (
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

-- 5. Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS "trading_reports_userId_type_idx" ON "trading_reports"("userId", "type");
CREATE INDEX IF NOT EXISTS "trading_reports_createdAt_idx" ON "trading_reports"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "trading_reports_userId_type_periodStart_key" ON "trading_reports"("userId", "type", "periodStart");

-- 6. Add foreign key (if not exists)
DO $$ BEGIN
  ALTER TABLE "trading_reports" ADD CONSTRAINT "trading_reports_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ✅ Done! No data was modified or deleted.
`;

// Write temp SQL file
const tmpSqlPath = path.join(__dirname, '_safe_migration.sql');
fs.writeFileSync(tmpSqlPath, safeSql);

console.log('🔒 Running SAFE migration (ADD only, no destructive changes)...\n');
console.log('📋 Changes:');
console.log('   • CREATE ENUM "ReportType" (WEEKLY, MONTHLY)');
console.log('   • ADD enum values to "NotificationType"');
console.log('   • ADD 4 columns to "trading_accounts" (nullable)');
console.log('   • CREATE TABLE "trading_reports"');
console.log('   • CREATE indexes + foreign key\n');

try {
  // Use psql or prisma db execute
  execSync(`npx prisma db execute --file "${tmpSqlPath}"`, {
    env: { ...process.env, DATABASE_URL: supabaseUrl, DIRECT_URL: supabaseDirectUrl || supabaseUrl },
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  console.log('\n✅ Production migration completed successfully!');
  console.log('   No existing data was modified or deleted.');
} catch (e) {
  console.error('\n❌ Migration failed:', e.message);
  process.exit(1);
} finally {
  // Cleanup temp file
  try { fs.unlinkSync(tmpSqlPath); } catch (e) {}
}

// Mark the prisma migration as applied so future deploys don't try to run it again
console.log('\n🏷️  Marking migration as applied in Prisma...');
try {
  execSync('npx prisma migrate resolve --applied 20260408135606_add_trading_rules_and_reports', {
    env: { ...process.env, DATABASE_URL: supabaseUrl, DIRECT_URL: supabaseDirectUrl || supabaseUrl },
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  console.log('✅ Migration marked as applied.');
} catch (e) {
  console.log('⚠️  Could not mark migration (may need manual resolve):', e.message);
}
