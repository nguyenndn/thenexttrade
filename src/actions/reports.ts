"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { ReportType } from "@prisma/client";

export async function getReports(type: ReportType, page = 1, limit = 10) {
    const user = await getAuthUser();
    if (!user) return { reports: [], total: 0 };

    const [reports, total] = await Promise.all([
        prisma.tradingReport.findMany({
            where: { userId: user.id, type },
            orderBy: { periodStart: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.tradingReport.count({
            where: { userId: user.id, type },
        }),
    ]);

    return {
        reports: reports.map(r => ({
            ...r,
            periodStart: r.periodStart.toISOString(),
            periodEnd: r.periodEnd.toISOString(),
            emailSentAt: r.emailSentAt?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
        })),
        total,
    };
}

export async function getLatestReport(type: ReportType) {
    const user = await getAuthUser();
    if (!user) return null;

    const report = await prisma.tradingReport.findFirst({
        where: { userId: user.id, type },
        orderBy: { periodStart: "desc" },
    });

    if (!report) return null;

    return {
        ...report,
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        emailSentAt: report.emailSentAt?.toISOString() || null,
        createdAt: report.createdAt.toISOString(),
    };
}
