
"use client";

import Link from "next/link";
import { PenTool, Users, Layers, Settings } from "lucide-react";

export function QuickActionsWidget() {
    const actions = [
        {
            title: "Write Article",
            description: "Create a new post",
            icon: PenTool,
            href: "/admin/articles/create",
            textColor: "text-blue-500",
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
        },
        {
            title: "Manage Users",
            description: "View user base",
            icon: Users,
            href: "/admin/users",
            textColor: "text-cyan-500",
            bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
        },
        {
            title: "Manage Quizzes",
            description: "Academy content",
            icon: Layers,
            href: "/admin/quizzes",
            textColor: "text-amber-500",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
        },
        {
            title: "Settings",
            description: "Configure platform",
            icon: Settings,
            href: "/admin/settings",
            textColor: "text-emerald-500",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, idx) => (
                <Link
                    key={idx}
                    href={action.href}
                    className="flex flex-col items-center gap-2.5 p-5 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group text-center"
                >
                    <div className={`p-3 rounded-xl ${action.bgColor} ${action.textColor} group-hover:scale-110 transition-transform`}>
                        <action.icon size={20} aria-hidden="true" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-700 dark:text-white text-sm">{action.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{action.description}</div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
