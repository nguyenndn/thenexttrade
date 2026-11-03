"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    getNotificationConfig,
    cleanNotificationTitle,
} from "@/lib/notifications/notification-config";
import type { NormalizedNotification } from "./types";

interface NotificationItemProps {
    notification: NormalizedNotification;
    onMarkAsRead: (id: string) => void;
    onClose: () => void;
}

export function NotificationItem({
    notification: n,
    onMarkAsRead,
    onClose,
}: NotificationItemProps) {
    const router = useRouter();
    const { icon: Icon, bg, color } = getNotificationConfig(n.type, n.title);

    const timeAgo = (() => {
        if (!n.createdAt) return "recently";
        try {
            const dateObj = new Date(n.createdAt);
            return !isNaN(dateObj.getTime())
                ? formatDistanceToNow(dateObj, { addSuffix: true, locale: enUS })
                : "recently";
        } catch {
            return "recently";
        }
    })();

    const handleClick = () => {
        if (!n.isRead) onMarkAsRead(n.id);
        onClose();
        const meta = (n.metadata as Record<string, any>) || {};
        if (
            meta.actionType === "OPEN_COACH_PLAN" ||
            n.link === "#coach-plan" ||
            n.link?.includes("action=coach-plan")
        ) {
            window.dispatchEvent(
                new CustomEvent("open-coach-action-plan", {
                    detail: {
                        notificationId: n.id,
                        metadata: meta,
                    },
                })
            );
            if (
                typeof window !== "undefined" &&
                !window.location.pathname.startsWith("/dashboard")
            ) {
                router.push("/dashboard?action=coach-plan");
            }
        } else if (n.onClick) {
            n.onClick();
        } else if (n.link && n.link !== "/dashboard") {
            router.push(n.link);
        } else {
            router.push(`/dashboard/notifications?id=${n.id}`);
        }
    };

    return (
        <div
            className={cn(
                "group relative flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer",
                !n.isRead && "bg-amber-500/[0.025] dark:bg-amber-500/[0.03]"
            )}
            onClick={handleClick}
        >
            {!n.isRead && (
                <span className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r-full" />
            )}

            <div
                className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 self-center transition-transform group-hover:scale-105",
                    bg,
                    color
                )}
            >
                <Icon size={15} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
                <div className="flex justify-between items-baseline mb-1 gap-2">
                    <h4
                        className={cn(
                            "text-xs truncate tracking-tight",
                            !n.isRead
                                ? "text-gray-900 dark:text-white font-bold"
                                : "text-gray-700 dark:text-gray-300 font-medium"
                        )}
                    >
                        {cleanNotificationTitle(n.title)}
                    </h4>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0 whitespace-nowrap">
                        {timeAgo}
                    </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {n.message}
                </p>
            </div>
        </div>
    );
}
