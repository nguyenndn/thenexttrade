"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
    Bell, Trash2, AlertTriangle,
    ShieldCheck, CreditCard, Megaphone, Bug, Lightbulb,
    BarChart3, TrendingUp, Copy
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
    priority: string;
}

interface Props {
    initialNotifications: Notification[];
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
    LICENSE_APPROVED: { icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    LICENSE_REJECTED: { icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    LICENSE_EXPIRED: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
    NEW_EA_VERSION: { icon: TrendingUp, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    COPY_TRADING_APPROVED: { icon: Copy, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    COPY_TRADING_REJECTED: { icon: Copy, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    VIP_APPROVED: { icon: CreditCard, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
    VIP_REJECTED: { icon: CreditCard, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    ANNOUNCEMENT: { icon: Megaphone, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    MAINTENANCE: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
    PROMOTION: { icon: Megaphone, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/30" },
    FEATURE_UPDATE: { icon: Lightbulb, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/30" },
    FEEDBACK_RECEIVED: { icon: Bug, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
    WEEKLY_REPORT: { icon: BarChart3, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
    MONTHLY_REPORT: { icon: BarChart3, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
    NO_TRADES_NUDGE: { icon: TrendingUp, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
};

const defaultConfig = { icon: Bell, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-white/10" };

function getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, "dd MMM yyyy", { locale: enUS });
}

export function NotificationsList({ initialNotifications }: Props) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDeleteAll = () => {
        if (notifications.length === 0) return;

        startTransition(async () => {
            try {
                const res = await fetch("/api/user/notifications", { method: "DELETE" });
                if (!res.ok) throw new Error("Failed to delete");
                setNotifications([]);
                toast.success("All notifications cleared");
                router.refresh();
            } catch {
                toast.error("Failed to delete notifications");
            }
        });
    };

    return (
        <>
            {/* Action Bar */}
            {notifications.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                    </p>
                    <button
                        onClick={handleDeleteAll}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={16} />
                        {isPending ? "Deleting..." : "Clear All"}
                    </button>
                </div>
            )}

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                            <Bell size={28} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">No notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                            You&apos;re all caught up! We&apos;ll notify you about account updates, new features, and more.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {notifications.map((n) => {
                            const config = typeConfig[n.type] || defaultConfig;
                            const Icon = config.icon;

                            return (
                                <div
                                    key={n.id}
                                    className="group p-5 hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors duration-150 cursor-default"
                                >
                                    <div className="flex gap-4">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                                            <Icon size={18} className={config.color} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                                    {n.title}
                                                </h3>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
                                                    {getRelativeTime(n.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <a
                                                    href={n.link}
                                                    className="inline-block mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    View details →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
