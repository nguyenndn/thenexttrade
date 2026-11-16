export interface DashboardTourState {
    completed: boolean;
    views: number;
    updatedAt?: string;
}

export const MAX_AUTO_TOUR_VIEWS = 3;

export const DEFAULT_DASHBOARD_TOUR_STATE: DashboardTourState = {
    completed: false,
    views: 0,
};

export function getDashboardTourState(settings: unknown): DashboardTourState {
    const raw =
        settings && typeof settings === "object"
            ? (settings as Record<string, unknown>).dashboardTour
            : undefined;

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { ...DEFAULT_DASHBOARD_TOUR_STATE };
    }

    const obj = raw as Record<string, unknown>;
    const completed =
        typeof obj.completed === "boolean" ? obj.completed : false;
    const rawViews = typeof obj.views === "number" ? obj.views : 0;
    const views = Number.isFinite(rawViews)
        ? Math.max(0, Math.floor(rawViews))
        : 0;
    const updatedAt =
        typeof obj.updatedAt === "string" ? obj.updatedAt : undefined;

    return {
        completed,
        views,
        ...(updatedAt ? { updatedAt } : {}),
    };
}

export function shouldAutoStartDashboardTour(
    state: DashboardTourState
): boolean {
    if (state.completed) return false;
    return state.views < MAX_AUTO_TOUR_VIEWS;
}
