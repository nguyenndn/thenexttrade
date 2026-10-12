"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    FileText,
    Clock,
    Route,
    BarChart3,
    FileSpreadsheet,
    AlertTriangle,
    Brain,
    CalendarDays,
    CalendarRange,
    Activity,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Built-in icon mapping for known routes
// This avoids Server→Client serialization issues with Lucide components
const routeIconMap: Record<string, LucideIcon> = {
    "/dashboard/journal": FileText,
    "/dashboard/sessions": Clock,
    "/dashboard/strategies": Route,
    "/dashboard/analytics": BarChart3,
    "/dashboard/intelligence": Brain,
    "/dashboard/reports": FileSpreadsheet,
    "/dashboard/reports/weekly": CalendarDays,
    "/dashboard/reports/monthly": CalendarRange,
};

const ANALYTICS_ROUTES = [
    "/dashboard/analytics",
    "/dashboard/sessions",
    "/dashboard/intelligence",
    "/dashboard/reports",
];

function isAnalyticsRoute(href: string): boolean {
    const cleanHref = href.split("?")[0];
    return ANALYTICS_ROUTES.some(
        (route) => cleanHref === route || cleanHref.startsWith(route + "/")
    );
}

/**
 * Resolves the effective active/main trading account ID:
 * 1. URL search parameter `accountId` (if user is currently viewing a specific account)
 * 2. `last_account_id` cookie (persisted main/selected account)
 * 3. Listens to `tnt_account_changed` custom event for reactive in-app account switching
 */
function useEffectiveAccountId(): string | null {
    const searchParams = useSearchParams();
    const urlAccountId = searchParams?.get("accountId");

    const [cookieAccountId, setCookieAccountId] = useState<string | null>(() => {
        if (typeof document !== "undefined") {
            const match = document.cookie.match(
                /(?:^|;\s*)last_account_id=([^;]+)/
            );
            return match?.[1] || null;
        }
        return null;
    });

    useEffect(() => {
        const readCookie = () => {
            if (typeof document === "undefined") return null;
            const match = document.cookie.match(
                /(?:^|;\s*)last_account_id=([^;]+)/
            );
            return match?.[1] || null;
        };

        const cookieVal = readCookie();
        if (cookieVal) {
            setCookieAccountId(cookieVal);
        }

        const handleAccountChange = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                setCookieAccountId(customEvent.detail);
            }
        };

        window.addEventListener("tnt_account_changed", handleAccountChange);
        return () => {
            window.removeEventListener(
                "tnt_account_changed",
                handleAccountChange
            );
        };
    }, []);

    return urlAccountId || cookieAccountId;
}

interface Tab {
    label: string;
    href: string;
    icon?: LucideIcon;
}

interface TabBarProps {
    tabs: Tab[];
    className?: string;
    equalWidth?: boolean;
    /** Force enable/disable accountId preservation on links. Defaults to auto-detecting analytics routes. */
    preserveAccount?: boolean;
}

export function TabBar({
    tabs,
    className,
    equalWidth,
    preserveAccount,
}: TabBarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const effectiveAccountId = useEffectiveAccountId();

    return (
        <div
            className={cn(
                "bg-[#F1F3F5] dark:bg-[#1A1D27] p-1 rounded-lg border border-dashboard h-auto overflow-x-auto scrollbar-hide",
                equalWidth
                    ? "w-full flex lg:w-auto lg:inline-flex"
                    : "w-auto inline-flex",
                className
            )}
        >
            {tabs.map((tab) => {
                const cleanTabHref = tab.href.split("?")[0];
                const isActive =
                    pathname === cleanTabHref ||
                    (cleanTabHref === "/dashboard/reports" &&
                        pathname.startsWith("/dashboard/reports"));

                // Determine whether this tab should retain the active account ID
                const shouldAttach =
                    preserveAccount !== undefined
                        ? preserveAccount
                        : isAnalyticsRoute(tab.href);

                let targetHref = tab.href;
                if (shouldAttach && effectiveAccountId) {
                    const [path, existingQuery] = tab.href.split("?");
                    const params = new URLSearchParams(existingQuery || "");

                    if (!params.has("accountId")) {
                        params.set("accountId", effectiveAccountId);
                    }

                    // Preserve active date range filter if present
                    const from = searchParams?.get("from");
                    const to = searchParams?.get("to");
                    if (from && !params.has("from")) {
                        params.set("from", from);
                    }
                    if (to && !params.has("to")) {
                        params.set("to", to);
                    }

                    const queryStr = params.toString();
                    targetHref = queryStr ? `${path}?${queryStr}` : path;
                }

                // Use explicit icon prop first, fallback to route map
                const Icon = tab.icon || routeIconMap[tab.href];
                return (
                    <Link
                        key={tab.href}
                        href={targetHref}
                        className={cn(
                            "rounded-lg px-3 sm:px-4 py-1.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 border whitespace-nowrap shrink-0",
                            equalWidth && "flex-1 text-center lg:flex-none",
                            isActive
                                ? "bg-gold text-white shadow-md shadow-amber-500/20 border-transparent"
                                : "text-gray-600 dark:text-gray-300 border-transparent hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        {Icon && <Icon size={14} className="sm:w-4 sm:h-4" />}
                        <span>{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
