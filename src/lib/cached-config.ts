/**
 * Cached API fetches — module-level singleton promises
 * Ensures each API is called only ONCE per page load,
 * even with React StrictMode double-mounts.
 */

// ============================================================================
// SYSTEM CONFIG
// ============================================================================
export interface SystemConfig {
    feedbackEnabled: boolean;
    maintenanceMode: boolean;
    requireEmailVerification: boolean;
    systemAnnouncement: string;
}

const DEFAULT_CONFIG: SystemConfig = {
    feedbackEnabled: true,
    maintenanceMode: false,
    requireEmailVerification: false,
    systemAnnouncement: "",
};

let configPromise: Promise<SystemConfig> | null = null;

export function fetchSystemConfig(): Promise<SystemConfig> {
    if (configPromise) return configPromise;

    configPromise = fetch("/api/system/config")
        .then(res => res.json())
        .then(data => ({
            feedbackEnabled: data.feedbackEnabled ?? true,
            maintenanceMode: data.maintenanceMode ?? false,
            requireEmailVerification: data.requireEmailVerification ?? false,
            systemAnnouncement: data.systemAnnouncement || "",
        }))
        .catch(() => DEFAULT_CONFIG);

    return configPromise;
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================
let flagsPromise: Promise<Set<string>> | null = null;

export function fetchFeatureFlags(flagKeys: string[]): Promise<Set<string>> {
    if (flagsPromise) return flagsPromise;
    if (flagKeys.length === 0) return Promise.resolve(new Set());

    flagsPromise = fetch(`/api/feature-flags?keys=${flagKeys.join(",")}`)
        .then(res => res.json())
        .then(data => {
            const disabled = new Set<string>();
            for (const [key, enabled] of Object.entries(data.flags || {})) {
                if (!enabled) disabled.add(key);
            }
            return disabled;
        })
        .catch(() => new Set<string>());

    return flagsPromise;
}

// ============================================================================
// TRADING ACCOUNTS
// ============================================================================
export interface CachedAccount {
    id: string;
    name: string;
    broker: string | null;
    balance: number;
    currency: string;
    isDefault: boolean;
    accountNumber: string;
    platform?: string;
    accountType?: string;
}

let accountsPromise: Promise<CachedAccount[]> | null = null;

export function fetchTradingAccounts(): Promise<CachedAccount[]> {
    if (accountsPromise) return accountsPromise;

    accountsPromise = fetch("/api/trading-accounts")
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch accounts");
            return res.json();
        })
        .then(data => {
            const accs = Array.isArray(data) ? data : (data.accounts || []);
            return accs;
        })
        .catch(() => []);

    return accountsPromise;
}

/** Invalidate accounts cache (e.g. after creating/deleting an account) */
export function invalidateAccountsCache() {
    accountsPromise = null;
}
