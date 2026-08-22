"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Brain,
    Flame,
    Settings,
    Users,
    Lock,
    MessageSquare,
    Globe,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabBar } from "@/components/ui/TabBar";
import { useSystemConfig } from "@/lib/dashboard-context";
import { type LucideIcon } from "lucide-react";

interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    exact?: boolean;
}

const baseNavItems: NavItem[] = [
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
    { title: "Referrals", href: "/dashboard/settings/referrals", icon: Users },
];

const feedbackNavItem: NavItem = {
    title: "Feedback & Support",
    href: "/dashboard/settings/feedback",
    icon: MessageSquare,
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { feedbackEnabled } = useSystemConfig();

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

            {/* ── Horizontal Tab Nav (Pill Style) ── */}
            <TabBar
                tabs={navItems.map((item) => ({
                    label: item.title,
                    href: item.href,
                    icon: item.icon,
                }))}
            />

            {/* ── Content ── */}
            <div>{children}</div>
        </div>
    );
}
