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

const CORE_FEATURE_FLAGS = [
    "feature_academy",
    "feature_loyalty",
    "feature_competitions",
] as const;

function collectMenuFlagKeys(): Set<string> {
    const flagSet = new Set<string>();
    for (const item of dashboardMenuItems) {
        if ((item as { featureFlag?: string }).featureFlag) {
            flagSet.add((item as { featureFlag: string }).featureFlag);
        }
    }
    for (const group of dashboardMenuGroups) {
        for (const item of group.items) {
            if ((item as { featureFlag?: string }).featureFlag) {
                flagSet.add((item as { featureFlag: string }).featureFlag);
            }
        }
    }
    return flagSet;
}

function collectAllFeatureFlagKeys(): string[] {
    const flagSet = collectMenuFlagKeys();
    for (const key of CORE_FEATURE_FLAGS) {
        flagSet.add(key);
    }
    return Array.from(flagSet);
}

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
export function DashboardProvider({
    children,
    initialDisabledFlags,
}: {
    children: ReactNode;
    initialDisabledFlags?: string[];
}) {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlagsState>(() => ({
        disabledFlags: new Set(initialDisabledFlags ?? []),
        loaded: initialDisabledFlags !== undefined,
    }));
    const [systemConfig, setSystemConfig] = useState<SystemConfigState>({
        feedbackEnabled: true,
        systemAnnouncement: "",
        loaded: false,
    });
    const [hasTradeData, setHasTradeData] = useState(true); // Default to true to avoid flash
    const [hasTradeDataLoaded, setHasTradeDataLoaded] = useState(false);

    const serializedInitialDisabled =
        initialDisabledFlags !== undefined
            ? initialDisabledFlags.join(",")
            : undefined;

    useEffect(() => {
        if (serializedInitialDisabled === undefined) return;
        const nextDisabled = serializedInitialDisabled
            ? serializedInitialDisabled.split(",").filter(Boolean)
            : [];
        setFeatureFlags((prev) => {
            const merged = new Set(nextDisabled);
            const menuFlagSet = collectMenuFlagKeys();
            for (const existing of prev.disabledFlags) {
                if (!menuFlagSet.has(existing)) {
                    merged.add(existing);
                }
            }
            return {
                disabledFlags: merged,
                loaded: true,
            };
        });
    }, [serializedInitialDisabled]);

    // Fetch feature flags (or non-menu core flags when server-seeded) and refresh when "feature-flags-updated" is dispatched
    useEffect(() => {
        const refreshAllFlags = () => {
            const flagKeys = collectAllFeatureFlagKeys();
            if (flagKeys.length === 0) {
                setFeatureFlags({ disabledFlags: new Set(), loaded: true });
                return;
            }

            loadFeatureFlags(flagKeys).then((disabled) => {
                setFeatureFlags({ disabledFlags: disabled, loaded: true });
            });
        };

        if (serializedInitialDisabled === undefined) {
            refreshAllFlags();
        } else {
            const menuFlagSet = collectMenuFlagKeys();
            const unseededKeys = CORE_FEATURE_FLAGS.filter(
                (k) => !menuFlagSet.has(k)
            );
            if (unseededKeys.length > 0) {
                loadFeatureFlags([...unseededKeys]).then((disabledSubset) => {
                    setFeatureFlags((prev) => {
                        const merged = new Set(prev.disabledFlags);
                        for (const key of unseededKeys) {
                            if (disabledSubset.has(key)) {
                                merged.add(key);
                            } else {
                                merged.delete(key);
                            }
                        }
                        return { disabledFlags: merged, loaded: true };
                    });
                });
            }
        }
        window.addEventListener("feature-flags-updated", refreshAllFlags);
        return () => {
            window.removeEventListener("feature-flags-updated", refreshAllFlags);
        };
    }, [serializedInitialDisabled]);

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
    const disabledFlags = useMemo(
        () => (ctx ? ctx.featureFlags.disabledFlags : new Set<string>()),
        [ctx]
    );
    const loaded = ctx ? ctx.featureFlags.loaded : true;

    return useMemo(
        () => ({
            disabledFlags,
            loaded,
            isEnabled: (flag: string) => !disabledFlags.has(flag),
        }),
        [disabledFlags, loaded]
    );
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
