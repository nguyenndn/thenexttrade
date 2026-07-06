"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Settings, Users, Lock, MessageSquare, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSystemConfig } from "@/lib/dashboard-context";
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
 { title: "Sync Settings", href: "/dashboard/settings/sync-settings", icon: RefreshCw },
 { title: "Login Streak", href: "/dashboard/settings/streak", icon: Flame },
 { title: "Referrals", href: "/dashboard/settings/referrals", icon: Users },
];

const feedbackNavItem: NavItem = { title: "Feedback & Support", href: "/dashboard/settings/feedback", icon: MessageSquare };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
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
 <div className="overflow-x-auto scrollbar-hide flex">
 <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1.5 rounded-xl border border-dashboard w-fit shrink-0">
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
 "relative px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 border",
 isActive
 ? "bg-gradient-to-r from-primary to-teal-500 text-white shadow-md border-transparent"
 : "text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 border-transparent hover:border-dashboard dark:hover:border-white/10"
 )}
 >
 <Icon size={15} />
 <span>{item.title}</span>
 </Link>
 );
 })}
 </div>
 </div>

 {/* ── Content ── */}
 <div>
 {children}
 </div>
 </div>
 );
}
