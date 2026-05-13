"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface AccountProStatus {
  tradingAccountId: string;
  accountName: string;
  broker: string | null;
  status: string;
  isPro: boolean;
  source: string | null;
  expiresAt: string | null;
}

interface ProState {
  isPro: boolean;
  status: string;
  source: string | null;
  expiresAt: string | null;
  loading: boolean;
  activeAccountCount: number;
  accounts: AccountProStatus[];
  mainAccountId: string | null;
}

interface ProContextValue extends ProState {
  refetch: () => void;
  getAccountStatus: (accountId: string) => AccountProStatus | null;
}

export interface InitialProStatus {
  isPro: boolean;
  status: string;
  source: string | null;
  expiresAt: string | null;
  activeAccountCount: number;
  accounts: AccountProStatus[];
  mainAccountId: string | null;
}

const ProContext = createContext<ProContextValue>({
  isPro: false,
  status: "NONE",
  source: null,
  expiresAt: null,
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
    // If we have SSR data, skip the loading flash
    loading: !initialProStatus,
    activeAccountCount: initialProStatus?.activeAccountCount ?? 0,
    accounts: initialProStatus?.accounts ?? [],
    mainAccountId: initialProStatus?.mainAccountId ?? null,
  });

  const pathname = usePathname();

  // Fix 1: Exponential backoff retry — covers transient 401/network errors
  const fetchProStatus = useCallback(() => {
    let attempts = 0;

    function attempt() {
      fetch("/api/pro-status")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          setState({
            isPro: data.isPro || false,
            status: data.status || "NONE",
            source: data.source || null,
            expiresAt: data.expiresAt || null,
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
            setTimeout(attempt, RETRY_BASE_MS * attempts);
          } else {
            setState((prev) => ({ ...prev, loading: false }));
          }
        });
    }

    attempt();
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchProStatus();
  }, [fetchProStatus]);

  // Fix 2: Refetch on client-side route change (ProProvider stays mounted across pages)
  useEffect(() => {
    fetchProStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Re-fetch when tab regains focus (covers same-window tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchProStatus();
      }
    };
    // window.focus catches admin actions done in a different browser tab
    const handleFocus = () => fetchProStatus();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchProStatus]);

  // Poll every 30s (visible tab only) — background guard for long-lived sessions
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchProStatus();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchProStatus]);

  const getAccountStatus = useCallback(
    (accountId: string): AccountProStatus | null => {
      return state.accounts.find((a) => a.tradingAccountId === accountId) || null;
    },
    [state.accounts]
  );

  const value: ProContextValue = {
    ...state,
    refetch: fetchProStatus,
    getAccountStatus,
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}
