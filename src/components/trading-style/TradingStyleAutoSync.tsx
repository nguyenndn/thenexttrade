"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveTradingStyleResult } from "@/actions/trading-style";

interface TradingStyleAutoSyncProps {
    userId?: string | null;
}

/**
 * Checks for guest trading style quiz results in localStorage (`tnt_pending_trading_style`).
 * Once an authenticated session is detected in the dashboard layout, automatically persists
 * the diagnosis to the user profile and cleans up localStorage.
 */
export function TradingStyleAutoSync({ userId }: TradingStyleAutoSyncProps) {
    const isSyncingRef = useRef(false);

    useEffect(() => {
        if (!userId || isSyncingRef.current) return;

        try {
            const raw = localStorage.getItem("tnt_pending_trading_style");
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (!parsed?.answers || typeof parsed.answers !== "object") {
                localStorage.removeItem("tnt_pending_trading_style");
                return;
            }

            isSyncingRef.current = true;
            saveTradingStyleResult({ answers: parsed.answers })
                .then((res) => {
                    if (res && "success" in res && res.success) {
                        toast.success(
                            "Your trading style diagnosis has been saved to your profile!"
                        );
                        localStorage.removeItem("tnt_pending_trading_style");
                        localStorage.removeItem("tnt_signup_intent");
                    }
                })
                .catch((err) => {
                    console.error("[TradingStyleAutoSync] Failed to sync:", err);
                })
                .finally(() => {
                    isSyncingRef.current = false;
                });
        } catch (e) {
            console.error("[TradingStyleAutoSync] Storage parse error:", e);
        }
    }, [userId]);

    return null;
}
