import { prisma } from "@/lib/prisma";

// ============================================================================
// IB BROKER CSV IMPORT SERVICE
// ============================================================================

export interface CsvRow {
  accountNumber: string;
  broker?: string;
  lots: number;
  commission: number;
  trades: number;
  period?: string;
}

export interface ImportResult {
  totalRows: number;
  matched: number;
  unmatched: number;
  duplicates: number;
  errors: string[];
  matchedRows: Array<{
    accountNumber: string;
    userId: string;
    userName: string;
    lots: number;
    commission: number;
  }>;
  unmatchedRows: Array<{
    accountNumber: string;
    lots: number;
    commission: number;
    reason: string;
  }>;
}

/**
 * Parse a CSV string into structured rows.
 * Expected columns: account_number, broker (optional), lots, commission, trades, period (optional)
 */
export function parseBrokerCsv(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const accountCol = headers.findIndex((h) =>
    ["account", "account_number", "accountnumber", "account_no"].includes(h)
  );
  const lotsCol = headers.findIndex((h) => ["lots", "volume", "lot_volume"].includes(h));
  const commissionCol = headers.findIndex((h) => ["commission", "comm", "ib_commission"].includes(h));
  const tradesCol = headers.findIndex((h) => ["trades", "trade_count", "num_trades"].includes(h));
  const brokerCol = headers.findIndex((h) => ["broker", "broker_name"].includes(h));
  const periodCol = headers.findIndex((h) => ["period", "month", "date_range"].includes(h));

  if (accountCol === -1 || (lotsCol === -1 && commissionCol === -1)) {
    return [];
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (!cols[accountCol]) continue;

    rows.push({
      accountNumber: cols[accountCol],
      broker: brokerCol >= 0 ? cols[brokerCol] : undefined,
      lots: lotsCol >= 0 ? parseFloat(cols[lotsCol]) || 0 : 0,
      commission: commissionCol >= 0 ? parseFloat(cols[commissionCol]) || 0 : 0,
      trades: tradesCol >= 0 ? parseInt(cols[tradesCol]) || 0 : 0,
      period: periodCol >= 0 ? cols[periodCol] : undefined,
    });
  }

  return rows;
}

/**
 * Preview CSV import — match accounts to users without writing.
 */
export async function previewCsvImport(rows: CsvRow[]): Promise<ImportResult> {
  const result: ImportResult = {
    totalRows: rows.length,
    matched: 0,
    unmatched: 0,
    duplicates: 0,
    errors: [],
    matchedRows: [],
    unmatchedRows: [],
  };

  // Batch fetch all account numbers
  const accountNumbers = rows.map((r) => r.accountNumber);
  const accounts = await prisma.tradingAccount.findMany({
    where: {
      accountNumber: { in: accountNumbers },
    },
    select: {
      accountNumber: true,
      userId: true,
      user: { select: { name: true, email: true } },
    },
  });

  // Also check VipRequest account numbers
  const vipRequests = await prisma.vipRequest.findMany({
    where: {
      accountNumber: { in: accountNumbers },
      status: "APPROVED",
    },
    select: {
      accountNumber: true,
      userId: true,
      user: { select: { name: true, email: true } },
    },
  });

  // Build lookup
  const accountMap = new Map<string, { userId: string; userName: string }>();
  for (const acc of accounts) {
    if (acc.accountNumber) {
      accountMap.set(acc.accountNumber, {
        userId: acc.userId,
        userName: acc.user.name || acc.user.email || "Unknown",
      });
    }
  }
  for (const vr of vipRequests) {
    if (!accountMap.has(vr.accountNumber)) {
      accountMap.set(vr.accountNumber, {
        userId: vr.userId,
        userName: vr.user.name || vr.user.email || "Unknown",
      });
    }
  }

  // Match rows
  for (const row of rows) {
    const match = accountMap.get(row.accountNumber);
    if (match) {
      result.matched++;
      result.matchedRows.push({
        accountNumber: row.accountNumber,
        userId: match.userId,
        userName: match.userName,
        lots: row.lots,
        commission: row.commission,
      });
    } else {
      result.unmatched++;
      result.unmatchedRows.push({
        accountNumber: row.accountNumber,
        lots: row.lots,
        commission: row.commission,
        reason: "No matching trading account or VIP request found",
      });
    }
  }

  return result;
}

/**
 * Execute CSV import — write matched data to IbActivitySnapshot.
 */
export async function executeCsvImport(
  rows: CsvRow[],
  importerId: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const preview = await previewCsvImport(rows);
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const match of preview.matchedRows) {
    try {
      // Check for duplicate
      const existing = await prisma.ibActivitySnapshot.findFirst({
        where: {
          userId: match.userId,
          periodStart,
          periodEnd,
        },
      });

      if (existing) {
        // Update with exact data instead of estimated
        await prisma.ibActivitySnapshot.update({
          where: { id: existing.id },
          data: {
            closedLotVolume: match.lots,
            estimatedIbRevenue: match.commission,
          },
        });
        imported++;
      } else {
        await prisma.ibActivitySnapshot.create({
          data: {
            userId: match.userId,
            accountNumberMasked: "****" + match.accountNumber.slice(-4),
            periodStart,
            periodEnd,
            closedLotVolume: match.lots,
            estimatedIbRevenue: match.commission,
            activityStatus: match.lots > 0 ? "ACTIVE_TRADER" : "CONNECTED_NO_TRADES",
          },
        });
        imported++;
      }
    } catch (err: any) {
      errors.push(`Account ${match.accountNumber}: ${err.message}`);
      skipped++;
    }
  }

  return { imported, skipped: skipped + preview.unmatched, errors };
}
