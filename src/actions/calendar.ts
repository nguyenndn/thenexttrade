"use server";

import { prisma as db } from "@/lib/prisma";
import { getAuthUser as getCurrentUser } from "@/lib/auth-cache";
import { startOfMonth, endOfMonth, parseISO, startOfDay } from "date-fns";

export interface DailyPerformance {
  date: string; // 'yyyy-MM-dd'
  pnl: number;
  tradesCount: number;
  wins: number;
  losses: number;
  breakEvens: number;
  note?: string;
  noteId?: string;
}

export async function getCalendarPerformance(monthStr: string, accountId?: string): Promise<{ success: boolean; data?: DailyPerformance[]; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const monthDate = parseISO(monthStr);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    // Fetch all closed trades for the month
    const trades = await db.journalEntry.findMany({
      where: {
        userId: user.id,
        ...(accountId ? { accountId } : {}),
        status: "CLOSED",
        exitDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        exitDate: true,
        pnl: true,
        result: true,
      },
    });

    // Fetch notes for the month
    const notes = await db.tradingDayNote.findMany({
      where: {
        userId: user.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        date: true,
        note: true,
      },
    });

    const performanceMap = new Map<string, DailyPerformance>();

    // Aggregate trades
    for (const trade of trades) {
      if (!trade.exitDate) continue;
      const dateStr = trade.exitDate.toISOString().split("T")[0];
      
      if (!performanceMap.has(dateStr)) {
        performanceMap.set(dateStr, {
          date: dateStr,
          pnl: 0,
          tradesCount: 0,
          wins: 0,
          losses: 0,
          breakEvens: 0,
        });
      }

      const dayPerf = performanceMap.get(dateStr)!;
      dayPerf.pnl += trade.pnl || 0;
      dayPerf.tradesCount += 1;
      
      if (trade.result === "WIN") dayPerf.wins += 1;
      else if (trade.result === "LOSS") dayPerf.losses += 1;
      else if (trade.result === "BREAK_EVEN") dayPerf.breakEvens += 1;
    }

    // Attach notes
    for (const note of notes) {
      const dateStr = note.date.toISOString().split("T")[0];
      if (!performanceMap.has(dateStr)) {
        performanceMap.set(dateStr, {
          date: dateStr,
          pnl: 0,
          tradesCount: 0,
          wins: 0,
          losses: 0,
          breakEvens: 0,
        });
      }
      const dayPerf = performanceMap.get(dateStr)!;
      dayPerf.note = note.note;
      dayPerf.noteId = note.id;
    }

    const result = Array.from(performanceMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching calendar performance:", error);
    return { success: false, error: "Failed to load calendar data" };
  }
}

export async function saveDailyNote(dateStr: string, noteText: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const date = startOfDay(parseISO(dateStr));
    
    const upserted = await db.tradingDayNote.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: date,
        }
      },
      update: {
        note: noteText,
      },
      create: {
        userId: user.id,
        date: date,
        note: noteText,
      }
    });

    return { success: true, data: upserted };
  } catch (error) {
    console.error("Error saving daily note:", error);
    return { success: false, error: "Failed to save note" };
  }
}
