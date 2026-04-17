"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Settings, Users, Lock, MessageSquare, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { type LucideIcon } from "lucide-react";

interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    exact?: boolean;
}

const baseNavItems: NavItem[] = [
    { title: "Account", href: "/dashboard/settings", icon: Settings, exact: true },
    { title: "Public Profile", href: "/dashboard/settings/profile", icon: Globe },
    { title: "Security", href: "/dashboard/settings/security", icon: Lock },
    { title: "Login Streak", href: "/dashboard/settings/streak", icon: Flame },
    { title: "Referrals", href: "/dashboard/settings/referrals", icon: Users },
];

const feedbackNavItem: NavItem = { title: "Feedback & Support", href: "/dashboard/settings/feedback", icon: MessageSquare };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [feedbackEnabled, setFeedbackEnabled] = useState(true);

    useEffect(() => {
        fetch("/api/system/config")
            .then((res) => res.json())
            .then((data) => setFeedbackEnabled(data.feedbackEnabled ?? true))
            .catch(() => setFeedbackEnabled(true));
    }, []);

    const navItems = feedbackEnabled
        ? [...baseNavItems, feedbackNavItem]
        : baseNavItems;

    return (
        <div className="space-y-4">
            {/* ── Page Header — consistent with other dashboard pages ── */}
            <PageHeader
                title="Settings"
                description="Manage your account, profile, and security settings."
            />

            {/* ── Horizontal Tab Nav ── */}
            <div className="border-b border-gray-200 dark:border-white/10">
                <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20"
                                )}
                            >
                                <Icon size={16} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ── Content ── */}
            <div>
                {children}
            </div>
        </div>
    );
}
