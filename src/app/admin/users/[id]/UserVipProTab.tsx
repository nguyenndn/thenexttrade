"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    SPRING_SOFT,
    backdropVariants,
    panelVariants,
} from "@/lib/animations";
import { format } from "date-fns";
import {
    KeyRound,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Clock,
    Image as ImageIcon,
    Loader2,
    AlertCircle,
    AlertTriangle,
    Trash2,
    ChevronDown,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    approveVipRequest,
    rejectVipRequest,
    deleteVipRequest,
    clearRejectedVipRequests,
    grantGracePeriod,
    revokeProAccess,
    grantManualPro,
} from "@/actions/vip-request";

interface UserVipProTabProps {
    user: {
        id: string;
        email: string | null;
        name: string | null;
        tradingAccounts: Array<{
            id: string;
            name: string | null;
            broker: string | null;
            accountNumber: string | null;
        }>;
        vipRequests: Array<{
            id: string;
            broker: string;
            accountNumber: string;
            balance: string;
            email: string;
            telegramId: string;
            fullName: string | null;
            country: string | null;
            screenshotUrl: string | null;
            status: "PENDING" | "APPROVED" | "REJECTED";
            rejectReason: string | null;
            reviewedBy: string | null;
            reviewedAt: string | Date | null;
            createdAt: string | Date;
        }>;
        proEntitlements: Array<{
            id: string;
            tradingAccountId?: string | null;
            status: "ACTIVE" | "GRACE" | "REVOKED" | "EXPIRED";
            source: string;
            broker: string | null;
            accountNumber: string | null;
            accountNumberMasked: string | null;
            startsAt: string | Date;
            expiresAt: string | Date | null;
            adminNote: string | null;
            tradingAccount?: {
                id?: string;
                name: string | null;
                accountNumber: string | null;
            } | null;
        }>;
    };
}

