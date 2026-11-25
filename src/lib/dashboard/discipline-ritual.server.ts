import { format, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
    computeDisciplineRitualFromTrades,
    type DisciplineRitualData,
    type RitualTradeSample,
} from "./discipline-ritual-types";

function formatInTimezone(date: Date, timezone?: string): string {
    if (timezone) {
        try {
            return new Intl.DateTimeFormat("en-CA", {
                timeZone: timezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(date);
        } catch {
            // Fallback to UTC ISO slice below
        }
    }
    return format(date, "yyyy-MM-dd");
}

export async function getDisciplineRitualData(
    userId: string,
    accountId?: string,
    accountTimezone?: string
): Promise<DisciplineRitualData> {
    const now = new Date();
    const windowStart = subDays(now, 30);

    const entries = await prisma.journalEntry.findMany({
        where: {
            userId,
            status: "CLOSED",
            ...(accountId && accountId !== "all" ? { accountId } : {}),
            OR: [
                { exitDate: { gte: windowStart } },
                { exitDate: null, entryDate: { gte: windowStart } },
            ],
        },
        select: {
            entryDate: true,
            exitDate: true,
            strategy: true,
            followedPlan: true,
            playbookGrade: true,
            emotionBefore: true,
            postTradeLesson: true,
            notesPsychology: true,
            mistakes: true,
            _count: {
                select: { ruleChecks: true },
            },
        },
        orderBy: [{ exitDate: "asc" }, { entryDate: "asc" }],
    });

    const samples: RitualTradeSample[] = entries.map((entry) => {
        const anchorDate = entry.exitDate || entry.entryDate;
        const fakeChecks =
            entry._count.ruleChecks > 0
                ? Array.from({ length: entry._count.ruleChecks })
                : [];
        return {
            dateKey: formatInTimezone(anchorDate, accountTimezone),
            strategy: entry.strategy,
            followedPlan: entry.followedPlan,
            playbookGrade: entry.playbookGrade,
            emotionBefore: entry.emotionBefore,
            postTradeLesson: entry.postTradeLesson,
            notesPsychology: entry.notesPsychology,
            mistakes: entry.mistakes,
            ruleChecks: fakeChecks,
        };
    });

    const refKey = formatInTimezone(now, accountTimezone);
    return computeDisciplineRitualFromTrades(samples, refKey);
}
