import { describe, expect, it } from "vitest";
import {
    DEFAULT_DASHBOARD_TOUR_STATE,
    MAX_AUTO_TOUR_VIEWS,
    getDashboardTourState,
    shouldAutoStartDashboardTour,
} from "./tour-state";

describe("dashboard tour state", () => {
    it("falls back to default state when settings are missing or malformed", () => {
        expect(getDashboardTourState(undefined)).toEqual(
            DEFAULT_DASHBOARD_TOUR_STATE
        );
        expect(getDashboardTourState(null)).toEqual(
            DEFAULT_DASHBOARD_TOUR_STATE
        );
        expect(getDashboardTourState({ dashboardTour: "invalid" })).toEqual(
            DEFAULT_DASHBOARD_TOUR_STATE
        );
    });

    it("parses valid completed and views count accurately", () => {
        const parsed = getDashboardTourState({
            dashboardTour: {
                completed: false,
                views: 2,
                updatedAt: "2026-11-16T12:00:00.000Z",
            },
        });
        expect(parsed).toEqual({
            completed: false,
            views: 2,
            updatedAt: "2026-11-16T12:00:00.000Z",
        });
    });

    it("auto-starts only while incomplete and below max views threshold", () => {
        expect(shouldAutoStartDashboardTour({ completed: false, views: 0 })).toBe(
            true
        );
        expect(
            shouldAutoStartDashboardTour({
                completed: false,
                views: MAX_AUTO_TOUR_VIEWS - 1,
            })
        ).toBe(true);
        expect(
            shouldAutoStartDashboardTour({
                completed: false,
                views: MAX_AUTO_TOUR_VIEWS,
            })
        ).toBe(false);
        expect(shouldAutoStartDashboardTour({ completed: true, views: 1 })).toBe(
            false
        );
    });
});
