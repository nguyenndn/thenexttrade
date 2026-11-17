"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProAccess } from "./ProProvider";

export interface ResolvedProStatus {
    loading: boolean;
    currentStatus: string;
    isPro: boolean;
    expiresAt: string | null;
}

export function useResolvedProStatus(): ResolvedProStatus {
    const proAccess = useProAccess();
    const searchParams = useSearchParams();
    const currentAccountId = searchParams?.get("accountId") ?? undefined;
    const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

    const getCookie = useCallback((name: string) => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
    }, []);

    useEffect(() => {
        const urlAccountId = searchParams?.get("accountId");
        const cookieAccountId = getCookie("last_account_id");
        setActiveAccountId(
            urlAccountId || cookieAccountId || proAccess.mainAccountId || null
        );

        const handleAccountChange = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                setActiveAccountId(customEvent.detail);
            }
        };

        window.addEventListener("tnt_account_changed", handleAccountChange);
        return () => {
            window.removeEventListener(
                "tnt_account_changed",
                handleAccountChange
            );
        };
    }, [currentAccountId, proAccess.mainAccountId, searchParams, getCookie]);

    if (proAccess.loading) {
        return {
            loading: true,
            currentStatus: "NONE",
            isPro: false,
            expiresAt: null,
        };
    }

    const realAccounts = proAccess.accounts.filter(
        (a) => a.tradingAccountId && a.tradingAccountId !== ""
    );
    const validAccountFromActiveId = activeAccountId
        ? realAccounts.find((a) => a.tradingAccountId === activeAccountId)
        : null;
    const validMainAccount = proAccess.mainAccountId
        ? realAccounts.find(
              (a) => a.tradingAccountId === proAccess.mainAccountId
          )
        : null;

    const activeAccount =
        validAccountFromActiveId || validMainAccount || realAccounts[0] || null;

    const rawStatus = activeAccount
        ? activeAccount.status
        : proAccess.status || "NONE";

    const hasNoPartnerAccounts =
        proAccess.activityInfo?.reason ===
            "No trading accounts linked to supported partner brokers." ||
        (realAccounts.length > 0 &&
            realAccounts.every((a) => a.status === "NONE"));

    const currentStatus =
        hasNoPartnerAccounts || rawStatus === "NONE" || rawStatus === "REVOKED"
            ? "NONE"
            : rawStatus;

    const isPro =
        currentStatus === "NONE"
            ? false
            : activeAccount
              ? activeAccount.isPro
              : proAccess.isPro;

    const expiresAt = activeAccount
        ? activeAccount.expiresAt
        : proAccess.expiresAt;

    return {
        loading: false,
        currentStatus,
        isPro,
        expiresAt,
    };
}
