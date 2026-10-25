"use client";

import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
    Trash2,
    Check,
    X,
    Search,
    ChevronDown,
    RefreshCw,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    Ban,
    RotateCcw,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import { EALicenseWithUser } from "@/types/ea-license";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type GitHubOutcome = {
    githubSynced?: boolean;
    githubSkipped?: boolean;
    githubError?: string;
    syncJobId?: string;
};

/**
 * Describes what actually happened to the GitHub backup. Never claim the
 * backup was updated when the sync was skipped or queued for retry.
 */
function githubOutcomeNote(res: GitHubOutcome): string {
    if (res.githubSynced) return "GitHub backup updated.";
    if (res.githubSkipped) {
        return res.syncJobId
            ? "GitHub backup skipped (GITHUB_TOKEN missing); retry queued."
            : "GitHub backup skipped (GITHUB_TOKEN missing).";
    }
    if (res.syncJobId) {
        return `GitHub backup failed; retry queued. ${res.githubError ?? ""}`.trim();
    }
    return res.githubError
        ? `GitHub backup not updated: ${res.githubError}`
        : "GitHub backup not updated.";
}

function notifyLicenseMutation(message: string, res: GitHubOutcome) {
    const text = `${message} ${githubOutcomeNote(res)}`;
    if (res.githubSynced) {
        toast.success(text);
    } else {
        toast.warning(text);
    }
}
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { ApproveModal } from "@/components/admin/trading-systems/ApproveModal";
import { RejectModal } from "@/components/admin/trading-systems/RejectModal";
import { IssueLicenseModal } from "@/components/admin/trading-systems/IssueLicenseModal";
import {
    deleteLicense,
    syncAllLicensesToGitHub,
    suspendLicense,
    reactivateLicense,
    regenerateAccountLicenseKey,
} from "@/app/admin/trading-systems/accounts/actions";
import { AccountStatus } from "@prisma/client";
import { maskSyncApiKey } from "@/lib/utils/api-key";

interface AccountsTableProps {
    licenses: EALicenseWithUser[];
    brokers?: { name: string; slug: string }[];
}

const DEFAULT_BROKERS = [
    { name: "Exness", slug: "EXNESS" },
    { name: "Vantage", slug: "VANTAGE" },
    { name: "WeTrade", slug: "WETRADE" },
    { name: "Tickmill", slug: "TICKMILL" },
    { name: "IC Markets", slug: "ICMARKETS" },
];

