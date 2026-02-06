import { isSameDay } from "date-fns";

export type JournalEntry = {
    id: string;
    entryDate: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    pnl: number | null;
    status: 'OPEN' | 'CLOSED';
    lotSize: number;
    entryPrice: number;
};

export type DayMetrics = {
    totalPnL: number;
    tradeCount: number;
};

export const getDayMetrics = (entries: JournalEntry[], day: Date): DayMetrics | null => {
    const dayEntries = entries.filter(e => isSameDay(new Date(e.entryDate), day));
    if (dayEntries.length === 0) return null;

    const totalPnL = dayEntries.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
    const tradeCount = dayEntries.length;

    return { totalPnL, tradeCount };
};
