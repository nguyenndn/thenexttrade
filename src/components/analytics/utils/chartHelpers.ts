export interface EquityCurveDataItem {
    date: string;
    balance: number;
    pnl: number;
}

export function processEquityCurveData(data: EquityCurveDataItem[]) {
    if (!data || data.length === 0) {
        return { isEmpty: true, chartData: [], firstBalance: 0, totalNetProfit: 0, splitOffset: 0 };
    }

    const firstBalance = data[0].balance - data[0].pnl;
    const totalNetProfit = data.reduce((acc, curr) => acc + curr.pnl, 0);

    const chartData = data.map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: item.balance,
        pnl: item.pnl,
        originalDate: item.date
    }));

    const balances = chartData.map(d => d.balance);
    const minBalance = Math.min(...balances, firstBalance);
    const maxBalance = Math.max(...balances, firstBalance);
    
    // Calculate gradient split offset where firstBalance is the 0 point (split line)
    const splitOffset = maxBalance === minBalance 
        ? 0 
        : ((maxBalance - firstBalance) / (maxBalance - minBalance)) * 100;

    return {
        isEmpty: false,
        chartData,
        firstBalance,
        totalNetProfit,
        splitOffset
    };
}

export interface PairPerformanceDataItem {
    symbol: string;
    pnl: number;
    tradeCount: number;
    winRate: number;
}

export function processPairPerformanceData(data: PairPerformanceDataItem[], limit: number = 8) {
    if (!data || data.length === 0) {
        return { isEmpty: true, chartData: [], bestPair: null };
    }

    const chartData = [...data]
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, limit);

    return {
        isEmpty: false,
        chartData,
        bestPair: chartData[0]
    };
}

export interface DayPerformanceDataItem {
    day: string;
    dayIndex: number;
    pnl: number;
    tradeCount: number;
}

export function processDayPerformanceData(data: DayPerformanceDataItem[]) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const chartData = days.map((day, index) => {
        const dayData = data?.find(d => d.dayIndex === index + 1);
        return {
            name: day,
            pnl: dayData?.pnl || 0,
            tradeCount: dayData?.tradeCount || 0
        };
    });

    const bestDay = [...chartData].sort((a, b) => b.pnl - a.pnl)[0];
    const hasData = chartData.some(d => d.pnl !== 0);

    return {
        chartData,
        bestDay,
        hasData
    };
}
