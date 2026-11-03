"use client";

import Link from "next/link";
import {
    Users,
    ShieldCheck,
    Settings,
    BarChart3,
    Cpu,
    ShieldAlert,
    Activity,
} from "lucide-react";

export function QuickActionsWidget() {
    const actions = [
        {
            title: "Manage Users",
            description: "View user directory",
            icon: Users,
            href: "/admin/users",
            textColor: "text-amber-600 dark:text-gold",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
        },
        {
            title: "Trader Behavior",
            description: "Live behavioral radar",
            icon: Activity,
            href: "/admin/users/behavior",
            textColor: "text-emerald-500",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
        },
        {
            title: "Review VIPs",
            description: "Pending approvals",
            icon: ShieldCheck,
            href: "/admin/ib/pipeline",
            textColor: "text-amber-600 dark:text-gold",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
        },
        {
            title: "Business Reports",
            description: "Revenue & health",
            icon: BarChart3,
            href: "/admin/reports",
            textColor: "text-emerald-500",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
        },
        {
            title: "AI Gateway",
            description: "Models & routing",
            icon: Cpu,
            href: "/admin/ai",
            textColor: "text-amber-600 dark:text-gold",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
        },
        {
            title: "Security & Audit",
            description: "Threat radar & logs",
            icon: ShieldAlert,
            href: "/admin/security",
            textColor: "text-rose-500",
            bgColor: "bg-rose-50 dark:bg-rose-500/10",
        },
        {
            title: "Settings",
            description: "Configure system",
            icon: Settings,
            href: "/admin/settings",
            textColor: "text-gray-600 dark:text-gray-300",
            bgColor: "bg-gray-100 dark:bg-white/5",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {actions.map((action, idx) => (
                <Link
                    key={idx}
                    href={action.href}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group text-center"
                >
                    <div
                        className={`p-3 rounded-lg ${action.bgColor} ${action.textColor} group-hover:scale-110 transition-transform`}
                    >
                        <action.icon size={20} aria-hidden="true" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-700 dark:text-white text-xs sm:text-sm">
                            {action.title}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                            {action.description}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
