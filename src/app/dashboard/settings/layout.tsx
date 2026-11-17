"use client";

import {
    Brain,
    Flame,
    Settings,
    Lock,
    MessageSquare,
    Globe,
    RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabBar } from "@/components/ui/TabBar";
import { useSystemConfig } from "@/lib/dashboard-context";
import {
    SettingsMobileNav,
    type SettingsNavItem,
} from "./SettingsMobileNav";

const baseNavItems: SettingsNavItem[] = [
    {
        title: "Account",
        href: "/dashboard/settings",
        icon: Settings,
        exact: true,
    },
    {
        title: "Public Profile",
        href: "/dashboard/settings/profile",
        icon: Globe,
    },
    {
        title: "Trading Style",
        href: "/dashboard/settings/trading-style",
        icon: Brain,
    },
    { title: "Security", href: "/dashboard/settings/security", icon: Lock },
    {
        title: "Sync Settings",
        href: "/dashboard/settings/sync-settings",
        icon: RefreshCw,
    },
    { title: "Login Streak", href: "/dashboard/settings/streak", icon: Flame },
];

const feedbackNavItem: SettingsNavItem = {
    title: "Feedback & Support",
    href: "/dashboard/settings/feedback",
    icon: MessageSquare,
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { feedbackEnabled } = useSystemConfig();

    const navItems = feedbackEnabled
        ? [...baseNavItems, feedbackNavItem]
        : baseNavItems;

    return (
        <div className="space-y-2 md:space-y-4 min-w-0">
            {/* ── Page Header — consistent with other dashboard pages ── */}
            <PageHeader
                title="Settings"
                description="Manage your account, profile, and security settings."
            />

            {/* ── Mobile Dropdown Section Switcher (< md) ── */}
            <SettingsMobileNav items={navItems} />

            {/* ── Horizontal Tab Nav (Pill Style, >= md) ── */}
            <TabBar
                className="hidden md:inline-flex max-w-full"
                tabs={navItems.map((item) => ({
                    label: item.title,
                    href: item.href,
                    icon: item.icon,
                }))}
            />

            {/* ── Content ── */}
            <div className="min-w-0">{children}</div>
        </div>
    );
}
