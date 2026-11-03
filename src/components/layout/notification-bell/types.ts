import { Inbox, Lightbulb, BarChart3, Bell, type LucideIcon } from "lucide-react";
import type { Notification } from "@/hooks/useNotifications";

export type TabType = "All" | "Coach" | "Reports" | "System";

export interface NormalizedNotification extends Notification {
    category: TabType;
}

export interface TabConfigItem {
    label: string;
    icon: LucideIcon;
}

export const TAB_CONFIG: Record<TabType, TabConfigItem> = {
    All: { label: "All", icon: Inbox },
    Coach: { label: "Coach", icon: Lightbulb },
    Reports: { label: "Reports", icon: BarChart3 },
    System: { label: "System", icon: Bell },
};

export function categorizeNotification(n: Notification): TabType {
    const meta = (n.metadata as Record<string, any>) || {};
    if (["WEEKLY_REPORT", "MONTHLY_REPORT", "REPORT_NUDGE"].includes(n.type)) {
        return "Reports";
    }
    if (
        n.type === "COACH_NUDGE" ||
        n.type === "SYNC_STALE" ||
        (n.type === "FEATURE_UPDATE" &&
            (meta.actionType === "OPEN_COACH_PLAN" ||
                meta.signalType ||
                meta.insightId ||
                n.title.startsWith("Coach") ||
                n.title.includes("Pattern") ||
                n.title.includes("Leak Alert") ||
                n.title.includes("Loss Streak") ||
                n.title.includes("Experiment")))
    ) {
        return "Coach";
    }
    return "System";
}

export function computeUnreadCounts(
    notifications: NormalizedNotification[]
): Record<TabType, number> {
    return {
        All: notifications.filter((n) => !n.isRead).length,
        Coach: notifications.filter((n) => !n.isRead && n.category === "Coach").length,
        Reports: notifications.filter((n) => !n.isRead && n.category === "Reports").length,
        System: notifications.filter((n) => !n.isRead && n.category === "System").length,
    };
}