export function UserVipProTab({ user }: UserVipProTabProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [screenshotModal, setScreenshotModal] = useState<string | null>(null);

    // Body scroll lock: lock while the lightbox is open, release after the
    // exit animation completes (in onExitComplete) so the scrollbar doesn't flash.
    useEffect(() => {
        if (screenshotModal) {
            document.body.style.overflow = "hidden";
        }
    }, [screenshotModal]);

    const releaseLightboxLock = () => {
        if (!screenshotModal) {
            document.body.style.overflow = "unset";
        }
    };

    // Manual Grant Form State
    const [selectedAccountId, setSelectedAccountId] =
        useState<string>("user-level");
    const [grantType, setGrantType] = useState<"permanent" | "grace">(
        "permanent"
    );
    const [graceDays, setGraceDays] = useState(14);
    const [grantNote, setGrantNote] = useState("");

    const accessStatusLabels: Record<string, string> = {
        ACTIVE: "Active Access",
        GRACE: "Temporary Access",
        REVOKED: "Access Removed",
        EXPIRED: "Expired",
    };
    const accessSourceLabels: Record<string, string> = {
        IB_VERIFIED: "Partner Account Verified",
        MANUAL: "Granted by Admin",
        SYSTEM: "Granted by System",
    };

    const activeEntitlements = user.proEntitlements.filter(
        (e) => e.status !== "REVOKED"
    );
    const rejectedCount = user.vipRequests.filter(
        (r) => r.status === "REJECTED"
    ).length;

    // VIP Actions
    const handleApproveVip = async (requestId: string) => {
        setLoading(`vip-approve-${requestId}`);
        try {
            const res = await approveVipRequest(requestId);
            if (res.success) {
                toast.success(
                    "VIP verification request approved successfully!"
                );
                router.refresh();
            } else {
                toast.error(res.error || "Failed to approve request");
            }
        } catch {
            toast.error("An error occurred while approving");
        } finally {
            setLoading(null);
        }
    };

    const handleRejectVip = async (requestId: string) => {
        setLoading(`vip-reject-${requestId}`);
        try {
            const res = await rejectVipRequest(requestId);
            if (res.success) {
                toast.success("VIP request rejected.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to reject request");
            }
        } catch {
            toast.error("An error occurred while rejecting");
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteVip = async (requestId: string) => {
        setLoading(`vip-delete-${requestId}`);
        try {
            const res = await deleteVipRequest(requestId);
            if (res.success) {
                toast.success("VIP request deleted.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete request");
            }
        } catch {
            toast.error("An error occurred while deleting");
        } finally {
            setLoading(null);
        }
    };

    const handleClearRejected = async () => {
        setLoading("vip-clear-rejected");
        try {
            const res = await clearRejectedVipRequests(user.id);
            if (res.success) {
                toast.success(`Deleted ${res.deletedCount ?? rejectedCount} rejected record(s).`);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete rejected records");
            }
        } catch {
            toast.error("An error occurred while clearing rejected records");
        } finally {
            setLoading(null);
        }
    };

    // Pro Actions
    const handleGrantPro = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading("grant-pro");
        try {
            const accountId =
                selectedAccountId === "user-level"
                    ? undefined
                    : selectedAccountId;
            let res;
            if (grantType === "permanent") {
                res = await grantManualPro(user.id, grantNote, accountId);
            } else {
                res = await grantGracePeriod(user.id, graceDays, accountId);
            }

            if (res.success) {
                toast.success("Product access granted successfully.");
                setGrantNote("");
                setSelectedAccountId("user-level");
                setGrantType("permanent");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to grant product access");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    const handleRevokePro = async (
        entitlementId: string,
        tradingAccountId?: string | null
    ) => {
        setLoading(`revoke-pro-${entitlementId}`);
        try {
            const res = await revokeProAccess(
                user.id,
                undefined,
                tradingAccountId || undefined,
                entitlementId
            );
            if (res.success) {
                toast.success("Product access removed.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to remove product access");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Partner account verification */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={18} className="text-primary" />{" "}
                            Partner Account Verification
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Review broker account submissions for product access
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {rejectedCount > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClearRejected}
                                disabled={loading === "vip-clear-rejected"}
                                className="h-8 text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10 rounded-lg"
                            >
                                {loading === "vip-clear-rejected" ? (
                                    <Loader2 size={12} className="animate-spin mr-1.5" />
                                ) : (
                                    <Trash2 size={12} className="mr-1.5" />
                                )}
                                Delete Rejected ({rejectedCount})
                            </Button>
                        )}
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                            {user.vipRequests.length} Total
                        </span>
                    </div>
                </div>

                {user.vipRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="p-4 sm:px-6">
                                        Broker & Account
                                    </th>
                                    <th className="p-4">Submitted</th>
                                    <th className="p-4">Evidence</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 sm:px-6 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-sm">
                                {user.vipRequests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="p-4 sm:px-6">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-700 dark:text-white">
                                                    {req.broker}
                                                </p>
                                                <span className="font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                                    #{req.accountNumber}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Balance:{" "}
                                                <span className="font-bold text-gray-700 dark:text-white">
                                                    $
                                                    {parseFloat(
                                                        req.balance
                                                    ).toLocaleString()}
                                                </span>
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                {format(
                                                    new Date(req.createdAt),
                                                    "MMM d, yyyy · HH:mm"
                                                )}
                                            </p>
                                            {req.telegramId && (
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    Telegram: @{req.telegramId.replace("@", "")}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {req.screenshotUrl ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setScreenshotModal(
                                                            req.screenshotUrl
                                                        )
                                                    }
                                                    className="h-auto px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs"
                                                >
                                                    <ImageIcon size={14} className="mr-1.5" /> View
                                                    Proof
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <AlertCircle
                                                        size={14}
                                                        className="text-gray-400"
                                                    />{" "}
                                                    None
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                {req.status === "PENDING" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20">
                                                        <Clock size={12} />{" "}
                                                        Pending
                                                    </span>
                                                )}
                                                {req.status === "APPROVED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                                        <CheckCircle2
                                                            size={12}
                                                        />{" "}
                                                        Approved
                                                    </span>
                                                )}
                                                {req.status === "REJECTED" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                                        <XCircle
                                                            size={12}
                                                        />{" "}
                                                        Rejected
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 sm:px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === "PENDING" && (
                                                    <>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleApproveVip(
                                                                    req.id
                                                                )
                                                            }
                                                            disabled={
                                                                loading ===
                                                                `vip-approve-${req.id}`
                                                            }
                                                            className="h-8 text-xs font-bold rounded-lg"
                                                        >
                                                            {loading ===
                                                            `vip-approve-${req.id}` ? (
                                                                <Loader2
                                                                    size={12}
                                                                    className="animate-spin mr-1"
                                                                />
                                                            ) : null}
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRejectVip(
                                                                    req.id
                                                                )
                                                            }
                                                            disabled={
                                                                loading ===
                                                                `vip-reject-${req.id}`
                                                            }
                                                            className="h-8 text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10 rounded-lg"
                                                        >
                                                            {loading ===
                                                            `vip-reject-${req.id}` ? (
                                                                <Loader2
                                                                    size={12}
                                                                    className="animate-spin mr-1"
                                                                />
                                                            ) : null}
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    aria-label="Delete request"
                                                    onClick={() =>
                                                        handleDeleteVip(req.id)
                                                    }
                                                    disabled={
                                                        loading ===
                                                        `vip-delete-${req.id}`
                                                    }
                                                    className="h-8 text-xs font-bold text-gray-500 hover:text-red-500 border-gray-200 hover:border-red-200 hover:bg-red-50 dark:border-white/10 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 rounded-lg"
                                                >
                                                    {loading ===
                                                    `vip-delete-${req.id}` ? (
                                                        <Loader2
                                                            size={12}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2 size={13} />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50/30 dark:bg-transparent">
                        <p className="text-sm text-gray-500">
                            No VIP verification requests found for this user.
                        </p>
                    </div>
                )}
            </div>

            {/* 2. Current access and management */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left/Middle: Current access */}
                <div className="xl:col-span-2 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <KeyRound
                                    size={18}
                                    className="text-amber-500"
                                />{" "}
                                Current Access
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Product access currently assigned to this user
                                or trading account
                            </p>
                        </div>
                        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                            {activeEntitlements.length} Active
                        </span>
                    </div>

                    {activeEntitlements.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10 flex-1">
                            {activeEntitlements.map((ent) => (
                                <div
                                    key={ent.id}
                                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/20 dark:hover:bg-white/[0.01] transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-bold text-gray-700 dark:text-white">
                                                {ent.broker
                                                    ? `${ent.broker} · #${ent.accountNumberMasked || ent.accountNumber}`
                                                    : "User-level Access (Global)"}
                                            </p>
                                            {ent.tradingAccount?.name && (
                                                <span className="text-xs text-gray-600 font-medium">
                                                    ({ent.tradingAccount.name})
                                                </span>
                                            )}
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                    ent.status === "ACTIVE"
                                                        ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                                        : ent.status === "GRACE"
                                                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                                          : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-500"
                                                }`}
                                            >
                                                {accessStatusLabels[
                                                    ent.status
                                                ] || ent.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {accessSourceLabels[ent.source] ||
                                                ent.source}{" "}
                                            · Started{" "}
                                            {format(
                                                new Date(ent.startsAt),
                                                "MMM d, yyyy"
                                            )}
                                            {ent.expiresAt
                                                ? ` · Ends ${format(new Date(ent.expiresAt), "MMM d, yyyy")}`
                                                : " · Lifetime"}
                                        </p>
                                        {ent.adminNote && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                Note: {ent.adminNote}
                                            </p>
                                        )}
                                    </div>

                                    {ent.status !== "REVOKED" &&
                                        ent.status !== "EXPIRED" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleRevokePro(
                                                        ent.id,
                                                        ent.tradingAccountId ||
                                                            ent.tradingAccount
                                                                ?.id ||
                                                            null
                                                    )
                                                }
                                                disabled={
                                                    loading ===
                                                    `revoke-pro-${ent.id}`
                                                }
                                                className="h-8 text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10 flex items-center gap-1.5 rounded-lg"
                                            >
                                                {loading ===
                                                `revoke-pro-${ent.id}` ? (
                                                    <Loader2
                                                        size={13}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2 size={13} />
                                                )}
                                                Remove Access
                                            </Button>
                                        )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center flex-1 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-transparent">
                            <AlertTriangle
                                className="text-gray-400 mb-2"
                                size={24}
                            />
                            <p className="text-sm text-gray-500">
                                No product access has been assigned to this user.
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                Use the panel on the right to grant access.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Manual access form */}
                <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-white/10 pb-3">
                        <KeyRound size={18} className="text-primary" /> Grant
                        Product Access
                    </h3>

                    <form onSubmit={handleGrantPro} className="space-y-4">
                        {/* Account Select */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                Target Trading Account
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="w-full justify-between px-3 py-2.5 h-auto text-sm font-normal rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-gray-700 dark:text-white"
                                    >
                                        <span className="truncate pr-2">
                                            {selectedAccountId === "user-level"
                                                ? "Global (User-level access)"
                                                : user.tradingAccounts.find(a => a.id === selectedAccountId)
                                                ? `${user.tradingAccounts.find(a => a.id === selectedAccountId)?.broker} · #${user.tradingAccounts.find(a => a.id === selectedAccountId)?.accountNumber}`
                                                : "Select Target Account"}
                                        </span>
                                        <ChevronDown size={16} className="opacity-60 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto rounded-lg p-1.5 shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]"
                                >
                                    <DropdownMenuItem
                                        onClick={() => setSelectedAccountId("user-level")}
                                        className={cn(
                                            "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                                            selectedAccountId === "user-level"
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <span className="truncate">Global (User-level access)</span>
                                        {selectedAccountId === "user-level" && (
                                            <Check size={14} className="text-primary shrink-0" />
                                        )}
                                    </DropdownMenuItem>
                                    {user.tradingAccounts.map((acc) => {
                                        const isSelected = selectedAccountId === acc.id;
                                        return (
                                            <DropdownMenuItem
                                                key={acc.id}
                                                onClick={() => setSelectedAccountId(acc.id)}
                                                className={cn(
                                                    "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                                                    isSelected
                                                        ? "bg-primary/10 text-primary font-semibold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {acc.broker} · #{acc.accountNumber} {acc.name ? `(${acc.name})` : ""}
                                                </span>
                                                {isSelected && (
                                                    <Check size={14} className="text-primary shrink-0" />
                                                )}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Grant Type */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                Access Duration
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setGrantType("permanent")}
                                    className={`py-2 px-3 h-auto text-xs font-bold rounded-lg border transition-all ${
                                        grantType === "permanent"
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-gray-200 dark:border-white/10 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Ongoing
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setGrantType("grace")}
                                    className={`py-2 px-3 h-auto text-xs font-bold rounded-lg border transition-all ${
                                        grantType === "grace"
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-gray-200 dark:border-white/10 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Temporary
                                </Button>
                            </div>
                        </div>

                        {/* Temporary access duration */}
                        {grantType === "grace" && (
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Temporary Access (Days)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={graceDays}
                                    onChange={(e) =>
                                        setGraceDays(
                                            parseInt(e.target.value) || 1
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-sm text-gray-700 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        )}

                        {/* Note */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                Admin Note (Optional)
                            </label>
                            <textarea
                                value={grantNote}
                                onChange={(e) => setGrantNote(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-sm text-gray-700 dark:text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading === "grant-pro"}
                            className="w-full rounded-lg py-2.5 h-auto text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                            {loading === "grant-pro" ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <KeyRound size={14} />
                            )}
                            Grant Product Access
                        </Button>
                    </form>
                </div>
            </div>

            {/* Screenshot Lightbox Modal */}
            <AnimatePresence onExitComplete={releaseLightboxLock}>
            {screenshotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer">
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setScreenshotModal(null)}
                    />
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-[#151925] rounded-xl overflow-hidden p-2 shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={screenshotModal}
                            alt="VIP Verification Screenshot"
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <div className="p-4 flex items-center justify-between">
                            <p className="text-xs text-gray-600 font-medium">
                                VIP verification proof attachment screenshot
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setScreenshotModal(null)}
                                className="h-8 text-xs font-bold rounded-lg"
                            >
                                Close View
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>
        </div>
    );
}