export function AccountsTable({
    licenses,
    brokers = DEFAULT_BROKERS,
}: AccountsTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<AccountStatus | "ALL">(
        "ALL"
    );

    const [selectedLicense, setSelectedLicense] =
        useState<EALicenseWithUser | null>(null);
    const [modalType, setModalType] = useState<"APPROVE" | "REJECT" | null>(
        null
    );
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

    // Confirm Dialog States
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [licenseToDelete, setLicenseToDelete] =
        useState<EALicenseWithUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [licenseToSuspend, setLicenseToSuspend] =
        useState<EALicenseWithUser | null>(null);
    const [isSuspending, setIsSuspending] = useState(false);

    const [licenseToRegenerate, setLicenseToRegenerate] =
        useState<EALicenseWithUser | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const [reactivatingId, setReactivatingId] = useState<string | null>(null);
    const [isSyncingGitHub, setIsSyncingGitHub] = useState(false);

    // Local key reveal & override map (when regenerated)
    const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
    const [keyOverrides, setKeyOverrides] = useState<Record<string, string>>(
        {}
    );

    const toggleRevealKey = (id: string) => {
        setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopyKey = async (key: string, accountNumber: string) => {
        try {
            await navigator.clipboard.writeText(key);
            toast.success(
                `Copied License Key for account #${accountNumber}`
            );
        } catch {
            toast.error("Failed to copy License Key");
        }
    };

    const handleSyncGitHub = async () => {
        setIsSyncingGitHub(true);
        try {
            const res = await syncAllLicensesToGitHub();
            if (res.success) {
                toast.success(
                    `Synced ${res.totalActiveAccounts} active accounts to GitHub backup (accounts.csv)`
                );
            } else {
                toast.error(res.error || "Failed to sync to GitHub");
            }
        } catch {
            toast.error("Failed to sync to GitHub backup");
        } finally {
            setIsSyncingGitHub(false);
        }
    };

    const handleApprove = (license: EALicenseWithUser) => {
        setSelectedLicense(license);
        setModalType("APPROVE");
    };

    const handleReject = (license: EALicenseWithUser) => {
        setSelectedLicense(license);
        setModalType("REJECT");
    };

    const handleReactivate = async (license: EALicenseWithUser) => {
        setReactivatingId(license.id);
        try {
            const res = await reactivateLicense(license.id);
            if (res.success) {
                if (res.licenseKey) {
                    setKeyOverrides((prev) => ({
                        ...prev,
                        [license.id]: res.licenseKey!,
                    }));
                }
                notifyLicenseMutation(
                    `Reactivated license for #${license.accountNumber}.`,
                    res
                );
            } else {
                toast.error(res.error || "Failed to reactivate license");
            }
        } catch {
            toast.error("Failed to reactivate license");
        } finally {
            setReactivatingId(null);
        }
    };

    const handleConfirmSuspend = async () => {
        if (!licenseToSuspend) return;
        setIsSuspending(true);
        try {
            const res = await suspendLicense(
                licenseToSuspend.id,
                "Suspended by Admin from License Manager"
            );
            if (res.success) {
                notifyLicenseMutation(
                    `Suspended license for #${licenseToSuspend.accountNumber}.`,
                    res
                );
                setLicenseToSuspend(null);
            } else {
                toast.error(res.error || "Failed to suspend license");
            }
        } catch {
            toast.error("Failed to suspend license");
        } finally {
            setIsSuspending(false);
        }
    };

    const handleConfirmRegenerateKey = async () => {
        if (!licenseToRegenerate) return;
        setIsRegenerating(true);
        try {
            const res = await regenerateAccountLicenseKey(
                licenseToRegenerate.id
            );
            if (res.success && res.licenseKey) {
                setKeyOverrides((prev) => ({
                    ...prev,
                    [licenseToRegenerate.id]: res.licenseKey!,
                }));
                setRevealedIds((prev) => ({
                    ...prev,
                    [licenseToRegenerate.id]: true,
                }));
                toast.success(
                    `Generated new License Key for #${licenseToRegenerate.accountNumber}: ${res.licenseKey}`
                );
                setLicenseToRegenerate(null);
            } else {
                toast.error(res.error || "Failed to regenerate License Key");
            }
        } catch {
            toast.error("Failed to regenerate License Key");
        } finally {
            setIsRegenerating(false);
        }
    };

    const confirmDelete = (license: EALicenseWithUser) => {
        setLicenseToDelete(license);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!licenseToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteLicense(licenseToDelete.id);
            if (result.success) {
                notifyLicenseMutation(
                    `Revoked license for #${licenseToDelete.accountNumber}. ${
                        result.accountRetained
                            ? "Trading account and history were kept."
                            : ""
                    }`.trim(),
                    result
                );
                setIsConfirmOpen(false);
                setLicenseToDelete(null);
            } else {
                toast.error(result.error);
                setIsConfirmOpen(false);
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete license"
            );
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedLicense(null);
    };

    const filteredLicenses = useMemo(() => {
        return licenses.filter((license) => {
            const searchLower = searchTerm.toLowerCase();
            const effectiveKey =
                keyOverrides[license.id] || license.licenseKey || "";
            const matchesSearch =
                license.accountNumber.toLowerCase().includes(searchLower) ||
                license.user.name?.toLowerCase().includes(searchLower) ||
                license.user.email?.toLowerCase().includes(searchLower) ||
                license.broker.toLowerCase().includes(searchLower) ||
                effectiveKey.toLowerCase().includes(searchLower);

            const matchesStatus =
                filterStatus === "ALL" || license.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [licenses, searchTerm, filterStatus, keyOverrides]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar Card */}
            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors flex-1 w-full max-w-md h-[38px]">
                    <Search
                        size={16}
                        className="text-gray-500"
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        aria-label="Search accounts, users, or license keys"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="md"
                                className="h-[38px] flex items-center justify-between gap-2 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 w-full sm:w-44 group hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                            >
                                <span className="whitespace-nowrap flex items-center gap-1.5 font-medium">
                                    Status:{" "}
                                    <span className="text-primary font-bold">
                                        {filterStatus === "ALL"
                                            ? "All"
                                            : filterStatus}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className="text-gray-500 group-hover:text-primary transition-colors"
                                    aria-hidden="true"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                                onClick={() => setFilterStatus("ALL")}
                            >
                                All Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterStatus("PENDING")}
                            >
                                Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterStatus("APPROVED")}
                            >
                                Approved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterStatus("SUSPENDED")}
                            >
                                Suspended
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterStatus("REJECTED")}
                            >
                                Rejected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterStatus("EXPIRED")}
                            >
                                Expired
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="md"
                        onClick={handleSyncGitHub}
                        disabled={isSyncingGitHub}
                        className="h-[38px] flex items-center gap-2 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 whitespace-nowrap hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                    >
                        <RefreshCw
                            size={14}
                            className={isSyncingGitHub ? "animate-spin" : ""}
                            aria-hidden="true"
                        />
                        <span>
                            {isSyncingGitHub
                                ? "Syncing GitHub..."
                                : "Sync GitHub Backup"}
                        </span>
                    </Button>

                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsIssueModalOpen(true)}
                        className="h-[38px] flex items-center gap-1.5 whitespace-nowrap rounded-lg font-bold"
                    >
                        <Plus size={15} aria-hidden="true" />
                        <span>Grant License</span>
                    </Button>
                </div>
            </div>

            {/* Data Table Card */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col relative w-full flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="px-5 py-4">Account & Broker</th>
                                <th className="px-5 py-4">Trader</th>
                                <th className="px-5 py-4">
                                    License Key (1-Account IB)
                                </th>
                                <th className="px-5 py-4">
                                    Telemetry & Capital
                                </th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Expiry / Note</th>
                                <th className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredLicenses.map((license) => {
                                const effectiveKey =
                                    keyOverrides[license.id] ||
                                    license.licenseKey ||
                                    null;
                                const isRevealed = Boolean(
                                    revealedIds[license.id]
                                );
                                const lastHbDate = license.lastHeartbeat
                                    ? new Date(license.lastHeartbeat)
                                    : null;
                                const isOnline =
                                    lastHbDate &&
                                    Date.now() - lastHbDate.getTime() <
                                        15 * 60 * 1000;

                                return (
                                    <tr
                                        key={license.id}
                                        className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        {/* Account & Broker */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 shrink-0">
                                                    <BrokerLogo
                                                        broker={license.broker}
                                                        size={24}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white font-mono group-hover:text-primary transition-colors">
                                                        #{license.accountNumber}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                        {license.broker.replace(
                                                            "_",
                                                            " "
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Trader */}
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/admin/users/${license.userId}?from=/admin/trading-systems/accounts`}
                                                className="block hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg -m-2 p-2 transition-colors"
                                            >
                                                <p className="font-bold text-gray-800 dark:text-white text-sm hover:text-primary transition-colors">
                                                    {license.user.name ||
                                                        "Trader"}
                                                </p>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                                                    {license.user.email}
                                                </p>
                                            </Link>
                                        </td>

                                        {/* License Key */}
                                        <td className="px-5 py-4">
                                            {effectiveKey ? (
                                                <div className="inline-flex items-center gap-1.5 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5">
                                                    <KeyRound
                                                        size={13}
                                                        className="text-emerald-500 shrink-0"
                                                    />
                                                    <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 select-all">
                                                        {isRevealed
                                                            ? effectiveKey
                                                            : maskSyncApiKey(
                                                                  effectiveKey
                                                              )}
                                                    </span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            toggleRevealKey(
                                                                license.id
                                                            )
                                                        }
                                                        className="h-6 w-6 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                                        aria-label={
                                                            isRevealed
                                                                ? "Hide License Key"
                                                                : "Show License Key"
                                                        }
                                                    >
                                                        {isRevealed ? (
                                                            <EyeOff size={13} />
                                                        ) : (
                                                            <Eye size={13} />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleCopyKey(
                                                                effectiveKey,
                                                                license.accountNumber
                                                            )
                                                        }
                                                        className="h-6 w-6 rounded-md text-gray-500 hover:text-emerald-500"
                                                        aria-label="Copy License Key"
                                                    >
                                                        <Copy size={13} />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">
                                                    Issued upon approval
                                                </span>
                                            )}
                                        </td>

                                        {/* Live Telemetry & Capital */}
                                        <td className="px-5 py-4">
                                            {lastHbDate ? (
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                isOnline
                                                                    ? "bg-emerald-500 animate-pulse"
                                                                    : "bg-gray-400"
                                                            }`}
                                                        />
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            {formatDistanceToNow(
                                                                lastHbDate,
                                                                {
                                                                    addSuffix: true,
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                    {typeof license.balance ===
                                                        "number" && (
                                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                            Bal: $
                                                            {license.balance.toLocaleString(
                                                                "en-US",
                                                                {
                                                                    maximumFractionDigits: 0,
                                                                }
                                                            )}{" "}
                                                            • Eq: $
                                                            {(
                                                                license.equity ??
                                                                license.balance
                                                            ).toLocaleString(
                                                                "en-US",
                                                                {
                                                                    maximumFractionDigits: 0,
                                                                }
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    No EA heartbeat yet
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <StatusBadge
                                                status={license.status}
                                            />
                                        </td>

                                        {/* Expiry / Note */}
                                        <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-300">
                                            <p className="font-semibold">
                                                {license.expiryDate
                                                    ? `Exp: ${format(
                                                          new Date(
                                                              license.expiryDate
                                                          ),
                                                          "dd MMM yyyy"
                                                      )}`
                                                    : "Lifetime IB"}
                                            </p>
                                            {(license.note ||
                                                license.rejectReason) && (
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px] mt-0.5">
                                                    {license.rejectReason ||
                                                        license.note}
                                                </p>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {license.status ===
                                                    AccountStatus.PENDING && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    license
                                                                )
                                                            }
                                                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 w-8 rounded-lg transition-colors"
                                                            aria-label="Approve License"
                                                        >
                                                            <Check size={16} />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleReject(
                                                                    license
                                                                )
                                                            }
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 rounded-lg transition-colors"
                                                            aria-label="Reject License"
                                                        >
                                                            <X size={16} />
                                                        </Button>
                                                    </>
                                                )}

                                                {license.status ===
                                                    AccountStatus.APPROVED && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setLicenseToRegenerate(
                                                                    license
                                                                )
                                                            }
                                                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8 rounded-lg transition-colors"
                                                            aria-label="Regenerate License Key"
                                                        >
                                                            <KeyRound
                                                                size={15}
                                                            />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setLicenseToSuspend(
                                                                    license
                                                                )
                                                            }
                                                            className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8 w-8 rounded-lg transition-colors"
                                                            aria-label="Suspend License"
                                                        >
                                                            <Ban size={15} />
                                                        </Button>
                                                    </>
                                                )}

                                                {(license.status ===
                                                    AccountStatus.SUSPENDED ||
                                                    license.status ===
                                                        AccountStatus.REJECTED ||
                                                    license.status ===
                                                        AccountStatus.EXPIRED) && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        disabled={
                                                            reactivatingId ===
                                                            license.id
                                                        }
                                                        onClick={() =>
                                                            handleReactivate(
                                                                license
                                                            )
                                                        }
                                                        className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 w-8 rounded-lg transition-colors"
                                                        aria-label="Reactivate License"
                                                    >
                                                        <RotateCcw
                                                            size={15}
                                                            className={
                                                                reactivatingId ===
                                                                license.id
                                                                    ? "animate-spin"
                                                                    : ""
                                                            }
                                                        />
                                                    </Button>
                                                )}

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        confirmDelete(license)
                                                    }
                                                    className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 rounded-lg transition-colors"
                                                    aria-label="Revoke License"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredLicenses.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-12 text-center text-gray-600 dark:text-gray-300"
                                    >
                                        {searchTerm || filterStatus !== "ALL"
                                            ? "No matching accounts found for your filters."
                                            : "No accounts found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-gray-200 dark:border-white/10 py-3 px-6 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-auto">
                    <span>
                        Showing {filteredLicenses.length} of {licenses.length}{" "}
                        licenses
                    </span>
                </div>
            </div>

            <ApproveModal
                license={selectedLicense}
                isOpen={modalType === "APPROVE"}
                onClose={closeModal}
            />
            <RejectModal
                license={selectedLicense}
                isOpen={modalType === "REJECT"}
                onClose={closeModal}
            />
            <IssueLicenseModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                brokers={brokers}
            />

            <ConfirmDialog
                isOpen={Boolean(licenseToSuspend)}
                title="Suspend EA License"
                description={`Are you sure you want to suspend account #${licenseToSuspend?.accountNumber}? The EA will stop opening new trades on the next license check and GitHub backup (accounts.csv) will mark it inactive.`}
                confirmText="Suspend License"
                cancelText="Cancel"
                isLoading={isSuspending}
                onConfirm={handleConfirmSuspend}
                onCancel={() => setLicenseToSuspend(null)}
                variant="danger"
            />

            <ConfirmDialog
                isOpen={Boolean(licenseToRegenerate)}
                title="Regenerate License Key"
                description={`Generate a new TNT-XXXX-XXXX-XXXX key for account #${licenseToRegenerate?.accountNumber}? The previous License Key will stop working immediately.`}
                confirmText="Regenerate Key"
                cancelText="Cancel"
                isLoading={isRegenerating}
                onConfirm={handleConfirmRegenerateKey}
                onCancel={() => setLicenseToRegenerate(null)}
                variant="warning"
            />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Revoke License"
                description={`Revoke the EA License for account #${licenseToDelete?.accountNumber}? The License Key stops working immediately and the account is removed from the GitHub backup (accounts.csv). Trading history, journal entries, and the trading account itself are kept.`}
                confirmText="Revoke License"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setLicenseToDelete(null);
                }}
                variant="danger"
            />
        </div>
    );
}
