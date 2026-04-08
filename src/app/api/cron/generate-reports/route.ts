import { NextResponse } from "next/server";
import { generateReportsForAllUsers } from "@/lib/services/report-generator.service";
import { sendEmail, buildReportEmailHtml, buildNudgeEmailHtml } from "@/lib/services/email.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max for batch processing

/**
 * Cron API Route: Generate Weekly/Monthly Trading Reports
 * 
 * Scheduled: Daily at 00:05 UTC
 * Logic:
 *   - Sunday → Generate WEEKLY reports for last week
 *   - 1st of month → Generate MONTHLY reports for last month
 *   - Other days → Skip (no-op)
 * 
 * Security: Protected by CRON_SECRET bearer token
 * Platform-agnostic: Works with Vercel Cron, AWS CloudWatch, crontab, or any HTTP scheduler
 */
export async function GET(request: Request) {
    // 1. Auth Check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("CRON_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Determine what to generate
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayOfMonth = now.getUTCDate();

    const tasks: ("WEEKLY" | "MONTHLY")[] = [];

    // Allow manual trigger via query param
    const url = new URL(request.url);
    const forceType = url.searchParams.get("type");
    const currentPeriod = url.searchParams.get("current") === "true";

    if (forceType === "weekly" || forceType === "monthly") {
        tasks.push(forceType.toUpperCase() as "WEEKLY" | "MONTHLY");
    } else {
        if (dayOfWeek === 0) tasks.push("WEEKLY");   // Sunday
        if (dayOfMonth === 1) tasks.push("MONTHLY");  // 1st of month
    }

    if (tasks.length === 0) {
        return NextResponse.json({
            message: "No reports to generate today",
            day: dayOfWeek,
            date: dayOfMonth,
        });
    }


    // 3. Generate reports
    const allResults: any[] = [];
    let notificationsSent = 0;
    let emailsSent = 0;

    for (const type of tasks) {
        const results = await generateReportsForAllUsers(type, currentPeriod);
        allResults.push({ type, results });

        // 4. Send notifications + emails for generated reports
        for (const r of results) {
            // Fetch user email for email sending
            const user = await prisma.user.findUnique({
                where: { id: r.userId },
                select: { email: true, name: true },
            });

            if (r.result.skipped && r.result.empty) {
                // No trades → send nudge notification + email
                await prisma.notification.create({
                    data: {
                        userId: r.userId,
                        type: "NO_TRADES_NUDGE",
                        title: type === "WEEKLY"
                            ? "📊 No trades last week"
                            : "📊 No trades last month",
                        message: type === "WEEKLY"
                            ? "You didn't place any trades last week. Consider reviewing your strategy and staying consistent."
                            : "You didn't place any trades last month. Consistency is key to growth!",
                        priority: "LOW",
                    },
                });
                notificationsSent++;

                // Send nudge email
                if (user?.email) {
                    const nudgeHtml = buildNudgeEmailHtml(user.name || "Trader", type);
                    const sent = await sendEmail({
                        to: user.email,
                        subject: type === "WEEKLY"
                            ? "📊 No trades logged this week — stay consistent!"
                            : "📊 No trades logged this month — keep going!",
                        html: nudgeHtml,
                    });
                    if (sent) emailsSent++;
                }
            } else if (!r.result.skipped && r.result.reportId) {
                // Report generated → send notification + email
                const report = await prisma.tradingReport.findUnique({
                    where: { id: r.result.reportId },
                });

                await prisma.notification.create({
                    data: {
                        userId: r.userId,
                        type: type === "WEEKLY" ? "WEEKLY_REPORT" : "MONTHLY_REPORT",
                        title: type === "WEEKLY"
                            ? "📈 Your Weekly Report is Ready!"
                            : "📈 Your Monthly Report is Ready!",
                        message: type === "WEEKLY"
                            ? `Your weekly trading report is ready. Check your performance summary!`
                            : `Your monthly trading report is ready. Review your progress!`,
                        priority: "NORMAL",
                        link: "/dashboard/reports",
                    },
                });
                notificationsSent++;

                // Send report email
                if (user?.email && report) {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";
                    const reportHtml = buildReportEmailHtml({
                        userName: user.name || "Trader",
                        periodLabel: report.periodLabel,
                        type,
                        netPnL: report.netPnL,
                        winRate: report.winRate,
                        totalTrades: report.totalTrades,
                        profitFactor: report.profitFactor,
                        avgWin: report.avgWin,
                        avgLoss: report.avgLoss,
                        largestWin: report.largestWin,
                        largestLoss: report.largestLoss,
                        prevPnL: report.prevPnL,
                        prevWinRate: report.prevWinRate,
                        topSymbols: (report.bySymbol as any[] || []).slice(0, 3),
                        topMistakes: (report.topMistakes as any[] || []).slice(0, 3),
                        reportUrl: `${baseUrl}/dashboard/reports`,
                    });

                    const sent = await sendEmail({
                        to: user.email,
                        subject: type === "WEEKLY"
                            ? `📈 Weekly Report: ${report.netPnL >= 0 ? '+' : ''}$${report.netPnL.toFixed(0)} — ${report.periodLabel}`
                            : `📈 Monthly Report: ${report.netPnL >= 0 ? '+' : ''}$${report.netPnL.toFixed(0)} — ${report.periodLabel}`,
                        html: reportHtml,
                    });

                    if (sent) {
                        emailsSent++;
                        // Mark email sent on report
                        await prisma.tradingReport.update({
                            where: { id: report.id },
                            data: { emailSentAt: new Date() },
                        });
                    }
                }
            }
        }
    }

    return NextResponse.json({
        success: true,
        tasks,
        totalUsers: allResults.reduce((sum, t) => sum + t.results.length, 0),
        notificationsSent,
        emailsSent,
        timestamp: now.toISOString(),
    });
}
