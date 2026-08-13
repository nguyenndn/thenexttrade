import {
    ToolAccessStatus,
    ToolAccessSource,
    ToolUsageEventType,
} from "@prisma/client";

export type VipFilterStatus =
    | "ALL"
    | "FREE"
    | "ACTIVE"
    | "GRACE"
    | "EXPIRING"
    | "REVOKED";

export type ToolStateFilter =
    | "ALL"
    | "NO_ACCESS"
    | "GRANTED"
    | "DOWNLOADED"
    | "RECENTLY_USED"
    | "ACTIVE"
    | "STALE"
    | "UNKNOWN_LEGACY";

export type AccountHealthFilter =
    | "ALL"
    | "CONNECTED"
    | "NO_TRADES"
    | "STALE"
    | "DISCONNECTED"
    | "NEVER_SYNCED";

export type AccountTypeFilter = "ALL" | "REAL" | "DEMO" | "UNKNOWN";

export type SyncSourceFilter =
    | "ALL"
    | "EA_SYNC"
    | "MANUAL"
    | "UNKNOWN";

export type CapitalBandFilter = "ALL" | "0_1K" | "1K_10K" | "10K_50K" | "50K_PLUS";

export type LastTradeFilter = "ALL" | "TODAY" | "7D" | "30D" | "NEVER";

export type TraderSortOption =
    | "NEWEST"
    | "CAPITAL_DESC"
    | "EQUITY_DESC"
    | "ACCOUNTS_DESC"
    | "LAST_ACTIVITY_DESC";

export interface IbTraderFilters {
    q?: string;
    vip?: VipFilterStatus;
    product?: "ALL" | string;
    toolState?: ToolStateFilter;
    broker?: "ALL" | string;
    accountHealth?: AccountHealthFilter;
    accountType?: AccountTypeFilter;
    syncSource?: SyncSourceFilter;
    capitalBand?: CapitalBandFilter;
    minAccounts?: number;
    maxAccounts?: number;
    lastTrade?: LastTradeFilter;
    sort?: TraderSortOption;
    page?: number;
    pageSize?: number;
}

export type ProductUsageState =
    | "NOT_USED"
    | "DOWNLOADED"
    | "RECENTLY_USED"
    | "ACTIVE"
    | "UNKNOWN_LEGACY";

export type ProductAccessState =
    | "NO_ACCESS"
    | "GRANTED"
    | "EXPIRED"
    | "REVOKED"
    | "LEGACY_PRO_FALLBACK";

export interface ProductUsageSummary {
    productId: string;
    productSlug: string;
    productName: string;
    accessState: ProductAccessState;
    usageState: ProductUsageState;
    lastDownloadedAt: string | null;
    lastUsedAt: string | null;
    lastHeartbeatAt: string | null;
}

export interface ExpandedTraderAccount {
    id: string;
    accountNumber: string;
    rawAccountNumber: string;
    broker: string;
    server: string | null;
    platform: string;
    currency: string;
    balance: number;
    equity: number;
    accountType: "REAL" | "DEMO" | "UNKNOWN";
    status: string;
    syncSource: string; // Raw
    syncSourceLabel: string; // Normalized label
    eaVersion: string | null;
    lastSync: string | null;
    lastHeartbeat: string | null;
    lastTrade: string | null;
    isFresh: boolean;
    isDuplicate: boolean;
    totalTrades: number;
}

export interface IbTraderRow {
    userId: string;
    userName: string;
    userEmail: string;
    country: string | null;
    vipStatus: "ACTIVE" | "GRACE" | "EXPIRED" | "REVOKED" | "NONE";
    vipExpiresAt: string | null;
    products: ProductUsageSummary[];
    registeredAccountCount: number;
    eligibleAccountCount: number;
    connectedAccountCount: number;
    activeTradingAccountCount: number;
    reportedCapitalByCurrency: Record<string, number>;
    freshCapitalByCurrency: Record<string, number>;
    reportedEquityByCurrency: Record<string, number>;
    isMixedCurrency: boolean;
    totalTrades30d: number;
    totalLotVolume30d: number;
    lastTradeAt: string | null;
    lastHeartbeatAt: string | null;
    dataFreshness: "FRESH" | "STALE" | "DISCONNECTED" | "MIXED";
    duplicateAccountCount: number;
    accounts: ExpandedTraderAccount[];
}

export interface IbTraderPaginatedResult {
    rows: IbTraderRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: {
        totalTradersInFilter: number;
        activeVipTraders: number;
        totalReportedCapitalUSD: number | null;
        totalFreshCapitalUSD: number | null;
        capitalCurrencyBreakdown: Record<string, number>;
        freshCapitalCurrencyBreakdown: Record<string, number>;
        connectedAccountsCount: number;
        staleAccountsCount: number;
        disconnectedAccountsCount: number;
        activeToolUsersCount: number;
        dataQualityWarningsCount: number;
        asOf: string;
    };
}

export type LifecycleStage =
    | "LEAD"
    | "SIGNED_UP"
    | "VERIFIED"
    | "ACCOUNT_CONNECTED"
    | "FIRST_SYNC"
    | "FIRST_TRADE"
    | "VIP_REQUESTED"
    | "VIP_APPROVED"
    | "TOOL_UNLOCKED"
    | "TOOL_ACTIVE"
    | "AT_RISK";

export interface IbPipelineItem {
    requestId: string;
    userId: string;
    userName: string;
    userEmail: string;
    country: string | null;
    telegramId: string;
    broker: string;
    accountNumber: string;
    rawAccountNumber: string;
    submittedBalance: string;
    linkedAccountId: string | null;
    liveBalance: number | null;
    liveEquity: number | null;
    liveCurrency: string | null;
    requestedProductSlug: string | null;
    vipStatus: "ACTIVE" | "GRACE" | "EXPIRED" | "REVOKED" | "NONE" | "PENDING";
    lifecycleStage: LifecycleStage;
    accountHealth: string;
    lastHeartbeatAt: string | null;
    requestAgeHours: number;
    createdAt: string;
    graceExpiresAt: string | null;
    adminNote: string | null;
    screenshotUrl: string | null;
}
