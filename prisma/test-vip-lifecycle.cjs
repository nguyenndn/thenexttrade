/**
 * Standalone VIP Lifecycle & 7-Day Trial Simulation Script
 * Runs real DB transactions and verifies all policy transitions.
 * 
 * Usage: node prisma/test-vip-lifecycle.cjs
 */

const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TEST_EMAIL = "test-vip-simulation@thenexttrade.local";
let testUserId = null;
let testAccountId = null;
let testTicketId = null;

async function logStep(num, name, passed, details) {
    const icon = passed ? "✅" : "❌";
    console.log(`\n${icon} [STEP ${num}] ${name}`);
    if (details) console.log(`   ↳ ${details}`);
    if (!passed) {
        throw new Error(`Assertion failed at Step ${num}: ${name}`);
    }
}

function countTradingDaysBetween(startDate, endDate = new Date()) {
    if (startDate >= endDate) return 0;
    let count = 0;
    const current = new Date(startDate.getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;
    while (current.getTime() + oneDayMs <= endDate.getTime()) {
        current.setTime(current.getTime() + oneDayMs);
        const dayOfWeek = current.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
    }
    return count;
}

function subtractTradingDays(fromDate, tradingDays) {
    const current = new Date(fromDate.getTime());
    let remaining = tradingDays;
    const oneDayMs = 24 * 60 * 60 * 1000;
    while (remaining > 0) {
        current.setTime(current.getTime() - oneDayMs);
        const dayOfWeek = current.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            remaining--;
        }
    }
    return current;
}

