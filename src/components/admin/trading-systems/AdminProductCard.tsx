"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
    Bot,
    Download,
    Edit,
    ShieldCheck,
    Trash2,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { htmlToPlainText } from "@/lib/sanitize";
import { EAProduct } from "@/types/ea-license";
import type { ProductFarmStats } from "@/lib/admin/trading-systems/ea-farm-stats.server";
import type { ProductActiveUser } from "./ProductUsersModal";

export interface AdminProductItem extends EAProduct {
    _count?: {
        downloads?: number;
        accessRecords?: number;
    };
    activeUsers?: ProductActiveUser[];
    activeLicensesCount?: number;
    farmStats?: ProductFarmStats;
}

interface AdminProductCardProps {
    product: AdminProductItem;
    onViewUsers: (product: AdminProductItem) => void;
    onDelete: (productId: string) => void;
}

function getTypeBadgeLabel(type: EAProduct["type"]): string {
    switch (type) {
        case "INDICATOR":
            return "INDICATOR";
        case "MANUAL_ASSIST":
            return "MANUAL ASSIST";
        case "SEMI_AUTO":
            return "SEMI AUTO";
        default:
            return "EXPERT ADVISOR";
    }
}

function formatUsd(amount: number): string {
    return amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function AdminProductCard({
    product,
    onViewUsers,
    onDelete,
}: AdminProductCardProps) {
    const farmStats = product.farmStats;
    const confirmedBalance = farmStats?.confirmedFarmBalanceUSD ?? 0;
    const poolBalance = farmStats?.userPoolBalanceUSD ?? 0;
    const onlineCount = farmStats?.onlineAccountsCount ?? 0;
    const tradersCount =
        farmStats?.uniqueTradersCount ??
        product.activeUsers?.length ??
        product.activeLicensesCount ??
        0;
    const accountsCount = product.activeUsers?.length ?? 0;
    const totalDownloads =
        product.totalDownloads || product._count?.downloads || 0;

    return (
        <div className="group relative bg-white dark:bg-[#14161E] rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.08] hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col justify-between">
            {/* Top Media Preview */}
            <Link
                href={`/admin/trading-systems/${product.id}`}
                className="relative w-full aspect-video bg-[#0E1118] overflow-hidden block border-b border-gray-200 dark:border-white/[0.08]"
            >
                {/* Top-left Type Badge */}
                <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase bg-black/80 backdrop-blur-md text-white/95 border border-white/10 shadow-md z-10 pointer-events-none">
                    {getTypeBadgeLabel(product.type)}
                </div>

                {/* Top-right Active Status Pill */}
                <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/10 shadow-md z-10 flex items-center gap-1.5 pointer-events-none">
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            product.isActive
                                ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                                : "bg-gray-400"
                        }`}
                    />
                    <span
                        className={
                            product.isActive ? "text-emerald-400" : "text-gray-300"
                        }
                    >
                        {product.isActive ? "Active" : "Disabled"}
                    </span>
                </div>

                {product.thumbnail ? (
                    <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-contain bg-[#0E1118] group-hover:scale-[1.02] transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0c0f17] via-[#10131c] to-[#151922] p-6 gap-2">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Bot
                                size={24}
                                className="text-amber-400"
                                aria-hidden="true"
                            />
                        </div>
                        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
                            MT5 System
                        </span>
                    </div>
                )}
            </Link>

            {/* Card Body */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white dark:bg-[#151925]">
                <div>
                    <Link
                        href={`/admin/trading-systems/${product.id}`}
                        className="block"
                    >
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors line-clamp-1">
                            {product.name}
                        </h3>
                    </Link>

                    {/* Metadata Row */}
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono tabular-nums tracking-wide mt-0.5 mb-2 flex items-center gap-1.5 flex-wrap">
                        <span>v{product.version}</span>
                        <span>•</span>
                        <span>{product.platform}</span>
                        <span>•</span>
                        <span>
                            {format(new Date(product.createdAt), "dd MMM yyyy")}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mb-3 min-h-[2.5rem]">
                        {htmlToPlainText(product.description) ||
                            "No product description provided yet."}
                    </p>

                    {/* 2x2 Admin Telemetry Matrix */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onViewUsers(product)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onViewUsers(product);
                            }
                        }}
                        className="w-full text-left rounded-xl border border-gray-200 dark:border-white/[0.1] bg-gray-50/80 dark:bg-white/[0.03] hover:border-emerald-500/40 transition-colors grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/[0.08] mb-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        title="Click to inspect users & EA Farm telemetry"
                    >
                        <div className="p-3.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                                Downloads
                            </span>
                            <span className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-white flex items-center gap-1.5 mt-1">
                                <Download
                                    size={15}
                                    className="text-amber-500 shrink-0"
                                    aria-hidden="true"
                                />
                                {totalDownloads}
                            </span>
                        </div>

                        <div className="p-3.5 !border-t-0">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                                Licensees
                            </span>
                            <span className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-white flex items-center gap-1.5 mt-1 truncate">
                                <ShieldCheck
                                    size={15}
                                    className="text-emerald-500 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>
                                    {tradersCount}t · {accountsCount}a
                                </span>
                            </span>
                        </div>

                        <div className="p-3.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                                Farm Capital
                            </span>
                            <span className="text-[15px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                                ${formatUsd(confirmedBalance)}
                                {onlineCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                        {onlineCount}
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="p-3.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                                User Pool
                            </span>
                            <span className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-white block mt-1">
                                ${formatUsd(poolBalance)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2.5 border-t border-gray-200 dark:border-white/[0.08] flex items-center justify-between gap-2">
                    <Link href={`/admin/trading-systems/${product.id}`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5"
                        >
                            <Edit size={13} aria-hidden="true" />
                            Edit
                        </Button>
                    </Link>

                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg gap-1"
                            onClick={() => onViewUsers(product)}
                            aria-label={`View active users for ${product.name}`}
                        >
                            <Users size={14} aria-hidden="true" />
                            <span>Users</span>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            onClick={() => onDelete(product.id)}
                            aria-label={`Delete ${product.name}`}
                            title="Delete Product"
                        >
                            <Trash2 size={15} aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
