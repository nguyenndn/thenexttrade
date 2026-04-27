import type { Step } from "onborda";

// ============================
// DASHBOARD TOUR
// ============================
export const dashboardTour: { tour: string; steps: Step[] } = {
    tour: "dashboard-tour",
    steps: [
        {
            icon: <>👋</>,
            title: "Welcome to TheNextTrade!",
            content: (
                <p>
                    This is your <strong>Dashboard</strong> — the command center for all your trading activities. Let us show you around!
                </p>
            ),
            selector: "#onborda-greeting",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>📊</>,
            title: "Hero Stats",
            content: (
                <p>
                    Your most important metrics: <strong>Balance</strong>, <strong>Period P&L</strong>, <strong>Win Rate</strong>, and <strong>Trade Score</strong>.
                </p>
            ),
            selector: "#onborda-hero",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>📈</>,
            title: "Period Growth Chart",
            content: (
                <p>
                    Track your cumulative net profit over time. Use the <strong>date picker</strong> to change the period.
                </p>
            ),
            selector: "#onborda-chart",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>⚡</>,
            title: "Quick Stats & Distribution",
            content: (
                <p>
                    <strong>Profit Factor</strong>, <strong>Avg Win/Loss</strong>, plus profit and lot distribution by symbol.
                </p>
            ),
            selector: "#onborda-quickstats",
            side: "left",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>🧭</>,
            title: "Sidebar Navigation",
            content: (
                <p>
                    Access all features: <strong>Accounts</strong>, <strong>Journal</strong>, <strong>Analytics</strong>, <strong>Academy</strong>, and more.
                </p>
            ),
            selector: "#onborda-sidebar",
            side: "right",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>🎉</>,
            title: "You're All Set!",
            content: (
                <p>
                    Start by <strong>adding a trading account</strong> and importing your trades. Re-run this tour anytime via the <strong>Tour</strong> button.
                </p>
            ),
            selector: "#onborda-hero",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
    ],
};

// ============================
// ACCOUNTS TOUR
// ============================
export const accountsTour: { tour: string; steps: Step[] } = {
    tour: "accounts-tour",
    steps: [
        {
            icon: <>💼</>,
            title: "Trading Accounts",
            content: (
                <p>
                    This is where you manage all your <strong>MT5 trading accounts</strong>. Connect multiple accounts and sync trades automatically.
                </p>
            ),
            selector: "#onborda-page-header",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>➕</>,
            title: "Add an Account",
            content: (
                <p>
                    Click <strong>Add Account</strong> to connect a new MT5 account. You'll receive an API key to configure in your EA.
                </p>
            ),
            selector: "#onborda-add-account",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>📥</>,
            title: "Download EA Sync",
            content: (
                <p>
                    Download <strong>EA Sync</strong> (.ex5) and install it in your MT5 to auto-send trades to TheNextTrade in real-time.
                </p>
            ),
            selector: "#onborda-ea-download",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>📋</>,
            title: "Account Cards",
            content: (
                <p>
                    Each card shows account <strong>status</strong>, <strong>balance</strong>, <strong>heartbeat</strong>, and quick actions like Settings and Delete.
                </p>
            ),
            selector: "#onborda-account-grid",
            side: "top",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
    ],
};

// ============================
// JOURNAL TOUR
// ============================
export const journalTour: { tour: string; steps: Step[] } = {
    tour: "journal-tour",
    steps: [
        {
            icon: <>📖</>,
            title: "Trading Journal",
            content: (
                <p>
                    Your complete <strong>trade history</strong>. Every trade synced from MT5 appears here with full details.
                </p>
            ),
            selector: "#onborda-page-header",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>🔍</>,
            title: "Filters & Search",
            content: (
                <p>
                    Filter trades by <strong>date</strong>, <strong>symbol</strong>, <strong>account</strong>, and <strong>tags</strong>. Use the date picker to focus on specific periods.
                </p>
            ),
            selector: "#onborda-journal-filters",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>📊</>,
            title: "Period Stats",
            content: (
                <p>
                    Quick overview of the filtered period: <strong>total trades</strong>, <strong>win rate</strong>, <strong>P&L</strong>, and more.
                </p>
            ),
            selector: "#onborda-journal-stats",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>📝</>,
            title: "Trade List",
            content: (
                <p>
                    Click any trade to <strong>view details</strong>, add <strong>notes</strong>, tag with <strong>strategies</strong>, and attach <strong>screenshots</strong>.
                </p>
            ),
            selector: "#onborda-journal-list",
            side: "top",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
    ],
};

// ============================
// STRATEGIES TOUR
// ============================
export const strategiesTour: { tour: string; steps: Step[] } = {
    tour: "strategies-tour",
    steps: [
        {
            icon: <>♟️</>,
            title: "Strategies",
            content: (
                <p>
                    Create and manage your <strong>trading strategies</strong>. Tag trades with strategies to track which methods work best.
                </p>
            ),
            selector: "#onborda-page-header",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>📊</>,
            title: "Performance Tracking",
            content: (
                <p>
                    See <strong>win rate</strong>, <strong>P&L</strong>, and <strong>trade count</strong> per strategy. Double down on what works!
                </p>
            ),
            selector: "#onborda-strategy-list",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
    ],
};

// ============================
// ANALYTICS TOUR
// ============================
export const analyticsTour: { tour: string; steps: Step[] } = {
    tour: "analytics-tour",
    steps: [
        {
            icon: <>📈</>,
            title: "Analytics Hub",
            content: (
                <p>
                    Deep dive into your performance. <strong>Equity curve</strong>, <strong>pair analysis</strong>, <strong>day-of-week</strong> patterns, and more.
                </p>
            ),
            selector: "#onborda-page-header",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>🔀</>,
            title: "Analytics Tabs",
            content: (
                <p>
                    Switch between <strong>Analytics</strong>, <strong>Reports</strong>, <strong>Mistakes</strong>, and <strong>Intelligence</strong> for different views.
                </p>
            ),
            selector: "#onborda-analytics-tabs",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
    ],
};

// ============================
// ACADEMY TOUR
// ============================
export const academyTour: { tour: string; steps: Step[] } = {
    tour: "academy-tour",
    steps: [
        {
            icon: <>🎓</>,
            title: "Trading Academy",
            content: (
                <p>
                    Your structured learning path from <strong>beginner to advanced</strong>. Complete lessons, pass quizzes, and earn certificates!
                </p>
            ),
            selector: "#onborda-page-header",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>▶️</>,
            title: "Continue Learning",
            content: (
                <p>
                    Your <strong>next lesson</strong> is always shown here. Click to pick up where you left off.
                </p>
            ),
            selector: "#onborda-academy-resume",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>🗺️</>,
            title: "Academy Tree",
            content: (
                <p>
                    Browse all <strong>levels</strong> and <strong>modules</strong>. Lessons unlock sequentially — complete one to unlock the next.
                </p>
            ),
            selector: "#onborda-academy-tree",
            side: "top",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
        {
            icon: <>🏆</>,
            title: "Quizzes & Certificates",
            content: (
                <p>
                    Complete all lessons in a module to unlock its <strong>quiz</strong>. Pass all quizzes in a level to earn a <strong>certificate</strong>!
                </p>
            ),
            selector: "#onborda-academy-sidebar",
            side: "left",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
    ],
};

// ============================
// SETTINGS TOUR
// ============================
export const settingsTour: { tour: string; steps: Step[] } = {
    tour: "settings-tour",
    steps: [
        {
            icon: <>⚙️</>,
            title: "Settings",
            content: (
                <p>
                    Customize your <strong>profile</strong>, <strong>notifications</strong>, <strong>theme</strong>, and <strong>account preferences</strong>.
                </p>
            ),
            selector: "#onborda-page-header",
            side: "bottom",
            showControls: true,
            pointerPadding: 8,
            pointerRadius: 12,
        },
    ],
};

// ============================
// AGGREGATED TOURS
// ============================
export const allTours = [
    dashboardTour,
    accountsTour,
    journalTour,
    strategiesTour,
    analyticsTour,
    academyTour,
    settingsTour,
];

// Map URL path to tour name
export const tourMap: Record<string, string> = {
    "/dashboard": "dashboard-tour",
    "/dashboard/accounts": "accounts-tour",
    "/dashboard/journal": "journal-tour",
    "/dashboard/strategies": "strategies-tour",
    "/dashboard/analytics": "analytics-tour",
    "/dashboard/reports": "analytics-tour",
    "/dashboard/mistakes": "analytics-tour",
    "/dashboard/intelligence": "analytics-tour",
    "/dashboard/academy": "academy-tour",
    "/dashboard/settings": "settings-tour",
};
