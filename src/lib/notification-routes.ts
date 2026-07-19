export const NOTIFICATION_ROUTES = {
    DASHBOARD: "/dashboard",
    ADMIN_DASHBOARD: "/admin",
    EA_DASHBOARD: "/dashboard/trading-systems",
    VIP_ACCOUNTS: "/dashboard/accounts",
    VIP_UNLOCK_PRO: "/dashboard/accounts?intent=unlock-pro",
    COPY_TRADING: "/dashboard/copy-trading",
    JOURNAL: "/dashboard/journal",
    REPORTS: "/dashboard/reports",
    MY_ACCOUNTS: "/dashboard/trading-systems", // Legacy alias kept safe for old notification callers.
    FEEDBACK_ADMIN: "/admin/feedback",
    COPY_TRADING_ADMIN: "/admin/copy-trading",
    EA_PENDING_ADMIN: "/admin/ea/accounts/pending",
} as const;

export type NotificationRoute =
    (typeof NOTIFICATION_ROUTES)[keyof typeof NOTIFICATION_ROUTES] | string;
