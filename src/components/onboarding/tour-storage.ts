import type { DashboardTourState } from "@/lib/onboarding/tour-state";

const LOCAL_STORAGE_KEY = "tnt_dashboard_tour_v1";
const SESSION_SHOWN_KEY = "tnt_dashboard_tour_session_shown";

export function readLocalTourState(
    fallback: DashboardTourState
): DashboardTourState {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Partial<DashboardTourState>;
        return {
            completed: Boolean(parsed.completed || fallback.completed),
            views: Math.max(
                fallback.views,
                typeof parsed.views === "number" ? parsed.views : 0
            ),
        };
    } catch {
        return fallback;
    }
}

export function persistTourState(next: DashboardTourState): void {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Ignore storage errors
    }
    fetch("/api/profile/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardTour: next }),
    }).catch(() => {});
}

export function hasShownTourInSession(): boolean {
    try {
        return sessionStorage.getItem(SESSION_SHOWN_KEY) === "1";
    } catch {
        return false;
    }
}

export function markTourShownInSession(): void {
    try {
        sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
    } catch {
        // Ignore storage errors
    }
}
