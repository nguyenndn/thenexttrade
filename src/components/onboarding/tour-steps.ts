export type TourPlacement = "right" | "bottom" | "left" | "top";

export interface DashboardTourStep {
    id: string;
    selector: string;
    fallbackSelector?: string;
    title: string;
    description: string;
    mobileTitle?: string;
    mobileDescription?: string;
    placement: TourPlacement;
    padding?: number;
}

export const DASHBOARD_TOUR_STEPS: DashboardTourStep[] = [
    {
        id: "menu-overview",
        selector: '[data-tour="sidebar-menu"]',
        fallbackSelector: '[data-tour="mobile-bottom-nav"]',
        title: "Everything is in this one menu",
        description:
            "Your entire workspace lives down the left, grouped in the exact order you trade: connect accounts, execute your playbook, audit performance, and grow.",
        mobileTitle: "Everything is in this bottom bar",
        mobileDescription:
            "Tap any group along the bottom bar to switch between Dashboard, Journal, Analytics, Academy, Systems, and Rewards.",
        placement: "right",
        padding: 6,
    },
    {
        id: "group-operations",
        selector: '[data-tour="sidebar-group-operations"]',
        title: "Dashboard and Accounts & Props",
        description:
            "Dashboard is your daily command center — live equity, recent executions, and what to fix next. Accounts & Props connects your MT5 accounts via Cloud Sync or EA.",
        placement: "right",
        padding: 4,
    },
    {
        id: "group-playbook",
        selector: '[data-tour="sidebar-group-playbook"]',
        title: "Playbook & Execution",
        description:
            "Every closed MT5 trade syncs automatically into Trading Journal. Tag setups in Strategies and enforce hard stop-loss and daily drawdown limits in Rules.",
        placement: "right",
        padding: 4,
    },
    {
        id: "group-performance",
        selector: '[data-tour="sidebar-group-performance"]',
        title: "Performance & Behavioral Leak Radar",
        description:
            "Analytics Hub tracks session expectancy, symbol edge, tilt patterns, and generates weekly and monthly trading reviews from real execution telemetry.",
        placement: "right",
        padding: 4,
    },
    {
        id: "group-growth",
        selector: '[data-tour="sidebar-group-growth"]',
        title: "Growth, Systems & Rewards",
        description:
            "Work through structured lessons in Academy, compete on verified Leaderboards, download tools in MT5 Systems & EAs, and claim milestone payouts in Loyalty.",
        placement: "right",
        padding: 4,
    },
    {
        id: "header-tools",
        selector: '[data-tour="header-tools"]',
        title: "Quick Search & Sample Data",
        description:
            "Press Ctrl+K to jump to any tool, toggle Sample Data to inspect a populated trading account right away, and check system alerts from the notification bell.",
        placement: "bottom",
        padding: 6,
    },
    {
        id: "action-center",
        selector: '[data-tour="dashboard-action-center"]',
        fallbackSelector: "#onborda-hero",
        title: "Then just work down your next steps",
        description:
            "Follow this setup path in order — connect your first MT5 account or turn on Sample Data, and your live risk metrics and equity curve will populate automatically.",
        placement: "bottom",
        padding: 8,
    },
];

function isVisibleElement(el: Element | null): el is HTMLElement {
    if (!(el instanceof HTMLElement)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
}

export interface ResolvedTourStep extends DashboardTourStep {
    activeSelector: string;
    isFallback: boolean;
}

export function resolveVisibleTourSteps(): ResolvedTourStep[] {
    if (typeof document === "undefined") return [];
    const resolved: ResolvedTourStep[] = [];

    for (const step of DASHBOARD_TOUR_STEPS) {
        const primary = document.querySelector(step.selector);
        if (isVisibleElement(primary)) {
            resolved.push({
                ...step,
                activeSelector: step.selector,
                isFallback: false,
            });
            continue;
        }

        if (step.fallbackSelector) {
            const fallback = document.querySelector(step.fallbackSelector);
            if (isVisibleElement(fallback)) {
                resolved.push({
                    ...step,
                    activeSelector: step.fallbackSelector,
                    isFallback: true,
                    placement:
                        step.fallbackSelector ===
                        '[data-tour="mobile-bottom-nav"]'
                            ? "top"
                            : step.placement,
                });
            }
        }
    }

    return resolved;
}
