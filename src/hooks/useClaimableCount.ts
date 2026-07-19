"use client";

import { useEffect, useState } from "react";

// =============================================================================
// Module-level singleton to prevent duplicate fetches across components.
// Both Sidebar (desktop) and MobileBottomTabBar (mobile) consume this hook,
// but only ONE network request is made at a time.
// =============================================================================

const POLL_INTERVAL_MS = 60_000;

let sharedCount = 0;
let listeners: Set<() => void> = new Set();
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let inflightPromise: Promise<void> | null = null;

function notify() {
    listeners.forEach((cb) => cb());
}

async function fetchClaimableCount(): Promise<void> {
    // Dedupe concurrent calls
    if (inflightPromise) return inflightPromise;

    inflightPromise = fetch("/api/missions/claimable-count")
        .then(async (res) => {
            if (res.ok) {
                const data = await res.json();
                const newCount = data.count || 0;
                if (newCount !== sharedCount) {
                    sharedCount = newCount;
                    notify();
                }
            }
        })
        .catch(() => {
            /* silent */
        })
        .finally(() => {
            inflightPromise = null;
        });

    return inflightPromise;
}

function startPolling() {
    if (pollingTimer) return;
    fetchClaimableCount();
    pollingTimer = setInterval(fetchClaimableCount, POLL_INTERVAL_MS);
}

function stopPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
}

/**
 * Shared hook for claimable mission count.
 * Multiple components can call this hook — only one fetch + poll loop runs.
 */
export function useClaimableCount(): number {
    const [count, setCount] = useState(sharedCount);

    useEffect(() => {
        // Sync with current shared value on mount
        setCount(sharedCount);

        const listener = () => setCount(sharedCount);
        listeners.add(listener);

        // Start polling when first subscriber appears
        if (listeners.size === 1) {
            startPolling();
        }

        return () => {
            listeners.delete(listener);
            // Stop polling when last subscriber unmounts
            if (listeners.size === 0) {
                stopPolling();
            }
        };
    }, []);

    return count;
}

/**
 * Force an immediate refresh of the claimable count.
 * Call this after a user claims a mission to update badges instantly.
 */
export function refreshClaimableCount() {
    fetchClaimableCount();
}
