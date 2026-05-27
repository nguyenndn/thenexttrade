import { prisma } from "@/lib/prisma";
import { SignalType, TraderSignalInput } from "./signal-types";
import { getMistakeByCode } from "@/lib/mistakes";
import { subDays } from "date-fns";

export async function computeTraderSignals(
    userId: string,
    options?: {
        accountId?: string;
        periodStart?: Date;
        periodEnd?: Date;
        persist?: boolean;
    }
): Promise<TraderSignalInput[]> {
    const persist = options?.persist ?? true;
    
    // Gather inputs
    const accounts = await prisma.tradingAccount.findMany({
        where: { userId }
    });
    
    const countAccounts = accounts.length;
    
    // Fetch last 30 days trades
    const thirtyDaysAgo = subDays(new Date(), 30);
    const trades = await prisma.journalEntry.findMany({
        where: {
            userId,
            status: "CLOSED",
            entryDate: { gte: thirtyDaysAgo }
        },
        orderBy: { entryDate: "desc" }
    });
    
    const countWeeklyReports = await prisma.tradingReport.count({
        where: {
            userId,
            type: "WEEKLY"
        }
    });
    
    const countCompletedLessons = await prisma.userProgress.count({
        where: {
            userId,
            isCompleted: true
        }
    });
    
    const signals: TraderSignalInput[] = [];
    
    // ==========================================
    // ACTIVATION SIGNALS
    // ==========================================
    
    // 1. NO_ACCOUNT
    if (countAccounts === 0) {
        signals.push({
            signalType: "NO_ACCOUNT",
            severity: "HIGH",
            title: "Add your first MT5 Account",
            summary: "Connect your trading account to unlock advanced AI coaching, automatic synchronization, and edge analytics.",
            actionLabel: "Add MT5 Account",
            actionHref: "/dashboard/accounts"
        });
    } else {
        // 2. ACCOUNT_NEVER_SYNCED
        const allSyncedCount = accounts.filter(a => a.lastSync).length;
        if (allSyncedCount === 0 && trades.length === 0) {
            signals.push({
                signalType: "ACCOUNT_NEVER_SYNCED",
                severity: "HIGH",
                title: "Set up trade synchronization",
                summary: "Your account is connected but has never synced trades. Setup TNT Connect or EA to automatically track your edge.",
                actionLabel: "Set Up Sync",
                actionHref: "/dashboard/accounts"
            });
        }
        
        // 3. SYNC_STALE
        const sortedSyncs = accounts
            .filter(a => a.lastSync)
            .map(a => a.lastSync as Date)
            .sort((a, b) => b.getTime() - a.getTime());
        if (sortedSyncs.length > 0) {
            const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            if (now - sortedSyncs[0].getTime() > threeDaysInMs) {
                signals.push({
                    signalType: "SYNC_STALE",
                    severity: "MEDIUM",
                    title: "Sync is disconnected or stale",
                    summary: "Your account hasn't successfully synchronized trades in over 3 days. Check your EA or TNT Connect setup to keep analytics current.",
                    actionLabel: "Troubleshoot Sync",
                    actionHref: "/dashboard/accounts"
                });
            }
        }
    }
    
    // 4. NO_FIRST_TRADE
    if (countAccounts > 0 && trades.length === 0) {
        signals.push({
            signalType: "NO_FIRST_TRADE",
            severity: "HIGH",
            title: "Sync or log your first trade",
            summary: "Start tracking your journey. Sync your MT5 history or manually log your first trade today.",
            actionLabel: "Log First Trade",
            actionHref: "/dashboard/journal"
        });
    }
    
    // 5. NO_WEEKLY_REVIEW
    if (trades.length > 0 && countWeeklyReports === 0) {
        signals.push({
            signalType: "NO_WEEKLY_REVIEW",
            severity: "MEDIUM",
            title: "Generate your first Weekly Coach Plan",
            summary: "You have synced trades. Run a weekly review to construct your first automated Weekly Coach Report and leak detector.",
            actionLabel: "Generate Review",
            actionHref: "/dashboard/reports"
        });
    }
    
    // 6. NO_LESSON_STARTED
    if (countCompletedLessons === 0) {
        signals.push({
            signalType: "NO_LESSON_STARTED",
            severity: "INFO",
            title: "Begin your first Academy lesson",
            summary: "Accelerate your trading consistency. Start with our structured lessons and claim Edge XP along the way.",
            actionLabel: "Start First Lesson",
            actionHref: "/dashboard/academy"
        });
    }
    
    // ==========================================
    // TRADE WEAKNESS SIGNALS (Minimum 5 trades for analysis)
    // ==========================================
    if (trades.length >= 5) {
        // Chronological order for sequence analysis (oldest first)
        const chronologicalTrades = [...trades].reverse();
        
        // 7. LOSS_STREAK (3+ consecutive losses)
        let consecutiveLosses = 0;
        let maxStreak = 0;
        for (const t of chronologicalTrades) {
            if (t.pnl && t.pnl < 0) {
                consecutiveLosses++;
                maxStreak = Math.max(maxStreak, consecutiveLosses);
            } else if (t.pnl && t.pnl > 0) {
                consecutiveLosses = 0;
            }
        }
        if (maxStreak >= 3) {
            signals.push({
                signalType: "LOSS_STREAK",
                severity: maxStreak >= 5 ? "HIGH" : "MEDIUM",
                title: `${maxStreak}-Trade Loss Streak Detected`,
                summary: `You recently hit a streak of ${maxStreak} consecutive losses. Focus on cooling down and resetting emotional bias.`,
                actionLabel: "Review Loss Streak Lesson",
                actionHref: "/dashboard/academy",
                metadata: { maxStreak }
            });
        }
        
        // 8. SL_CLUSTER (3+ losses in same day)
        const lossesByDay: Record<string, number> = {};
        for (const t of trades) {
            if (t.pnl && t.pnl < 0) {
                const dayStr = new Date(t.entryDate).toISOString().split("T")[0];
                lossesByDay[dayStr] = (lossesByDay[dayStr] || 0) + 1;
            }
        }
        const maxLossesInDay = Math.max(...Object.values(lossesByDay), 0);
        if (maxLossesInDay >= 3) {
            signals.push({
                signalType: "SL_CLUSTER",
                severity: "MEDIUM",
                title: "Frequent Stop-Loss Clustered Exits",
                summary: `You had up to ${maxLossesInDay} stop-loss triggers within a single trading session/day. Consider reducing size or taking a step back on heavy volatility days.`,
                actionLabel: "Study SL Placement",
                actionHref: "/dashboard/academy"
            });
        }
        
        // 9. REVENGE_SIZE_UP
        let hasRevengeSizeUp = false;
        for (let i = 0; i < chronologicalTrades.length - 1; i++) {
            const current = chronologicalTrades[i];
            const next = chronologicalTrades[i + 1];
            if (current.pnl && current.pnl < 0) {
                const timeDiff = next.entryDate.getTime() - (current.exitDate || current.entryDate).getTime();
                const oneDayMs = 24 * 60 * 60 * 1000;
                if (timeDiff > 0 && timeDiff <= oneDayMs && next.lotSize >= current.lotSize * 1.5) {
                    hasRevengeSizeUp = true;
                    break;
                }
            }
        }
        if (hasRevengeSizeUp) {
            signals.push({
                signalType: "REVENGE_SIZE_UP",
                severity: "HIGH",
                title: "Revenge Size-Up Pattern Detected",
                summary: "Your data shows you significantly increased lot size shortly after a losing trade. This is a common revenge-trading trap.",
                actionLabel: "Review Psychology Lesson",
                actionHref: "/dashboard/academy"
            });
        }
        
        // 10. LOW_PLAN_COMPLIANCE (>40% trades followedPlan=false)
        const reviewedTrades = trades.filter(t => t.followedPlan !== null);
        if (reviewedTrades.length >= 5) {
            const nonCompliant = reviewedTrades.filter(t => t.followedPlan === false).length;
            const ratio = nonCompliant / reviewedTrades.length;
            if (ratio > 0.40) {
                signals.push({
                    signalType: "LOW_PLAN_COMPLIANCE",
                    severity: "HIGH",
                    title: `Low Plan Compliance (${Math.round(ratio * 100)}%)`,
                    summary: `You marked ${nonCompliant} out of ${reviewedTrades.length} reviewed trades as 'Did Not Follow Plan'. Discipline is your primary edge.`,
                    actionLabel: "Build Trading Plan",
                    actionHref: "/dashboard/academy"
                });
            }
        }
        
        // 11. BE_HEAVY (>40% break-even exits in last 15 trades)
        const last15 = trades.slice(0, 15);
        const breakEvens = last15.filter(t => t.pnl !== null && Math.abs(t.pnl) <= 5.0 && t.pnl !== 0).length;
        const beRatio = breakEvens / last15.length;
        if (beRatio > 0.40) {
            signals.push({
                signalType: "BE_HEAVY",
                severity: "MEDIUM",
                title: `Heavy Break-Even Exits (${Math.round(beRatio * 100)}%)`,
                summary: `Over 40% of your recent exits resulted in near break-even. Review whether you are moving stop-loss to entry too defensively.`,
                actionLabel: "Study Exit Management",
                actionHref: "/dashboard/academy"
            });
        }
        
        // 12. WEAK_SYMBOL
        const symbolStats: Record<string, { pnl: number; count: number }> = {};
        for (const t of trades) {
            if (t.pnl) {
                symbolStats[t.symbol] = symbolStats[t.symbol] || { pnl: 0, count: 0 };
                symbolStats[t.symbol].pnl += t.pnl;
                symbolStats[t.symbol].count += 1;
            }
        }
        const weakSymbol = Object.entries(symbolStats)
            .filter(([_, stat]) => stat.count >= 5 && stat.pnl < 0)
            .sort((a, b) => a[1].pnl - b[1].pnl)[0];
        if (weakSymbol) {
            signals.push({
                signalType: "WEAK_SYMBOL",
                severity: "MEDIUM",
                title: `Underperforming Asset: ${weakSymbol[0]}`,
                summary: `You have negative net P/L ($${Math.round(Math.abs(weakSymbol[1].pnl))}) across ${weakSymbol[1].count} trades on ${weakSymbol[0]}. Consider pausing to study its price behavior.`,
                actionLabel: "Review Symbol Analytics",
                actionHref: "/dashboard/journal"
            });
        }
        
        // 13. WEAK_SESSION
        const sessionStats: Record<string, { pnl: number; count: number }> = {};
        for (const t of trades) {
            if (t.pnl && t.tradingSession) {
                sessionStats[t.tradingSession] = sessionStats[t.tradingSession] || { pnl: 0, count: 0 };
                sessionStats[t.tradingSession].pnl += t.pnl;
                sessionStats[t.tradingSession].count += 1;
            }
        }
        const weakSession = Object.entries(sessionStats)
            .filter(([_, stat]) => stat.count >= 5 && stat.pnl < 0)
            .sort((a, b) => a[1].pnl - b[1].pnl)[0];
        if (weakSession) {
            signals.push({
                signalType: "WEAK_SESSION",
                severity: "LOW",
                title: `Weak Trading Session: ${weakSession[0]}`,
                summary: `Your results are weakest during the ${weakSession[0]} session. Restricting activity to your high-win session could instantly boost edge.`,
                actionLabel: "Analyze Sessions",
                actionHref: "/dashboard/reports"
            });
        }
        
        // 14. RECURRING_MISTAKE
        const mistakeCounts: Record<string, number> = {};
        for (const t of trades) {
            if (t.mistakes && Array.isArray(t.mistakes)) {
                (t.mistakes as string[]).forEach(code => {
                    mistakeCounts[code] = (mistakeCounts[code] || 0) + 1;
                });
            }
        }
        const topMistake = Object.entries(mistakeCounts)
            .filter(([_, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1])[0];
        if (topMistake) {
            const details = getMistakeByCode(topMistake[0]);
            signals.push({
                signalType: "RECURRING_MISTAKE",
                severity: "HIGH",
                title: `Recurring Mistake: ${details?.name || topMistake[0]}`,
                summary: `You logged the mistake "${details?.name || topMistake[0]}" ${topMistake[1]} times in recent trades. Address this leak immediately.`,
                actionLabel: "Target Mistake Lesson",
                actionHref: "/dashboard/academy",
                metadata: { mistakeCode: topMistake[0] }
            });
        }
    }
    
    // Persist to DB
    if (persist) {
        for (const sig of signals) {
            await prisma.traderSignal.upsert({
                where: {
                    userId_signalType_sourceType_sourceId: {
                        userId,
                        signalType: sig.signalType,
                        sourceType: sig.sourceType || "SYSTEM",
                        sourceId: sig.sourceId || "GLOBAL"
                    }
                },
                update: {
                    severity: sig.severity,
                    status: "ACTIVE",
                    title: sig.title,
                    summary: sig.summary,
                    actionLabel: sig.actionLabel,
                    actionHref: sig.actionHref,
                    metadata: sig.metadata || undefined,
                    lastSeenAt: new Date()
                },
                create: {
                    userId,
                    signalType: sig.signalType,
                    severity: sig.severity,
                    status: "ACTIVE",
                    sourceType: sig.sourceType || "SYSTEM",
                    sourceId: sig.sourceId || "GLOBAL",
                    title: sig.title,
                    summary: sig.summary,
                    actionLabel: sig.actionLabel,
                    actionHref: sig.actionHref,
                    metadata: sig.metadata || undefined
                }
            });
        }
        
        // Resolve signals that are no longer active
        const activeTypes = signals.map(s => s.signalType);
        await prisma.traderSignal.updateMany({
            where: {
                userId,
                status: "ACTIVE",
                signalType: { notIn: activeTypes }
            },
            data: {
                status: "RESOLVED",
                resolvedAt: new Date()
            }
        });
    }
    
    return signals;
}
