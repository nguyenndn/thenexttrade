"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export interface TrialInfo {
    isTrial: boolean;
    daysRemaining: number;
    trialEndsAt: string;
}

export interface ActivityInfo {
    rolling30dLots: number;
    minLotsRequired: number;
    daysSinceLastTrade: number | null;
    lastTradeAt: string | null;
    policyState: "ACTIVE" | "WARNED" | "PAUSED";
    reason?: string;
}

export interface FundingInfo {
    verified: boolean;
    verifiedAt: string | null;
    lastVerifiedAt: string | null;
    graceUntil: string | null;
    amount: number | null;
    inGrace: boolean;
    expired: boolean;
}

interface AccountProStatus {
    tradingAccountId: string;
    accountName: string;
    broker: string | null;
    status: string;
    isPro: boolean;
    source: string | null;
    expiresAt: string | null;
    policyState?: "ACTIVE" | "WARNED" | "PAUSED";
    rolling30dLots?: number;
    daysSinceLastTrade?: number | null;
    fundingVerified?: boolean;
}

interface ProState {
    isPro: boolean;
    status: string;
    source: string | null;
    expiresAt: string | null;
    policyState: "ACTIVE" | "WARNED" | "PAUSED";
    trialInfo: TrialInfo | null;
    activityInfo: ActivityInfo | null;
    fundingInfo: FundingInfo | null;
    loading: boolean;
    activeAccountCount: number;
    accounts: AccountProStatus[];
    mainAccountId: string | null;
}

interface ProContextValue extends ProState {
    refetch: (force?: boolean) => void;
    getAccountStatus: (accountId: string) => AccountProStatus | null;
}

export interface InitialProStatus {
    isPro: boolean;
    status: string;
    source: string | null;
    expiresAt: string | null;
    policyState?: "ACTIVE" | "WARNED" | "PAUSED";
    trialInfo?: TrialInfo | null;
    activityInfo?: ActivityInfo | null;
    fundingInfo?: FundingInfo | null;
    activeAccountCount: number;
    accounts: AccountProStatus[];
    mainAccountId: string | null;
}

const ProContext = createContext<ProContextValue>({
    isPro: false,
    status: "NONE",
    source: null,
    expiresAt: null,
    policyState: "ACTIVE",
    trialInfo: null,
    activityInfo: null,
    fundingInfo: null,
    loading: true,
    activeAccountCount: 0,
    accounts: [],
    mainAccountId: null,
    refetch: () => {},
    getAccountStatus: () => null,
});

export function useProAccess() {
    return useContext(ProContext);
}

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2_000;
const STALE_TIME_MS = 2 * 60 * 1000; // 2 minutes cooldown for route/focus triggers
const BACKGROUND_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes background guard

interface ProProviderProps {
    children: ReactNode;
    initialProStatus?: InitialProStatus | null;
}

