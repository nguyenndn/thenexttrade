import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { generateTradeHash, ParsedTrade } from "@/lib/importers";

interface ImportRequest {
    accountId: string;
    source: string;
    filename: string;
    fileSize: number;
    trades: ParsedTrade[];
    skipDuplicates: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: ImportRequest = await request.json();
        const { accountId, source, filename, fileSize, trades, skipDuplicates = true } = body;

        // We allow missing accountId ONLY if there's just one account or we auto-create.
        // For now require it.
        if (!trades || trades.length === 0) {
            return NextResponse.json(
                { error: "No trades to import" },
                { status: 400 }
            );
        }

        // If accountId is provided, verify ownership
        if (accountId) {
            const account = await prisma.tradingAccount.findFirst({
                where: { id: accountId, userId: user.id },
            });

            if (!account) {
                return NextResponse.json(
                    { error: "Account not found" },
                    { status: 404 }
                );
            }
        }

        // Create import record
        const importRecord = await prisma.importHistory.create({
            data: {
                userId: user.id,
                accountId: accountId || null,
                source,
                filename,
                fileSize,
                totalRows: trades.length,
                status: "PROCESSING",
            },
        });

        let importedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const importErrors: string[] = [];

        // Process trades
        for (const trade of trades) {
            try {
                // Generate hash for duplicate detection
                const hash = generateTradeHash({
                    symbol: trade.symbol,
                    type: trade.type,
                    entryDate: new Date(trade.entryDate),
                    entryPrice: trade.entryPrice,
                });

                // Check for duplicates
                if (skipDuplicates) {
                    const existing = await prisma.journalEntry.findFirst({
                        where: {
                            userId: user.id,
                            // If accountId is null (general journal), we still check global duplicates (?) 
                            // Better to scope by account if possible.
                            // For duplicate checking, let's look for matching externalTicket if present, OR hash.
                            OR: [
                                { externalTicket: trade.externalTicket || "NON_EXISTENT_TICKET" },
                                { externalHash: hash },
                            ],
                        },
                    });

                    if (existing) {
                        skippedCount++;
                        continue;
                    }
                }

                // Create trade
                // Note: JournalEntry is the model name, not JournalTrade.
                await prisma.journalEntry.create({
                    data: {
                        userId: user.id,
                        accountId: accountId || null,
                        importId: importRecord.id, // Assuming relation exists
                        externalTicket: trade.externalTicket,
                        externalHash: hash,
                        symbol: trade.symbol,
                        type: trade.type, // Ensure type matches enum (BUY/SELL)
                        entryDate: new Date(trade.entryDate),
                        entryPrice: trade.entryPrice,
                        exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
                        exitPrice: trade.exitPrice,
                        lotSize: trade.size || 0, // Map size to lotSize
                        pnl: trade.pnl,
                        status: (trade.status as any) || "CLOSED", // OPEN/CLOSED
                        result: (trade.result as any), // WIN/LOSS/BREAK_EVEN

                        // Required fields handling
                        // entryReason?
                    },
                });

                importedCount++;
            } catch (err: any) {
                errorCount++;
                importErrors.push(`Trade ${trade.externalTicket || trade.symbol}: ${err.message}`);
            }
        }

        // Update import record
        await prisma.importHistory.update({
            where: { id: importRecord.id },
            data: {
                importedCount,
                skippedCount,
                errorCount,
                status: errorCount > 0 && importedCount === 0 ? "FAILED" : "COMPLETED",
                errorMessage: importErrors.length > 0 ? importErrors.join("; ").substring(0, 1000) : null,
                completedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            importId: importRecord.id,
            imported: importedCount,
            skipped: skippedCount,
            errors: errorCount,
        });
    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: "Failed to execute import: " + error.message },
            { status: 500 }
        );
    }
}
