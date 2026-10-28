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
    Clock,
    Image as ImageIcon,
    Loader2,
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
    grantGracePeriod,
    revokeProAccess,
    grantManualPro,
} from "@/actions/vip-request";

interface UserVipProTabProps {
    user: {
        id: string;
        email: string | null;
        name: string | null;
        createdAt?: string | Date;
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
                broker?: string | null;
                accountNumber: string | null;
            } | null;
        }>;
    };
}

export function UserVipProTab({ user }: UserVipProTabProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [screenshotModal, setScreenshotModal] = useState<string | null>(null);

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

    const defaultAccountId =
        user.tradingAccounts.length === 1
            ? user.tradingAccounts[0].id
            : "user-level";

    const [selectedAccountId, setSelectedAccountId] =
        useState<string>(defaultAccountId);
    const [grantType, setGrantType] = useState<"permanent" | "grace">(
        "permanent"
    );

    const activeEntitlements = user.proEntitlements.filter(
        (e) => e.status === "ACTIVE" || e.status === "GRACE"
    );
    const hasRevokedEntitlement = user.proEntitlements.some(
        (e) => e.status === "REVOKED"
    );
    const trialEndsAt = user.createdAt
        ? new Date(
              new Date(user.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
          )
        : null;
    const isTrialActive =
        activeEntitlements.length === 0 &&
        !hasRevokedEntitlement &&
        !!trialEndsAt &&
        Date.now() < trialEndsAt.getTime();

    const pendingRequests = user.vipRequests.filter(
        (r) => r.status === "PENDING"
    );

    const handleApproveVip = async (requestId: string) => {
        setLoading(`vip-approve-${requestId}`);
        try {
            const res = await approveVipRequest(requestId);
            if (res.success) {
                toast.success("VIP verification approved.");
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

    const handleGrantPro = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading("grant-pro");
        try {
            const accountId =
                selectedAccountId === "user-level"
                    ? undefined
                    : selectedAccountId;
            const res =
                grantType === "permanent"
                    ? await grantManualPro(user.id, undefined, accountId)
                    : await grantGracePeriod(user.id, 14, accountId);

            if (res.success) {
                toast.success("Pro Plan granted.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to grant Pro access");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    const handleRevokePro = async (
        entitlementId?: string,
        tradingAccountId?: string | null
    ) => {
        const loadingKey = entitlementId
            ? `revoke-pro-${entitlementId}`
            : "revoke-pro-all";
        setLoading(loadingKey);
        try {
            const res = await revokeProAccess(
                user.id,
                undefined,
                tradingAccountId || undefined,
                entitlementId
            );
            if (res.success) {
                toast.success("Updated to Free Plan.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to update plan");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    const selectedAccount = user.tradingAccounts.find(
        (a) => a.id === selectedAccountId
    );

    return (
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
            {/* Compact Plan Control Bar */}
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <KeyRound size={16} className="text-primary shrink-0" />
                        <span className="text-sm font-bold text-gray-800 dark:text-white">
                            User Plan:
                        </span>
                        {activeEntitlements.length > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                PRO PLAN
                            </span>
                        ) : isTrialActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                7-DAY TRIAL
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400">
                                FREE PLAN
                            </span>
                        )}

                        {(activeEntitlements.length > 0 || isTrialActive) && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokePro(undefined, null)}
                                disabled={loading === "revoke-pro-all"}
                                className="h-7 px-2.5 text-[11px] font-bold text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10 rounded-lg"
                            >
                                {loading === "revoke-pro-all" ? (
                                    <Loader2
                                        size={12}
                                        className="animate-spin mr-1"
                                    />
                                ) : (
                                    <Trash2 size={12} className="mr-1" />
                                )}
                                Set to Free Plan
                            </Button>
                        )}
                    </div>

                    {activeEntitlements.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                            {activeEntitlements.map((ent) => {
                                const broker =
                                    ent.broker || ent.tradingAccount?.broker;
                                const acct =
                                    ent.accountNumberMasked ||
                                    ent.accountNumber ||
                                    ent.tradingAccount?.accountNumber;
                                const label =
                                    broker && acct
                                        ? `${broker} #${acct}`
                                        : "Global (All Accounts)";
                                return (
                                    <span
                                        key={ent.id}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium text-[11px]"
                                    >
                                        <span>{label}</span>
                                        <span className="text-gray-400">·</span>
                                        <span>
                                            {ent.expiresAt
                                                ? `Ends ${format(new Date(ent.expiresAt), "MMM d")}`
                                                : "Lifetime"}
                                        </span>
                                        {activeEntitlements.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                aria-label={`Remove Pro from ${label}`}
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
                                                className="h-4 w-4 p-0 ml-0.5 text-gray-400 hover:text-red-500"
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    ) : isTrialActive && trialEndsAt ? (
                        <p className="text-xs text-gray-500">
                            7-Day Free Trial ends{" "}
                            {format(trialEndsAt, "MMM d, yyyy")}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500">
                            Standard Free tier — select an account on the right
                            to grant Pro access.
                        </p>
                    )}
                </div>

                {/* Inline Quick Grant Controls */}
                <form
                    onSubmit={handleGrantPro}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0"
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                type="button"
                                className="h-9 px-3 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-gray-700 dark:text-white justify-between min-w-[180px]"
                            >
                                <span className="truncate pr-2">
                                    {selectedAccountId === "user-level"
                                        ? "Global (All Accounts)"
                                        : selectedAccount
                                          ? `${selectedAccount.broker} · #${selectedAccount.accountNumber}`
                                          : "Select Account"}
                                </span>
                                <ChevronDown
                                    size={14}
                                    className="opacity-60 shrink-0"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-60 max-h-60 overflow-y-auto rounded-lg p-1.5 shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]"
                        >
                            <DropdownMenuItem
                                onClick={() =>
                                    setSelectedAccountId("user-level")
                                }
                                className={cn(
                                    "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer",
                                    selectedAccountId === "user-level"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-gray-700 dark:text-gray-300"
                                )}
                            >
                                <span>Global (All Accounts)</span>
                                {selectedAccountId === "user-level" && (
                                    <Check size={14} className="text-primary" />
                                )}
                            </DropdownMenuItem>
                            {user.tradingAccounts.map((acc) => {
                                const isSelected = selectedAccountId === acc.id;
                                return (
                                    <DropdownMenuItem
                                        key={acc.id}
                                        onClick={() =>
                                            setSelectedAccountId(acc.id)
                                        }
                                        className={cn(
                                            "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer",
                                            isSelected
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "text-gray-700 dark:text-gray-300"
                                        )}
                                    >
                                        <span className="truncate">
                                            {acc.broker} · #{acc.accountNumber}
                                        </span>
                                        {isSelected && (
                                            <Check
                                                size={14}
                                                className="text-primary shrink-0"
                                            />
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                type="button"
                                className="h-9 px-3 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-gray-700 dark:text-white justify-between min-w-[125px]"
                            >
                                <span>
                                    {grantType === "permanent"
                                        ? "Lifetime Pro"
                                        : "14-Day Grace"}
                                </span>
                                <ChevronDown
                                    size={14}
                                    className="opacity-60 ml-1.5 shrink-0"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-40 rounded-lg p-1.5 shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]"
                        >
                            <DropdownMenuItem
                                onClick={() => setGrantType("permanent")}
                                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer"
                            >
                                <span>Lifetime Pro</span>
                                {grantType === "permanent" && (
                                    <Check size={14} className="text-primary" />
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setGrantType("grace")}
                                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer"
                            >
                                <span>14-Day Grace</span>
                                {grantType === "grace" && (
                                    <Check size={14} className="text-primary" />
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading === "grant-pro"}
                        className="h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                        {loading === "grant-pro" ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <KeyRound size={13} />
                        )}
                        Grant Pro
                    </Button>
                </form>
            </div>

            {/* Pending Partner Verification Strip (Only rendered when there are PENDING requests) */}
            {pendingRequests.length > 0 && (
                <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-3 sm:px-5 space-y-2">
                    {pendingRequests.map((req) => (
                        <div
                            key={req.id}
                            className="flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    <Clock size={12} /> Pending VIP Request
                                </span>
                                <span className="font-bold text-gray-800 dark:text-white">
                                    {req.broker} #{req.accountNumber}
                                </span>
                                <span className="text-gray-500">
                                    · Balance: $
                                    {parseFloat(req.balance).toLocaleString()}
                                </span>
                                {req.telegramId && (
                                    <span className="text-gray-500">
                                        · @{req.telegramId.replace("@", "")}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {req.screenshotUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setScreenshotModal(
                                                req.screenshotUrl
                                            )
                                        }
                                        className="h-7 px-2.5 text-xs rounded-lg"
                                    >
                                        <ImageIcon
                                            size={12}
                                            className="mr-1"
                                        />
                                        Proof
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleApproveVip(req.id)}
                                    disabled={
                                        loading === `vip-approve-${req.id}`
                                    }
                                    className="h-7 px-2.5 text-xs font-bold rounded-lg"
                                >
                                    Approve
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectVip(req.id)}
                                    disabled={
                                        loading === `vip-reject-${req.id}`
                                    }
                                    className="h-7 px-2.5 text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10 rounded-lg"
                                >
                                    Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