export function ProProvider({ children, initialProStatus }: ProProviderProps) {
    const [state, setState] = useState<ProState>({
        isPro: initialProStatus?.isPro ?? false,
        status: initialProStatus?.status ?? "NONE",
        source: initialProStatus?.source ?? null,
        expiresAt: initialProStatus?.expiresAt ?? null,
        policyState: initialProStatus?.policyState ?? "ACTIVE",
        trialInfo: initialProStatus?.trialInfo ?? null,
        activityInfo: initialProStatus?.activityInfo ?? null,
        fundingInfo: initialProStatus?.fundingInfo ?? null,
        // If we have SSR data, skip the loading flash
        loading: !initialProStatus,
        activeAccountCount: initialProStatus?.activeAccountCount ?? 0,
        accounts: initialProStatus?.accounts ?? [],
        mainAccountId: initialProStatus?.mainAccountId ?? null,
    });

    const pathname = usePathname();
    const inFlightRef = useRef(false);
    const pendingForceRef = useRef(false);
    const lastFetchedAtRef = useRef<number>(initialProStatus ? Date.now() : 0);
    const hasSeenFirstPathnameRef = useRef(false);
    const isInitialSsrPropRef = useRef(true);

    // Sync fresh SSR props when router.refresh() re-runs DashboardLayout
    useEffect(() => {
        if (isInitialSsrPropRef.current) {
            isInitialSsrPropRef.current = false;
            return;
        }
        if (!initialProStatus) return;

        lastFetchedAtRef.current = Date.now();
        setState({
            isPro: initialProStatus.isPro ?? false,
            status: initialProStatus.status ?? "NONE",
            source: initialProStatus.source ?? null,
            expiresAt: initialProStatus.expiresAt ?? null,
            policyState: initialProStatus.policyState ?? "ACTIVE",
            trialInfo: initialProStatus.trialInfo ?? null,
            activityInfo: initialProStatus.activityInfo ?? null,
            fundingInfo: initialProStatus.fundingInfo ?? null,
            loading: false,
            activeAccountCount: initialProStatus.activeAccountCount ?? 0,
            accounts: initialProStatus.accounts ?? [],
            mainAccountId: initialProStatus.mainAccountId ?? null,
        });
    }, [initialProStatus]);

    // Deduplicated fetch with staleTime cooldown + exponential backoff retry
    const fetchProStatus = useCallback((force: boolean = false) => {
        if (inFlightRef.current) {
            if (force) {
                pendingForceRef.current = true;
            }
            return;
        }

        if (
            !force &&
            lastFetchedAtRef.current > 0 &&
            Date.now() - lastFetchedAtRef.current < STALE_TIME_MS
        ) {
            return;
        }

        inFlightRef.current = true;
        let attempts = 0;

        function attempt() {
            let retrying = false;
            fetch("/api/pro-status")
                .then((r) => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .then((data) => {
                    lastFetchedAtRef.current = Date.now();
                    setState({
                        isPro: data.isPro || false,
                        status: data.status || "NONE",
                        source: data.source || null,
                        expiresAt: data.expiresAt || null,
                        policyState: data.policyState || "ACTIVE",
                        trialInfo: data.trialInfo || null,
                        activityInfo: data.activityInfo || null,
                        fundingInfo: data.fundingInfo || null,
                        loading: false,
                        activeAccountCount: data.activeAccountCount || 0,
                        accounts: data.accounts || [],
                        mainAccountId: data.mainAccountId || null,
                    });
                })
                .catch(() => {
                    attempts++;
                    if (attempts < MAX_RETRIES) {
                        // 2s, 4s, 6s backoff — fits within 12s test timeout
                        retrying = true;
                        setTimeout(attempt, RETRY_BASE_MS * attempts);
                        return;
                    }
                    setState((prev) => ({ ...prev, loading: false }));
                })
                .finally(() => {
                    if (!retrying) {
                        inFlightRef.current = false;
                        if (pendingForceRef.current) {
                            pendingForceRef.current = false;
                            fetchProStatus(true);
                        }
                    }
                });
        }

        attempt();
    }, []);

    // Fetch on mount ONLY when SSR did not already supply initialProStatus
    useEffect(() => {
        if (!initialProStatus) {
            fetchProStatus(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Revalidate on client-side route change only when stale (> 2m)
    useEffect(() => {
        if (!hasSeenFirstPathnameRef.current) {
            hasSeenFirstPathnameRef.current = true;
            return;
        }
        fetchProStatus(false);
    }, [pathname, fetchProStatus]);

    // Revalidate when tab regains focus only when stale (> 2m), deduped in-flight
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchProStatus(false);
            }
        };
        const handleFocus = () => fetchProStatus(false);

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);
        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            window.removeEventListener("focus", handleFocus);
        };
    }, [fetchProStatus]);

    // Background poll every 5 minutes (visible tab only) for long-lived sessions
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchProStatus(false);
            }
        }, BACKGROUND_POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchProStatus]);

    const refetch = useCallback(
        (force: boolean = true) => {
            fetchProStatus(force);
        },
        [fetchProStatus]
    );

    const getAccountStatus = useCallback(
        (accountId: string): AccountProStatus | null => {
            return (
                state.accounts.find((a) => a.tradingAccountId === accountId) ||
                null
            );
        },
        [state.accounts]
    );

    const value: ProContextValue = {
        ...state,
        refetch,
        getAccountStatus,
    };

    return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}
