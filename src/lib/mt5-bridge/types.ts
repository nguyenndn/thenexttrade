export interface BridgeArmedRule {
    id: string;
    type: "PRICE_BE" | "PRICE_CLOSE" | "DAILY_LOSS_LIMIT" | "DAILY_PROFIT_TARGET" | string;
    symbol: string;
    targetPrice?: number | null;
    percentValue?: number | null;
    direction: "ABOVE" | "BELOW" | string;
    label: string;
    status: "ARMED" | "TRIGGERED" | string;
    createdAt: string;
    triggeredAt?: string | null;
}

export interface BridgeActivityItem {
    id: string;
    action: string;
    title: string;
    detail: string;
    source: "MOBILE" | "RULE_24_5" | "SYSTEM" | string;
    status: "DONE" | "PARTIAL" | "ERROR" | string;
    timestamp: string;
}

export interface BridgePosition {
    ticket: number;
    symbol: string;
    type: "BUY" | "SELL";
    lots: number;
    openPrice: number;
    currentPrice: number;
    stopLoss: number;
    takeProfit: number;
    profit: number;
    swap: number;
    commission: number;
    netProfit: number;
    pips: number;
    openTime: string;
    comment: string;
}

export interface BridgePendingOrder {
    ticket: number;
    symbol: string;
    type: string;
    lots: number;
    openPrice: number;
    stopLoss: number;
    takeProfit: number;
    openTime: string;
    comment: string;
}

export interface BridgeQuote {
    symbol: string;
    bid: number;
    ask: number;
    spreadPips: number;
    time: string;
}

export interface BridgeCandle {
    time: number; // Unix seconds
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface BridgeSymbolSummary {
    symbol: string;
    openCount: number;
    buyLots: number;
    sellLots: number;
    totalLots: number;
    floatingPnl: number;
    bid: number;
    ask: number;
}

export interface BridgeAccountState {
    login: number;
    server: string;
    companyName: string;
    accountName: string;
    currency: string;
    leverage: number;
    isInvestor: boolean;
    isDemo: boolean;
    connected: boolean;
    status: string;
    latencyMs: number;
    datacenter: string;
    balance: number;
    credit: number;
    equity: number;
    floatingPnl: number;
    floatingPnlPercent: number;
    margin: number;
    freeMargin: number;
    marginLevel: number;
    openCount: number;
    totalLots: number;
    dailyLossLimitPercent: number;
    dailyProfitTargetPercent: number;
    openPositions: BridgePosition[];
    pendingOrders: BridgePendingOrder[];
    symbolSummaries: BridgeSymbolSummary[];
    armedRules: BridgeArmedRule[];
    recentActivity: BridgeActivityItem[];
    activeQuote?: BridgeQuote | null;
    candles: BridgeCandle[];
    lastUpdateUtc: string;
    errorMessage?: string | null;
}

export interface BridgeExecuteResult {
    success: boolean;
    action: string;
    movedOrClosed: number;
    skipped: number;
    message: string;
    activity: BridgeActivityItem;
    state?: BridgeAccountState | null;
}

export interface CloudAccountSummary {
    id: string;
    name: string;
    accountNumber: string;
    broker: string;
    server: string;
    balance: number;
    equity: number;
    currency: string;
    status: string;
    isUnderIb: boolean;
    accessExpiresAt: string | null;
    lastHeartbeat: string | null;
    hasStoredCredential: boolean;
    isMain?: boolean;
}

export interface BridgeHealth {
    status: "ONLINE" | "OFFLINE";
    uptimeSeconds: number;
    memoryMb: number;
    connectedAccounts: number;
    totalAccounts: number;
    armedRulesCount: number;
    totalLiveEquity: number;
    totalFloatingPnl: number;
    version: string;
    mt5Build: number;
    timestampUtc: string;
}

export interface BridgeAdminConnection {
    login: number;
    server: string;
    companyName: string;
    accountName: string;
    currency: string;
    isDemo: boolean;
    isInvestor: boolean;
    connected: boolean;
    status: string;
    latencyMs: number;
    datacenter: string;
    balance: number;
    equity: number;
    floatingPnl: number;
    floatingPnlPercent: number;
    marginLevel: number;
    freeMargin: number;
    openPositionsCount: number;
    totalLots: number;
    armedRulesCount: number;
    armedRules: BridgeArmedRule[];
    recentActivity: BridgeActivityItem[];
    accountId?: string | null;
    userId?: string | null;
    userName?: string | null;
    userEmail?: string | null;
    isUnderIb: boolean;
    accessExpiresAt?: string | null;
    connectedAtUtc: string;
    lastQuoteUtc: string;
    errorMessage?: string | null;
}
