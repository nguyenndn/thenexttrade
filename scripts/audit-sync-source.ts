import { prisma } from "../src/lib/prisma";
import { normalizeSyncSource, getSyncSourceLabel } from "../src/lib/sync/sync-source";

async function run() {
  const writeMode = process.argv.includes("--write");
  console.log(`Starting syncSource audit${writeMode ? " (WRITE MODE ENABLED)" : ""}`);
  console.log("-----------------------------------------");

  // Audit TradingAccount table
  console.log("\nAuditing TradingAccount syncSource values...");
  const accounts = await prisma.tradingAccount.findMany({
    select: {
      id: true,
      name: true,
      syncSource: true,
      lastSync: true,
      lastHeartbeat: true,
    },
  });

  const accountCounts: Record<string, number> = {};
  let accountsToUpdate = 0;
  let unknownWithSyncData = 0;

  for (const acc of accounts) {
    const raw = acc.syncSource || "NULL";
    accountCounts[raw] = (accountCounts[raw] || 0) + 1;

    const normalized = normalizeSyncSource(acc.syncSource);
    const needsUpdate = acc.syncSource !== normalized;

    if (needsUpdate) {
      accountsToUpdate++;
      if (writeMode) {
        await prisma.tradingAccount.update({
          where: { id: acc.id },
          data: { syncSource: normalized },
        });
      }
    }

    if (normalized === "UNKNOWN" && (acc.lastSync !== null || acc.lastHeartbeat !== null)) {
      unknownWithSyncData++;
      console.warn(`[WARNING] Account "${acc.name}" (${acc.id}) has sync data but raw syncSource is "${acc.syncSource}" (maps to UNKNOWN).`);
    }
  }

  console.log("Counts per raw syncSource in TradingAccount:");
  for (const [source, count] of Object.entries(accountCounts)) {
    const normalized = normalizeSyncSource(source === "NULL" ? null : source);
    console.log(`  - ${source}: ${count} -> ${normalized} (${getSyncSourceLabel(normalized)})`);
  }

  // Audit JournalEntry table
  console.log("\nAuditing JournalEntry syncSource values...");
  const journalEntries = await prisma.journalEntry.findMany({
    select: {
      id: true,
      syncSource: true,
      syncedAt: true,
    },
  });

  const journalCounts: Record<string, number> = {};
  let journalsToUpdate = 0;
  let unknownJournalWithSyncData = 0;

  for (const entry of journalEntries) {
    const raw = entry.syncSource || "NULL";
    journalCounts[raw] = (journalCounts[raw] || 0) + 1;

    const normalized = normalizeSyncSource(entry.syncSource);
    const needsUpdate = entry.syncSource !== normalized;

    if (needsUpdate) {
      journalsToUpdate++;
      if (writeMode) {
        await prisma.journalEntry.update({
          where: { id: entry.id },
          data: { syncSource: normalized },
        });
      }
    }

    if (normalized === "UNKNOWN" && entry.syncedAt !== null) {
      unknownJournalWithSyncData++;
    }
  }

  console.log("Counts per raw syncSource in JournalEntry:");
  for (const [source, count] of Object.entries(journalCounts)) {
    const normalized = normalizeSyncSource(source === "NULL" ? null : source);
    console.log(`  - ${source}: ${count} -> ${normalized} (${getSyncSourceLabel(normalized)})`);
  }

  console.log("\n-----------------------------------------");
  console.log(`TradingAccounts needing update: ${accountsToUpdate}`);
  console.log(`JournalEntries needing update: ${journalsToUpdate}`);
  console.log(`UNKNOWN with sync data (accounts): ${unknownWithSyncData}`);
  console.log(`UNKNOWN with sync data (journal): ${unknownJournalWithSyncData}`);

  if (writeMode) {
    console.log("Backfill database update complete.");
  } else {
    console.log("Run with --write to perform database backfill updates.");
  }

  if (unknownWithSyncData > 0 || unknownJournalWithSyncData > 0) {
    console.error("\n[ERROR] Recognized sync evidence on accounts or journal entries with UNKNOWN mapping.");
    process.exit(1);
  } else {
    console.log("\nAudit passed successfully.");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Fatal error during audit script:", err);
  process.exit(1);
});
