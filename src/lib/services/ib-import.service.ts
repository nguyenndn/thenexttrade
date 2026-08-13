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

    const headers = lines[0]
        .toLowerCase()
        .split(",")
        .map((h) => h.trim());
    const accountCol = headers.findIndex((h) =>
        ["account", "account_number", "accountnumber", "account_no"].includes(h)
    );
    const lotsCol = headers.findIndex((h) =>
        ["lots", "volume", "lot_volume"].includes(h)
    );
    const commissionCol = headers.findIndex((h) =>
        ["commission", "comm", "ib_commission"].includes(h)
    );
    const tradesCol = headers.findIndex((h) =>
        ["trades", "trade_count", "num_trades"].includes(h)
    );
    const brokerCol = headers.findIndex((h) =>
        ["broker", "broker_name"].includes(h)
    );
    const periodCol = headers.findIndex((h) =>
        ["period", "month", "date_range"].includes(h)
    );

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
            commission:
                commissionCol >= 0 ? parseFloat(cols[commissionCol]) || 0 : 0,
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
            broker: true,
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
            broker: true,
            userId: true,
            user: { select: { name: true, email: true } },
        },
    });

    // Build lookup. Matching is broker-aware: two users can share the same
    // account number at different brokers, so when a row carries a broker we
    // prefer the `${broker}|${accountNumber}` exact key and only fall back to
    // a bare accountNumber when the row (or the account) has no broker.
    type AccountMatch = { userId: string; userName: string };
    const exactMap = new Map<string, AccountMatch>();
    const fallbackMap = new Map<string, AccountMatch>();

    const index = (
        broker: string | null | undefined,
        accountNumber: string,
        value: AccountMatch
    ) => {
        if (broker) {
            const key = `${broker.toUpperCase()}|${accountNumber}`;
            if (!exactMap.has(key)) exactMap.set(key, value);
        }
        if (!fallbackMap.has(accountNumber)) {
            fallbackMap.set(accountNumber, value);
        }
    };

    for (const acc of accounts) {
        if (acc.accountNumber) {
            index(acc.broker, acc.accountNumber, {
                userId: acc.userId,
                userName: acc.user.name || acc.user.email || "Unknown",
            });
        }
    }
    for (const vr of vipRequests) {
        if (vr.accountNumber) {
            index(vr.broker, vr.accountNumber, {
                userId: vr.userId,
                userName: vr.user.name || vr.user.email || "Unknown",
            });
        }
    }

    // Match rows
    for (const row of rows) {
        let match: AccountMatch | undefined;
        if (row.broker?.trim()) {
            match =
                exactMap.get(
                    `${row.broker.trim().toUpperCase()}|${row.accountNumber}`
                ) ||
                exactMap.get(`|${row.accountNumber}`);
        }
        if (!match) match = fallbackMap.get(row.accountNumber);
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
    const periodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );

    // Aggregate matched rows by userId. The snapshot unique key is
    // (userId, periodStart, periodEnd) with NO account dimension, so a
    // multi-account user's rows must SUM into a single snapshot. The old
    // code upserted per row and silently clobbered the first account's
    // numbers with the last one.
    const byUser = new Map<
        string,
        { lots: number; commission: number; accountNumber: string }
    >();
    for (const match of preview.matchedRows) {
        const agg = byUser.get(match.userId);
        if (agg) {
            agg.lots += match.lots;
            agg.commission += match.commission;
        } else {
            byUser.set(match.userId, {
                lots: match.lots,
                commission: match.commission,
                accountNumber: match.accountNumber,
            });
        }
    }

    for (const [userId, agg] of byUser) {
        try {
            // Upsert by the composite unique key — no findFirst-then-update
            // race, and one snapshot per user per period.
            await prisma.ibActivitySnapshot.upsert({
                where: {
                    userId_periodStart_periodEnd: {
                        userId,
                        periodStart,
                        periodEnd,
                    },
                },
                create: {
                    userId,
                    accountNumberMasked: "****" + agg.accountNumber.slice(-4),
                    periodStart,
                    periodEnd,
                    closedLotVolume: agg.lots,
                    estimatedIbRevenue: agg.commission,
                    activityStatus:
                        agg.lots > 0
                            ? "ACTIVE_TRADER"
                            : "CONNECTED_NO_TRADES",
                },
                update: {
                    closedLotVolume: agg.lots,
                    estimatedIbRevenue: agg.commission,
                    activityStatus:
                        agg.lots > 0
                            ? "ACTIVE_TRADER"
                            : "CONNECTED_NO_TRADES",
                },
            });
            imported++;
        } catch (err: any) {
            errors.push(`User ${userId}: ${err.message}`);
            skipped++;
        }
    }

    return { imported, skipped: skipped + preview.unmatched, errors };
}
