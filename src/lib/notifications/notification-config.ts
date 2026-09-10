import {
    Bell,
    AlertTriangle,
    ShieldCheck,
    CreditCard,
    Megaphone,
    Bug,
    Lightbulb,
    BarChart3,
    TrendingUp,
    Trophy,
    type LucideIcon,
} from "lucide-react";

export interface NotificationVisualConfig {
    icon: LucideIcon;
    color: string;
    bg: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<
    string,
    NotificationVisualConfig
> = {
    // Coach / Insights / Behavioral Plans (Lightbulb, cyan)
    FEATURE_UPDATE: {
        icon: Lightbulb,
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    COACH_NUDGE: {
        icon: Lightbulb,
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    SYNC_STALE: {
        icon: Lightbulb,
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
    },

    // VIP & Account Upgrades (CreditCard, purple / red)
    VIP_APPROVED: {
        icon: CreditCard,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    VIP_REJECTED: {
        icon: CreditCard,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
    },
    NEW_VIP_REQUEST: {
        icon: Megaphone,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
    },

    // Announcements & Broadcasts (Megaphone, blue / pink)
    ANNOUNCEMENT: {
        icon: Megaphone,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    PROMOTION: {
        icon: Megaphone,
        color: "text-pink-600 dark:text-pink-400",
        bg: "bg-pink-100 dark:bg-pink-900/30",
    },

    // Licenses & Security (ShieldCheck / AlertTriangle)
    LICENSE_APPROVED: {
        icon: ShieldCheck,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    LICENSE_REJECTED: {
        icon: AlertTriangle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
    },
    LICENSE_EXPIRED: {
        icon: AlertTriangle,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    MAINTENANCE: {
        icon: AlertTriangle,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/30",
    },

    // Reports & Analytics (BarChart3, amber / emerald)
    WEEKLY_REPORT: {
        icon: BarChart3,
        color: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-500/10 dark:bg-amber-500/10",
    },
    MONTHLY_REPORT: {
        icon: BarChart3,
        color: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
    },
    REPORT_NUDGE: {
        icon: BarChart3,
        color: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
    },

    // Trades / Milestones
    NEW_EA_VERSION: {
        icon: TrendingUp,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    NO_TRADES_NUDGE: {
        icon: TrendingUp,
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-100 dark:bg-gray-800",
    },
    MILESTONE: {
        icon: Trophy,
        color: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-500/10 dark:bg-amber-500/10",
    },
    FEEDBACK_RECEIVED: {
        icon: Bug,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
    },
};

export const DEFAULT_NOTIFICATION_CONFIG: NotificationVisualConfig = {
    icon: Bell,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-white/10",
};

export function cleanNotificationTitle(text: string): string {
    if (!text) return "";
    return text.replace(/\p{Extended_Pictographic}\s*/gu, "").trim();
}

export function getNotificationConfig(
    type: string,
    title?: string
): NotificationVisualConfig {
    if (
        title &&
        (title.includes("Account Connected") ||
            title.includes("First Trade") ||
            title.includes("First Report") ||
            title.includes("Milestone") ||
            title.includes("Badge"))
    ) {
        return NOTIFICATION_TYPE_CONFIG.MILESTONE;
    }

    return NOTIFICATION_TYPE_CONFIG[type] || DEFAULT_NOTIFICATION_CONFIG;
}