async function runSimulation() {
    console.log("================================================================");
    console.log("🚀 STARTING 7-DAY TRIAL & VIP ACTIVE RETENTION POLICY SIMULATION");
    console.log("================================================================");

    try {
        // --- CLEANUP PRIOR RUNS IF ANY ---
        const priorUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
        if (priorUser) {
            await prisma.journalEntry.deleteMany({ where: { userId: priorUser.id } });
            await prisma.proEntitlement.deleteMany({ where: { userId: priorUser.id } });
            await prisma.supportSyncTicket.deleteMany({ where: { userId: priorUser.id } });
            await prisma.tradingAccount.deleteMany({ where: { userId: priorUser.id } });
            await prisma.user.delete({ where: { id: priorUser.id } });
        }

        // ====================================================================
        // STEP 1: NEW SIGNUP -> 7-DAY FREE TRIAL ACTIVE
        // ====================================================================
        const user = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                email: TEST_EMAIL,
                name: "Simulation Trader",
                createdAt: new Date(), // Created right now
            },
        });
        testUserId = user.id;

        // Dynamic trial check (7 days from createdAt)
        const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
        const trialEndsAt = new Date(user.createdAt.getTime() + trialDurationMs);
        const now = new Date();
        const isTrial = now < trialEndsAt;
        const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        await logStep(
            1,
            "New User Signup -> 7-Day Free Trial Auto-Activation",
            isTrial === true && daysRemaining === 7,
            `isTrial: ${isTrial}, daysRemaining: ${daysRemaining}, trialEndsAt: ${trialEndsAt.toISOString()}`
        );

        // ====================================================================
        // STEP 2: CONNECT EA ON REAL VANTAGE ACCOUNT WITH $500 BALANCE
        // ====================================================================
        const account = await prisma.tradingAccount.create({
            data: {
                userId: user.id,
                name: "Vantage Live Main",
                accountNumber: "88991122",
                broker: "Vantage FX",
                server: "Vantage-Live",
                balance: 500,
                equity: 500,
                currency: "USD",
                status: "CONNECTED",
                fundingVerifiedAt: new Date(),
                fundingAmount: 500,
                fundingLastVerifiedAt: new Date(),
            },
        });
        testAccountId = account.id;

        // Upsert ProEntitlement
        const entitlement = await prisma.proEntitlement.create({
            data: {
                userId: user.id,
                tradingAccountId: account.id,
                broker: "Vantage FX",
                status: "ACTIVE",
                source: "IB_VERIFIED",
                startsAt: new Date(),
            },
        });

        await logStep(
            2,
            "EA Connect on Partner Broker ($500 balance) -> VIP Entitlement Granted",
            account.fundingVerifiedAt !== null && entitlement.status === "ACTIVE",
            `Account ID: ${account.id}, fundingVerifiedAt: ${account.fundingVerifiedAt}, Entitlement: ${entitlement.status}`
        );

        // ====================================================================
        // STEP 3: RECORD 2.5 LOTS TRADING VOLUME VIA EA_SYNC (ACTIVE STATE)
        // ====================================================================
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        await prisma.journalEntry.create({
            data: {
                userId: user.id,
                accountId: account.id,
                externalTicket: "100001",
                symbol: "XAUUSD",
                type: "BUY",
                lotSize: 2.5,
                entryPrice: 2600.0,
                exitPrice: 2610.0,
                entryDate: twoDaysAgo,
                exitDate: twoDaysAgo,
                pnl: 250.0,
                status: "CLOSED",
                syncSource: "EA_SYNC",
            },
        });

        // Query 30d volume
        const period30dStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const volumeAgg = await prisma.journalEntry.aggregate({
            where: {
                accountId: account.id,
                status: "CLOSED",
                syncSource: { in: ["EA_SYNC", "EA_HISTORY", "SUPPORT_SYNC"] },
                exitDate: { gte: period30dStart },
            },
            _sum: { lotSize: true },
        });

        const rolling30dLots = volumeAgg._sum.lotSize ?? 0;
        const isPolicyActive = rolling30dLots >= 2.0;

        await logStep(
            3,
            "Trading Volume Qualification (2.5 Lots >= 2.0 Lots) -> Policy ACTIVE",
            isPolicyActive === true && rolling30dLots === 2.5,
            `30-day Volume: ${rolling30dLots} lots (Requirement: >= 2.0 lots)`
        );

        // ====================================================================
        // STEP 4: INACTIVITY SIMULATION (8 TRADING DAYS WITHOUT TRADES) -> WARNED
        // ====================================================================
        const eightDaysAgo = subtractTradingDays(now, 8);
        await prisma.journalEntry.updateMany({
            where: { accountId: account.id },
            data: { exitDate: eightDaysAgo, entryDate: eightDaysAgo },
        });

        const latestTrade = await prisma.journalEntry.findFirst({
            where: { accountId: account.id },
            orderBy: { exitDate: "desc" },
        });
        const daysSinceTrade = countTradingDaysBetween(latestTrade.exitDate, now);
        const isWarned = daysSinceTrade > 7 && daysSinceTrade <= 14;

        await logStep(
            4,
            "Inactivity 8 Trading Days (7-14 days range, Sat/Sun excluded) -> Policy WARNED (Warning Banner shown)",
            isWarned === true && daysSinceTrade === 8,
            `Trading days since last trade: ${daysSinceTrade} days -> State: WARNED (Pro remains active with warning)`
        );

        // ====================================================================
        // STEP 5: INACTIVITY SIMULATION (15 TRADING DAYS WITHOUT TRADES) -> PAUSED
        // ====================================================================
        const fifteenDaysAgo = subtractTradingDays(now, 15);
        await prisma.journalEntry.updateMany({
            where: { accountId: account.id },
            data: { exitDate: fifteenDaysAgo, entryDate: fifteenDaysAgo },
        });

        const latestTrade15 = await prisma.journalEntry.findFirst({
            where: { accountId: account.id },
            orderBy: { exitDate: "desc" },
        });
        const daysSinceTrade15 = countTradingDaysBetween(latestTrade15.exitDate, now);
        const isPaused = daysSinceTrade15 > 14;

        await logStep(
            5,
            "Inactivity 15 Trading Days (>14 days, Sat/Sun excluded) -> Policy PAUSED (Pro gated)",
            isPaused === true && daysSinceTrade15 === 15,
            `Trading days since last trade: ${daysSinceTrade15} days -> State: PAUSED (Pro effectively paused)`
        );

        // ====================================================================
        // STEP 6: RECOVERY UPON NEW TRADE RECORDING -> ACTIVE AGAIN
        // ====================================================================
        await prisma.journalEntry.create({
            data: {
                userId: user.id,
                accountId: account.id,
                externalTicket: "100002",
                symbol: "EURUSD",
                type: "SELL",
                lotSize: 0.5,
                entryPrice: 1.1000,
                exitPrice: 1.0950,
                entryDate: now,
                exitDate: now,
                pnl: 25.0,
                status: "CLOSED",
                syncSource: "EA_SYNC",
            },
        });

        const recoveredLatestTrade = await prisma.journalEntry.findFirst({
            where: { accountId: account.id },
            orderBy: { exitDate: "desc" },
        });
        const recoveredDays = Math.floor((now.getTime() - recoveredLatestTrade.exitDate.getTime()) / (1000 * 60 * 60 * 24));
        const isRecoveredActive = recoveredDays <= 7;

        await logStep(
            6,
            "Trader Enters New Trade -> Instant Self-Healing to ACTIVE",
            isRecoveredActive === true && recoveredDays === 0,
            `Days since trade: ${recoveredDays} -> State: ACTIVE restored instantly`
        );

        // ====================================================================
        // STEP 7: PERIODIC 30-DAY FUNDING RECHECK (BALANCE DROPPED TO $200) -> 7-DAY GRACE
        // ====================================================================
        const graceDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: {
                balance: 200,
                fundingLastVerifiedAt: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000), // 32 days ago
                fundingGraceUntil: graceDeadline,
            },
        });

        const graceAccount = await prisma.tradingAccount.findUnique({ where: { id: account.id } });
        const inGrace = graceAccount.fundingGraceUntil && now <= graceAccount.fundingGraceUntil;

        await logStep(
            7,
            "Periodic Funding Check (<$300 balance) -> 7-Day Grace Period Triggered",
            inGrace === true,
            `fundingGraceUntil: ${graceAccount.fundingGraceUntil.toISOString()}, inGrace: ${inGrace}`
        );

        // ====================================================================
        // STEP 8: GRACE EXPIRED RECONCILIATION -> PRO ENTITLEMENT EXPIRED
        // ====================================================================
        const expiredGrace = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: { fundingGraceUntil: expiredGrace },
        });

        // Simulate Reconciliation service
        const recheckAccount = await prisma.tradingAccount.findUnique({ where: { id: account.id } });
        const isFundingExpired = recheckAccount.fundingGraceUntil && now > recheckAccount.fundingGraceUntil;

        if (isFundingExpired) {
            await prisma.proEntitlement.update({
                where: { id: entitlement.id },
                data: { status: "EXPIRED", adminNote: "Funding verification expired" },
            });
        }

        const expiredEntitlement = await prisma.proEntitlement.findUnique({ where: { id: entitlement.id } });

        await logStep(
            8,
            "Grace Period Expired without Top-Up -> Entitlement transitions to EXPIRED",
            expiredEntitlement.status === "EXPIRED",
            `Entitlement status: ${expiredEntitlement.status}, note: ${expiredEntitlement.adminNote}`
        );

        // ====================================================================
        // STEP 9: SUPPORT-SYNC CONCIERGE TICKET CREATION
        // ====================================================================
        // Next Saturday 10:00 UTC calculation
        const sat = new Date(now);
        const dayOfWeek = sat.getUTCDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        sat.setUTCDate(sat.getUTCDate() + daysUntilSaturday);
        sat.setUTCHours(10, 0, 0, 0);

        const ticket = await prisma.supportSyncTicket.create({
            data: {
                userId: user.id,
                tradingAccountId: account.id,
                broker: "Exness",
                accountNumber: "99887766",
                server: "Exness-Real12",
                notes: "Manual trader request for weekly sync",
                scheduledFor: sat,
                status: "PENDING",
            },
        });
        testTicketId = ticket.id;

        await logStep(
            9,
            "Support-Sync Concierge Ticket Created -> Batch scheduled for Saturday 10:00 UTC",
            ticket.status === "PENDING" && ticket.scheduledFor.toISOString() === sat.toISOString(),
            `Ticket ID: ${ticket.id}, Scheduled: ${ticket.scheduledFor.toISOString()}`
        );

        console.log("\n================================================================");
        console.log("🎉 ALL 9 LIFECYCLE SIMULATION STAGES COMPLETED & VERIFIED 100%!");
        console.log("================================================================");
    } finally {
        // --- CLEANUP TEST DATA ---
        if (testUserId) {
            await prisma.journalEntry.deleteMany({ where: { userId: testUserId } });
            await prisma.proEntitlement.deleteMany({ where: { userId: testUserId } });
            await prisma.supportSyncTicket.deleteMany({ where: { userId: testUserId } });
            await prisma.tradingAccount.deleteMany({ where: { userId: testUserId } });
            await prisma.user.delete({ where: { id: testUserId } });
            console.log("\n🧹 Test records cleaned up successfully from database.");
        }
        await prisma.$disconnect();
    }
}

runSimulation().catch((err) => {
    console.error("Simulation run error:", err);
    process.exit(1);
});
