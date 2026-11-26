import { getCurrencyTickerProps } from "@/lib/utils/cent-account";

export interface EquityCurveDataItem {
    date: string;
    balance: number;
    pnl: number;
}

export function formatCompactCurrency(
    amount: number,
    currency: string = "USD",
    alwaysSign: boolean = true
): string {
    const sign: "+" | "-" | "" =
        amount > 0 ? (alwaysSign ? "+" : "") : amount < 0 ? "-" : "";
    const { prefix, suffix } = getCurrencyTickerProps(currency, sign);
    const abs = Math.abs(amount);

    if (abs >= 1_000_000) {
        return `${prefix}${(abs / 1_000_000).toFixed(2)}M${suffix}`;
    }
    if (abs >= 1_000) {
        return `${prefix}${(abs / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}k${suffix}`;
    }
    return `${prefix}${abs.toFixed(abs >= 100 ? 0 : 2)}${suffix}`;
}

export function formatHoldMinutes(minutes: number): string {
    if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remMins = Math.round(minutes % 60);
    if (hours < 24) {
        return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function processEquityCurveData(data: EquityCurveDataItem[]) {
    if (!data || data.length === 0) {
        return {
            isEmpty: true,
            chartData: [],
            firstBalance: 0,
            totalNetProfit: 0,
            splitOffset: 0,
        };
    }

    const firstBalance = data[0].balance - data[0].pnl;
    const totalNetProfit = data.reduce((acc, curr) => acc + curr.pnl, 0);

    const chartData = data.map((item) => ({
        name: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        balance: item.balance,
        pnl: item.pnl,
        originalDate: item.date,
    }));

    const balances = chartData.map((d) => d.balance);
    const minBalance = Math.min(...balances, firstBalance);
    const maxBalance = Math.max(...balances, firstBalance);

    const splitOffset =
        maxBalance === minBalance
            ? 0
            : ((maxBalance - firstBalance) / (maxBalance - minBalance)) * 100;

    return {
        isEmpty: false,
        chartData,
        firstBalance,
        totalNetProfit,
        splitOffset,
    };
}

export interface PairPerformanceDataItem {
    symbol: string;
    pnl: number;
    tradeCount: number;
    winRate: number;
    profitFactor?: number;
    longTrades?: number;
    longPnl?: number;
    longWinRate?: number;
    shortTrades?: number;
    shortPnl?: number;
    shortWinRate?: number;
}

export function processPairPerformanceData(
    data: PairPerformanceDataItem[],
    limit: number = 6
) {
    if (!data || data.length === 0) {
        return {
            isEmpty: true,
            chartData: [],
            bestPair: null,
            worstPair: null,
            maxAbsPnl: 0,
        };
    }

    const sorted = [...data].sort((a, b) => b.pnl - a.pnl);
    const chartData = sorted.slice(0, limit);
    const maxAbsPnl = Math.max(
        1,
        ...chartData.map((item) => Math.abs(item.pnl))
    );

    return {
        isEmpty: false,
        chartData,
        bestPair: sorted[0] || null,
        worstPair: sorted.length > 1 ? sorted[sorted.length - 1] : null,
        maxAbsPnl,
    };
}

export interface DayPerformanceDataItem {
    day: string;
    dayIndex: number;
    pnl: number;
    tradeCount: number;
    winRate?: number;
}

export function processDayPerformanceData(data: DayPerformanceDataItem[]) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const chartData = days.map((day, index) => {
        const dayData = data?.find((d) => d.dayIndex === index + 1);
        return {
            name: day,
            pnl: dayData?.pnl || 0,
            tradeCount: dayData?.tradeCount || 0,
            winRate: Math.round(dayData?.winRate || 0),
        };
    });

    const activeDays = chartData.filter((d) => d.tradeCount > 0 || d.pnl !== 0);
    const sortedActive = [...activeDays].sort((a, b) => b.pnl - a.pnl);
    const bestDay = sortedActive[0] || null;
    const worstDay =
        sortedActive.length > 1
            ? sortedActive[sortedActive.length - 1]
            : null;
    const maxAbsPnl = Math.max(1, ...chartData.map((d) => Math.abs(d.pnl)));
    const hasData = activeDays.length > 0;

    return {
        chartData,
        bestDay,
        worstDay,
        maxAbsPnl,
        hasData,
    };
}
