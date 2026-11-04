"use client";

import type {
    LoyaltyClaimRecord,
    LoyaltyClaimStatus,
} from "@/lib/loyalty/loyalty.types";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import {
    SyncFilterToolbar,
    StatusFilterOption,
} from "@/app/admin/ib/sync-requests/SyncFilterToolbar";
import {
    CheckCircle2,
    Clock,
    XCircle,
    Coins,
    Copy,
    Check,
    Layers,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface LoyaltyClaimsTableProps {
    claims: LoyaltyClaimRecord[];
    currentStatus: LoyaltyClaimStatus | "ALL";
    onStatusChange: (status: LoyaltyClaimStatus | "ALL") => void;
    onSelectClaim: (claim: LoyaltyClaimRecord) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function LoyaltyClaimsTable({
    claims,
    currentStatus,
    onStatusChange,
    onSelectClaim,
    onRefresh = () => {},
    isRefreshing = false,
}: LoyaltyClaimsTableProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Address copied to clipboard");
        setTimeout(() => setCopiedId(null), 1800);
    };

    const statusCounts = useMemo(() => {
        return {
            ALL: claims.length,
            PENDING: claims.filter((c) => c.status === "PENDING").length,
            COMPLETED: claims.filter((c) => c.status === "COMPLETED").length,
            REJECTED: claims.filter((c) => c.status === "REJECTED").length,
        };
    }, [claims]);

    const statusTabs: StatusFilterOption[] = [
        {
            label: "All Claims",
            key: "ALL",
            icon: Layers,
            count: statusCounts.ALL,
        },
        {
            label: "Pending Review",
            key: "PENDING",
            icon: Clock,
            count: statusCounts.PENDING,
        },
        {
            label: "Completed & Paid",
            key: "COMPLETED",
            icon: CheckCircle2,
            count: statusCounts.COMPLETED,
        },
        {
            label: "Rejected",
            key: "REJECTED",
            icon: XCircle,
            count: statusCounts.REJECTED,
        },
    ];

    const displayedClaims = useMemo(() => {
        return claims.filter((claim) => {
            if (currentStatus !== "ALL" && claim.status !== currentStatus) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const nameMatch = claim.user?.name?.toLowerCase().includes(q);
                const emailMatch = claim.user?.email?.toLowerCase().includes(q);
                const tierMatch = claim.tierName?.toLowerCase().includes(q);
                const addressMatch = claim.usdtAddress
                    ?.toLowerCase()
                    .includes(q);
                const txMatch = claim.transactionRef
                    ?.toLowerCase()
                    .includes(q);
                return Boolean(
                    nameMatch ||
                        emailMatch ||
                        tierMatch ||
                        addressMatch ||
                        txMatch
                );
            }
            return true;
        });
    }, [claims, currentStatus, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Standardized Status Tabs & Search Toolbar Card (matching sync-requests) */}
            <SyncFilterToolbar
                search={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={() => setSearchQuery("")}
                statusTabs={statusTabs}
                activeStatus={currentStatus}
                onStatusChange={(val) =>
                    onStatusChange(val as LoyaltyClaimStatus | "ALL")
                }
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                tabsId="loyalty-claims-status-tabs"
            />

            {/* Unified Data Table Card */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                        <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3.5">Trader</th>
                                <th className="px-4 py-3.5">Milestone Tier</th>
                                <th className="px-4 py-3.5">
                                    Cumulative Volume
                                </th>
                                <th className="px-4 py-3.5">Reward Amount</th>
                                <th className="px-4 py-3.5">USDT Wallet</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {displayedClaims.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-16 text-center text-gray-400 dark:text-gray-500"
                                    >
                                        <Coins className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                            No loyalty reward claims found
                                        </p>
                                        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                            Milestone claims from Partner Pro
                                            traders will appear here for
                                            verification and USDT disbursement.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                displayedClaims.map((claim) => (
                                    <tr
                                        key={claim.id}
                                        className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Trader */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                {claim.userId ? (
                                                    <Link
                                                        href={`/admin/users/${claim.userId}`}
                                                        className="shrink-0 group"
                                                        title="View User Profile"
                                                    >
                                                        <Avatar className="h-8 w-8 rounded-full border border-gray-100 dark:border-white/10 group-hover:ring-2 group-hover:ring-primary/40 transition-all">
                                                            <AvatarImage
                                                                src={
                                                                    claim.user
                                                                        ?.image ||
                                                                    undefined
                                                                }
                                                                alt={
                                                                    claim.user
                                                                        ?.name ||
                                                                    "Trader"
                                                                }
                                                            />
                                                            <AvatarFallback className="rounded-full bg-primary/10 text-primary font-black text-xs">
                                                                {(claim.user
                                                                    ?.name ||
                                                                    claim.user
                                                                        ?.email ||
                                                                    "T")[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                ) : (
                                                    <Avatar className="h-8 w-8 rounded-full border border-gray-100 dark:border-white/10 shrink-0">
                                                        <AvatarImage
                                                            src={
                                                                claim.user
                                                                    ?.image ||
                                                                undefined
                                                            }
                                                            alt={
                                                                claim.user
                                                                    ?.name ||
                                                                "Trader"
                                                            }
                                                        />
                                                        <AvatarFallback className="rounded-full bg-primary/10 text-primary font-black text-xs">
                                                            {(claim.user
                                                                ?.name ||
                                                                claim.user
                                                                    ?.email ||
                                                                "T")[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className="min-w-0">
                                                    {claim.userId ? (
                                                        <Link
                                                            href={`/admin/users/${claim.userId}`}
                                                            className="font-bold text-gray-900 dark:text-white truncate max-w-[140px] block hover:text-primary hover:underline transition-colors"
                                                        >
                                                            {claim.user?.name ||
                                                                "Trader"}
                                                        </Link>
                                                    ) : (
                                                        <p className="font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
                                                            {claim.user?.name ||
                                                                "Trader"}
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-gray-400 truncate max-w-[160px]">
                                                        {claim.user?.email ||
                                                            "No email registered"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Milestone Tier */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono tabular-nums text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                    L{claim.level}
                                                </span>
                                                <span className="font-bold text-gray-900 dark:text-white text-xs">
                                                    {claim.tierName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Volume */}
                                        <td className="px-4 py-3.5">
                                            <span className="font-mono tabular-nums font-bold text-gray-900 dark:text-white text-xs">
                                                {claim.actualLots.toLocaleString()}
                                            </span>
                                            <span className="text-[11px] font-mono tabular-nums text-gray-400 ml-1">
                                                /{" "}
                                                {claim.requiredLots.toLocaleString()}{" "}
                                                Lots
                                            </span>
                                        </td>

                                        {/* Reward */}
                                        <td className="px-4 py-3.5">
                                            {claim.cashAmount &&
                                            claim.cashAmount > 0 ? (
                                                <span className="font-mono tabular-nums font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs">
                                                    <Coins
                                                        size={13}
                                                        className="shrink-0"
                                                    />
                                                    $
                                                    {claim.cashAmount.toLocaleString()}{" "}
                                                    USDT
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {claim.rewardTitle}
                                                </span>
                                            )}
                                        </td>

                                        {/* USDT Wallet */}
                                        <td className="px-4 py-3.5">
                                            {claim.usdtAddress ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white">
                                                        {claim.usdtAddress.slice(
                                                            0,
                                                            6
                                                        )}
                                                        ...
                                                        {claim.usdtAddress.slice(
                                                            -4
                                                        )}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleCopy(
                                                                claim.id,
                                                                claim.usdtAddress!
                                                            )
                                                        }
                                                        className="h-6 w-6 rounded-lg p-0 text-gray-400 hover:text-amber-500 transition-colors"
                                                        aria-label="Copy destination wallet address"
                                                    >
                                                        {copiedId ===
                                                        claim.id ? (
                                                            <Check
                                                                size={12}
                                                                className="text-amber-500"
                                                            />
                                                        ) : (
                                                            <Copy size={12} />
                                                        )}
                                                    </Button>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 uppercase">
                                                        {claim.network ||
                                                            "BEP20"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">
                                                    None
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3.5">
                                            {claim.status === "COMPLETED" ? (
                                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 inline-flex items-center gap-1">
                                                    <CheckCircle2 size={12} />
                                                    COMPLETED
                                                </span>
                                            ) : claim.status === "PENDING" ? (
                                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 inline-flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    PENDING
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 inline-flex items-center gap-1">
                                                    <XCircle size={12} />
                                                    REJECTED
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3.5 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    onSelectClaim(claim)
                                                }
                                                className="h-8 px-3 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                            >
                                                {claim.status === "PENDING"
                                                    ? "Review & Pay"
                                                    : "Inspect"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
