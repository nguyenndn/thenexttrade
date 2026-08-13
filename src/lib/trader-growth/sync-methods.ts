import { SupportedSyncMethod } from "./types";

export const SUPPORTED_SYNC_METHODS: SupportedSyncMethod[] = [
    {
        id: "TRADE_MANAGER_EA",
        enabled: true,
        label: "MetaTrader 5 TradeSync EA",
        setupHref: "/dashboard/accounts",
        supportsMobileSetup: false,
        description: "Automated 100% real-time trade sync via MetaTrader 5 Expert Advisor.",
    },
    {
        id: "MANUAL_JOURNAL",
        enabled: true,
        label: "Manual Trading Journal",
        setupHref: "/dashboard/journal",
        supportsMobileSetup: true,
        description: "Log trades manually with risk, psychology, and screenshot tagging.",
    },
];

export function getSupportedSyncMethod(id: string): SupportedSyncMethod | undefined {
    return SUPPORTED_SYNC_METHODS.find((m) => m.id === id);
}
