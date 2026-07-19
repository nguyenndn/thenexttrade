"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
    type ReactNode,
} from "react";
import { dashboardMenuItems, dashboardMenuGroups } from "@/config/navigation";

// ============================================================================
// TYPES
// ============================================================================
interface FeatureFlagsState {
    disabledFlags: Set<string>;
    loaded: boolean;
}

interface SystemConfigState {
    feedbackEnabled: boolean;
    systemAnnouncement: string;
    loaded: boolean;
}

interface DashboardContextValue {
    featureFlags: FeatureFlagsState;
    systemConfig: SystemConfigState;
    hasTradeData: boolean;
    hasTradeDataLoaded: boolean;
}

const DEFAULT_SYSTEM_CONFIG = {
    feedbackEnabled: true,
    systemAnnouncement: "",
};

async function loadFeatureFlags(flagKeys: string[]): Promise<Set<string>> {
    if (flagKeys.length === 0) return new Set();

    try {
        const res = await fetch(
            `/api/feature-flags?keys=${encodeURIComponent(flagKeys.join(","))}`
        );
        if (!res.ok) return new Set();

        const data = await res.json();
        const disabled = new Set<string>();
        for (const [key, enabled] of Object.entries(data.flags || {})) {
            if (!enabled) disabled.add(key);
        }
        return disabled;
    } catch {
        return new Set();
    }
}

// =============================================================================
// SYSTEM CONFIG LOADER (module-level singleton + 60s TTL cache)
// Prevents duplicate /api/system/config fetches from StrictMode double-mounts
// =============================================================================
const SYSTEM_CONFIG_CACHE_TTL_MS = 60_000;

let systemConfigCache: {
    value: typeof DEFAULT_SYSTEM_CONFIG;
    expiresAt: number;
} | null = null;

let systemConfigInflight: Promise<typeof DEFAULT_SYSTEM_CONFIG> | null = null;

async function loadSystemConfig(options?: {
    force?: boolean;
}): Promise<typeof DEFAULT_SYSTEM_CONFIG> {
    const now = Date.now();

    // Return cached value if still valid
    if (
        !options?.force &&
        systemConfigCache &&
        systemConfigCache.expiresAt > now
    ) {
        return systemConfigCache.value;
    }

    // Return inflight promise to dedupe concurrent calls
    if (!options?.force && systemConfigInflight) {
        return systemConfigInflight;
    }

    systemConfigInflight = fetch("/api/system/config")
        .then(async (res) => {
            if (!res.ok) return DEFAULT_SYSTEM_CONFIG;
            const data = await res.json();
            return {
                feedbackEnabled: data.feedbackEnabled ?? true,
                systemAnnouncement: data.systemAnnouncement || "",
            };
        })
        .catch(() => DEFAULT_SYSTEM_CONFIG)
        .then((value) => {
            systemConfigCache = {
                value,
                expiresAt: Date.now() + SYSTEM_CONFIG_CACHE_TTL_MS,
            };
            return value;
        })
        .finally(() => {
            systemConfigInflight = null;
        });

    return systemConfigInflight;
}

// ============================================================================
// CONTEXT
// ============================================================================
const DashboardContext = createContext<DashboardContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================
export function DashboardProvider({ children }: { children: ReactNode }) {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlagsState>({
        disabledFlags: new Set(),
        loaded: false,
    });
    const [systemConfig, setSystemConfig] = useState<SystemConfigState>({
        feedbackEnabled: true,
        systemAnnouncement: "",
        loaded: false,
    });
    const [hasTradeData, setHasTradeData] = useState(true); // Default to true to avoid flash
    const [hasTradeDataLoaded, setHasTradeDataLoaded] = useState(false);

    // Fetch feature flags ONCE (singleton survives StrictMode double-mount)
    useEffect(() => {
        // Collect all feature flags from both menu items and menu groups
        const flagSet = new Set<string>();
        for (const item of dashboardMenuItems) {
            if ((item as any).featureFlag)
                flagSet.add((item as any).featureFlag);
        }
        for (const group of dashboardMenuGroups) {
            for (const item of group.items) {
                if ((item as any).featureFlag)
                    flagSet.add((item as any).featureFlag);
            }
        }

        const flagKeys = Array.from(flagSet);
        if (flagKeys.length === 0) {
            setFeatureFlags({ disabledFlags: new Set(), loaded: true });
            return;
        }

        loadFeatureFlags(flagKeys).then((disabled) => {
            setFeatureFlags({ disabledFlags: disabled, loaded: true });
        });
    }, []);

    // Fetch system config ONCE (shared singleton with other components)
    useEffect(() => {
        loadSystemConfig().then((data) => {
            setSystemConfig({
                feedbackEnabled: data.feedbackEnabled,
                systemAnnouncement: data.systemAnnouncement,
                loaded: true,
            });
        });
    }, []);

    // Fetch trade data status (lightweight count check)
    useEffect(() => {
        fetch("/api/user/has-trade-data")
            .then((res) => res.json())
            .then((data) => {
                setHasTradeData(!!data.hasTradeData);
                setHasTradeDataLoaded(true);
            })
            .catch(() => {
                setHasTradeDataLoaded(true);
            });
    }, []);

    const value = useMemo<DashboardContextValue>(
        () => ({
            featureFlags,
            systemConfig,
            hasTradeData,
            hasTradeDataLoaded,
        }),
        [featureFlags, systemConfig, hasTradeData, hasTradeDataLoaded]
    );

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================
export function useFeatureFlags() {
    const ctx = useContext(DashboardContext);
    if (!ctx) {
        // Fallback for components outside provider (shouldn't happen in dashboard)
        return { disabledFlags: new Set<string>(), loaded: true };
    }
    return ctx.featureFlags;
}

export function useSystemConfig() {
    const ctx = useContext(DashboardContext);
    if (!ctx) {
        return { feedbackEnabled: true, systemAnnouncement: "", loaded: true };
    }
    return ctx.systemConfig;
}

export function useHasTradeData() {
    const ctx = useContext(DashboardContext);
    if (!ctx) {
        return { hasTradeData: true, loaded: true };
    }
    return { hasTradeData: ctx.hasTradeData, loaded: ctx.hasTradeDataLoaded };
}
