"use client";

import { useMemo } from "react";

/** Read last_account_id cookie and return a pre-built dashboard URL to skip the redirect hop. */
export function useDashboardUrl(): string {
    return useMemo(() => {
        if (typeof document === "undefined") return "/dashboard";
        const match = document.cookie.match(
            /(?:^|;\s*)last_account_id=([^;]+)/
        );
        const accountId = match?.[1];
        if (!accountId) return "/dashboard";
        return `/dashboard?accountId=${accountId}`;
    }, []);
}
