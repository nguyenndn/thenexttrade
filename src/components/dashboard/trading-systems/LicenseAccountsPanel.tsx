"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Key,
    Plus,
    Copy,
    Check,
    Eye,
    EyeOff,
    Clock,
    CheckCircle2,
    XCircle,
    Shield,
    Trash2,
    Wallet,
    ArrowRight,
    Bot,
    CheckSquare,
    Square,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Edit3,
    Crown,
    Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
    submitMultipleAccountRequests,
    cancelAccountRequest,
    removeAccount,
    updateTradingAccountLoginNumber,
} from "@/app/dashboard/trading-systems/actions";
import { maskSyncApiKey } from "@/lib/utils/api-key";

export interface AccountLicenseItem {
    id: string;
    licenseId: string | null;
    accountNumber: string;
    broker: string;
    status: "APPROVED" | "PENDING" | "REJECTED" | "EXPIRED" | "SUSPENDED";
    licenseKey: string | null;
    rejectReason?: string | null;
}

export interface SelectableTradingAccount {
    id: string;
    name: string;
    broker: string;
    accountNumber: string | null;
    platform: string;
    accountType: string | null;
    balance: number;
    currency: string;
    licenseStatus:
        | "APPROVED"
        | "PENDING"
        | "REJECTED"
        | "EXPIRED"
        | "SUSPENDED"
        | "UNREGISTERED";
}

interface LicenseAccountsPanelProps {
    items: AccountLicenseItem[];
    userTradingAccounts?: SelectableTradingAccount[];
    hasApprovedLicense?: boolean;
    vipLink?: string | null;
}

export function LicenseAccountsPanel({
    items,
    userTradingAccounts = [],
    hasApprovedLicense = false,
    vipLink = null,
}: LicenseAccountsPanelProps) {
    const [showAddForm, setShowAddForm] = useState(items.length === 0);
    const [showWebRequestGuide, setShowWebRequestGuide] = useState(false);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
    const [editingAccountId, setEditingAccountId] = useState<string | null>(
        null
    );
    const [accountNumberInput, setAccountNumberInput] = useState("");
    const [savingAccountNumId, setSavingAccountNumId] = useState<string | null>(
        null
    );

    // Accounts that can be selected to request a license
    const eligibleAccounts = userTradingAccounts.filter(
        (acc) =>
            Boolean(acc.accountNumber && acc.accountNumber.trim()) &&
            (acc.licenseStatus === "UNREGISTERED" ||
                acc.licenseStatus === "REJECTED" ||
                acc.licenseStatus === "EXPIRED")
    );

    const toggleSelectAccount = (accountId: string) => {
        setSelectedAccountIds((prev) =>
            prev.includes(accountId)
                ? prev.filter((id) => id !== accountId)
                : [...prev, accountId]
        );
    };

    const handleSelectAllEligible = () => {
        if (selectedAccountIds.length === eligibleAccounts.length) {
            setSelectedAccountIds([]);
        } else {
            setSelectedAccountIds(eligibleAccounts.map((a) => a.id));
        }
    };

    const handleCopy = async (id: string, key: string) => {
        try {
            await navigator.clipboard.writeText(key);
            setCopiedId(id);
            toast.success("License Key copied to clipboard");
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error("Failed to copy License Key");
        }
    };

    const handleSubmitSelected = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAccountIds.length === 0) {
            toast.error(
                "Please select at least one trading account to request a license."
            );
            return;
        }
        setSubmitting(true);
        try {
            const res = await submitMultipleAccountRequests(selectedAccountIds);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(
                    `Submitted ${res.submittedCount} trading account(s) for IB license verification.`
                );
                setSelectedAccountIds([]);
                setShowAddForm(false);
            }
        } catch {
            toast.error("Failed to submit trading account request.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveOrCancel = async (item: AccountLicenseItem) => {
        setBusyId(item.id);
        try {
            const res =
                item.status === "PENDING" && item.licenseId
                    ? await cancelAccountRequest(item.licenseId)
                    : await removeAccount({
                          licenseId: item.licenseId,
                          accountNumber: item.accountNumber,
                          broker: item.broker,
                      });
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(
                    `Account #${item.accountNumber} removed from EA Licenses.`
                );
            }
        } catch {
            toast.error("Failed to remove account license.");
        } finally {
            setBusyId(null);
        }
    };

    const handleSaveAccountNumber = async (tradingAccountId: string) => {
        if (!accountNumberInput.trim()) {
            toast.error("Please enter your MT4/MT5 Account Login ID.");
            return;
        }
        setSavingAccountNumId(tradingAccountId);
        try {
            const res = await updateTradingAccountLoginNumber(
                tradingAccountId,
                accountNumberInput
            );
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(
                    `Saved MT4/MT5 Account #${res.accountNumber}. You can now request a license.`
                );
                setEditingAccountId(null);
                setAccountNumberInput("");
                setSelectedAccountIds((prev) =>
                    prev.includes(tradingAccountId)
                        ? prev
                        : [...prev, tradingAccountId]
                );
            }
        } catch {
            toast.error("Failed to update MT4/MT5 account number.");
        } finally {
            setSavingAccountNumId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-[#14161E] rounded-xl border border-dashboard dark:border-white/[0.08] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Key size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                EA License Keys
                            </h3>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                1 Account License = Unlocks All 3 EAs
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Each MT5/MT4 trading account verified under our IB
                            network receives 1 unified License Key that unlocks
                            all 3 Expert Advisors (Trade Manager,
                            GoldScalperNinja, and Apex Gold Sentinel).
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {!hasApprovedLicense ? (
                        <Link
                            href="/dashboard/accounts?action=add&intent=unlock-pro"
                            className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 inline-flex items-center gap-1.5"
                            )}
                        >
                            <Crown size={14} className="text-amber-500" />
                            <span>Unlock Partner Pro Free</span>
                            <ArrowRight size={13} />
                        </Link>
                    ) : vipLink ? (
                        <a
                            href={vipLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "rounded-lg text-xs font-bold text-[#2AABEE] border-[#2AABEE]/30 hover:bg-[#2AABEE]/10 inline-flex items-center gap-1.5"
                            )}
                        >
                            <Send size={13} />
                            <span>VIP Telegram</span>
                        </a>
                    ) : null}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setShowWebRequestGuide((prev) => !prev)
                        }
                        className="rounded-lg text-xs font-bold"
                    >
                        <HelpCircle size={14} />
                        <span>MT5 WebRequest Setup (30s)</span>
                        {showWebRequestGuide ? (
                            <ChevronUp size={13} />
                        ) : (
                            <ChevronDown size={13} />
                        )}
                    </Button>
                    {!showAddForm && (
                        <Button
                            variant="gold"
                            size="sm"
                            onClick={() => setShowAddForm(true)}
                            className="rounded-lg font-bold shrink-0"
                        >
                            <Plus size={15} />
                            <span>Register Trading Account</span>
                        </Button>
                    )}
                </div>
            </div>

            {showWebRequestGuide && (
                <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/[0.06] border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            30-Second MetaTrader 5 WebRequest Configuration
                            (Prevents Error 4014 / 4060)
                        </h4>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowWebRequestGuide(false)}
                            className="rounded-lg h-7 text-xs"
                        >
                            Close
                        </Button>
                    </div>
                    <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
                        <li>
                            In MetaTrader 5, open{" "}
                            <span className="font-bold">Tools → Options</span>{" "}
                            (or press{" "}
                            <kbd className="px-1.5 py-0.5 rounded-lg bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 font-mono text-[11px]">
                                Ctrl + O
                            </kbd>
                            ).
                        </li>
                        <li>
                            Select the{" "}
                            <span className="font-bold">Expert Advisors</span>{" "}
                            tab and check{" "}
                            <span className="font-bold">
                                &ldquo;Allow WebRequest for listed URL&rdquo;
                            </span>
                            .
                        </li>
                        <li>
                            Add the following URLs so both the Primary License
                            Server and High-Availability Backup Server can
                            verify your account:
                        </li>
                    </ol>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                            "https://thenexttrade.com",
                            "https://api.github.com",
                            "https://raw.githubusercontent.com",
                        ].map((url) => (
                            <div
                                key={url}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#161922] border border-dashboard dark:border-white/10"
                            >
                                <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">
                                    {url}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    aria-label={`Copy ${url}`}
                                    onClick={() => handleCopy(url, url)}
                                    className="rounded-lg h-7 px-2 text-[11px] shrink-0"
                                >
                                    {copiedId === url ? (
                                        <Check size={12} />
                                    ) : (
                                        <Copy size={12} />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showAddForm && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-dashboard dark:border-white/[0.08] space-y-4">
                    {userTradingAccounts.length === 0 ? (
                        <div className="py-6 px-4 text-center space-y-3">
                            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                                <Wallet size={20} />
                            </div>
                            <div className="max-w-md mx-auto">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                    No Trading Accounts Found
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    You have not added any MT4/MT5 trading
                                    accounts yet. Please add your trading
                                    account in{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        Trading Accounts
                                    </span>{" "}
                                    first, then return here to request your EA
                                    License Key.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-1">
                                {items.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAddForm(false)}
                                        className="rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Link
                                    href="/dashboard/accounts"
                                    className={cn(
                                        buttonVariants({ variant: "gold", size: "sm" }),
                                        "rounded-lg font-bold inline-flex items-center gap-1.5"
                                    )}
                                >
                                    <span>Go to Trading Accounts</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmitSelected}
                            className="space-y-3"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Select Trading Accounts to Request IB
                                        License
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Select one or multiple accounts below.
                                        Need to add a new account?{" "}
                                        <Link
                                            href="/dashboard/accounts"
                                            className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            <span>Manage Trading Accounts</span>
                                            <ArrowRight size={11} />
                                        </Link>
                                    </p>
                                </div>

                                {eligibleAccounts.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAllEligible}
                                        className="rounded-lg h-8 text-xs font-bold shrink-0"
                                    >
                                        {selectedAccountIds.length ===
                                        eligibleAccounts.length
                                            ? "Deselect All"
                                            : `Select All Available (${eligibleAccounts.length})`}
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                                {userTradingAccounts.map((acc) => {
                                    const hasAccountNum = Boolean(
                                        acc.accountNumber &&
                                            acc.accountNumber.trim()
                                    );
                                    const isSelectable =
                                        hasAccountNum &&
                                        (acc.licenseStatus === "UNREGISTERED" ||
                                            acc.licenseStatus === "REJECTED" ||
                                            acc.licenseStatus === "EXPIRED");
                                    const isSelected =
                                        selectedAccountIds.includes(acc.id);

                                    return (
                                        <div
                                            key={acc.id}
                                            onClick={() => {
                                                if (isSelectable) {
                                                    toggleSelectAccount(acc.id);
                                                }
                                            }}
                                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                                isSelectable
                                                    ? isSelected
                                                        ? "cursor-pointer bg-amber-500/10 border-amber-500/50 dark:bg-amber-500/10"
                                                        : "cursor-pointer bg-white dark:bg-[#1A1D27] border-dashboard dark:border-white/10 hover:border-amber-500/30"
                                                    : "opacity-70 bg-gray-100/70 dark:bg-white/[0.02] border-gray-200 dark:border-white/5 cursor-not-allowed"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="shrink-0 text-amber-500">
                                                    {isSelectable ? (
                                                        isSelected ? (
                                                            <CheckSquare
                                                                size={18}
                                                            />
                                                        ) : (
                                                            <Square
                                                                size={18}
                                                                className="text-gray-400"
                                                            />
                                                        )
                                                    ) : acc.licenseStatus ===
                                                      "APPROVED" ? (
                                                        <CheckCircle2
                                                            size={18}
                                                            className="text-emerald-500"
                                                        />
                                                    ) : (
                                                        <Clock
                                                            size={18}
                                                            className="text-amber-500"
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                            {acc.name ||
                                                                acc.broker}
                                                        </span>
                                                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                                                            {acc.accountNumber
                                                                ? `#${acc.accountNumber}`
                                                                : "No Login ID"}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                        {acc.broker || "Broker"}{" "}
                                                        • {acc.platform} •{" "}
                                                        {acc.currency}{" "}
                                                        {acc.balance.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                {!hasAccountNum ? (
                                                    editingAccountId ===
                                                    acc.id ? (
                                                        <div
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="flex items-center gap-1.5"
                                                        >
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={
                                                                    accountNumberInput
                                                                }
                                                                onChange={(e) =>
                                                                    setAccountNumberInput(
                                                                        e.target.value.replace(
                                                                            /\D/g,
                                                                            ""
                                                                        )
                                                                    )
                                                                }
                                                                aria-label="MT4 or MT5 Account Login Number"
                                                                className="w-28 h-7 px-2 rounded-lg text-xs font-mono bg-white dark:bg-[#0B0E14] border border-amber-500/40 text-gray-900 dark:text-white focus:outline-none"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="gold"
                                                                size="sm"
                                                                disabled={
                                                                    savingAccountNumId ===
                                                                    acc.id
                                                                }
                                                                onClick={() =>
                                                                    handleSaveAccountNumber(
                                                                        acc.id
                                                                    )
                                                                }
                                                                className="rounded-lg h-7 px-2 text-[10px] font-bold"
                                                            >
                                                                {savingAccountNumId ===
                                                                acc.id
                                                                    ? "..."
                                                                    : "Save"}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            title="Click to enter your MT4/MT5 Account Login ID so you can request a license"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingAccountId(
                                                                    acc.id
                                                                );
                                                                setAccountNumberInput(
                                                                    ""
                                                                );
                                                            }}
                                                            className="rounded-lg h-7 px-2.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                        >
                                                            <Edit3 size={11} />
                                                            <span>
                                                                Set MT4/MT5 #
                                                            </span>
                                                        </Button>
                                                    )
                                                ) : acc.licenseStatus ===
                                                  "APPROVED" ? (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        Licensed
                                                    </span>
                                                ) : acc.licenseStatus ===
                                                  "PENDING" ? (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        Pending
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                                        {acc.licenseStatus ===
                                                        "UNREGISTERED"
                                                            ? "Available"
                                                            : acc.licenseStatus}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                                <Link
                                    href="/dashboard/accounts"
                                    className={cn(
                                        buttonVariants({ variant: "outline", size: "sm" }),
                                        "rounded-lg text-xs inline-flex items-center gap-1.5"
                                    )}
                                >
                                    <Plus size={13} />
                                    <span>Add New Account</span>
                                </Link>

                                <div className="flex items-center gap-2">
                                    {items.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setShowAddForm(false)
                                            }
                                            className="rounded-lg"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="gold"
                                        size="sm"
                                        disabled={
                                            submitting ||
                                            selectedAccountIds.length === 0
                                        }
                                        className="rounded-lg font-bold"
                                    >
                                        {submitting
                                            ? "Submitting..."
                                            : selectedAccountIds.length > 0
                                              ? `Request License (${selectedAccountIds.length} Selected)`
                                              : "Request Account License"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {items.length > 0 && (
                <div className="divide-y divide-gray-100 dark:divide-white/[0.06] border border-dashboard dark:border-white/[0.08] rounded-xl overflow-hidden">
                    {items.map((item) => {
                        const isRevealed = Boolean(revealedIds[item.id]);
                        return (
                            <div
                                key={item.id}
                                className="p-3.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#161922]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-dashboard dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300">
                                        {item.broker}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                                #{item.accountNumber}
                                            </span>
                                            {item.status === "APPROVED" ? (
                                                <>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle2
                                                            size={11}
                                                        />
                                                        IB Verified • Lifetime
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                        <Bot size={11} />
                                                        All 3 EAs Unlocked
                                                    </span>
                                                </>
                                            ) : item.status === "PENDING" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                    <Clock size={11} />
                                                    Pending IB Verification
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                    <XCircle size={11} />
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                        {item.rejectReason && (
                                            <p className="text-xs text-rose-500 mt-0.5">
                                                Reason: {item.rejectReason}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {item.status === "APPROVED" &&
                                    item.licenseKey ? (
                                        <>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-black/40 border border-dashboard dark:border-white/10 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                                                <Shield size={12} />
                                                <span>
                                                    {isRevealed
                                                        ? item.licenseKey
                                                        : maskSyncApiKey(
                                                              item.licenseKey
                                                          )}
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                aria-label={
                                                    isRevealed
                                                        ? "Hide license key"
                                                        : "Show license key"
                                                }
                                                onClick={() =>
                                                    setRevealedIds((prev) => ({
                                                        ...prev,
                                                        [item.id]:
                                                            !prev[item.id],
                                                    }))
                                                }
                                                className="rounded-lg h-8 w-8 p-0"
                                            >
                                                {isRevealed ? (
                                                    <EyeOff size={14} />
                                                ) : (
                                                    <Eye size={14} />
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="gold"
                                                size="sm"
                                                onClick={() =>
                                                    handleCopy(
                                                        item.id,
                                                        item.licenseKey!
                                                    )
                                                }
                                                className="rounded-lg h-8 text-xs font-bold"
                                            >
                                                {copiedId === item.id ? (
                                                    <>
                                                        <Check size={13} />
                                                        <span>Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={13} />
                                                        <span>
                                                            Copy License Key
                                                        </span>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                aria-label={`Remove account #${item.accountNumber}`}
                                                disabled={busyId === item.id}
                                                onClick={() =>
                                                    handleRemoveOrCancel(item)
                                                }
                                                className="rounded-lg h-8 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
                                            >
                                                <Trash2 size={13} />
                                                <span>Remove</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.status === "PENDING"
                                                    ? "License Key unlocks once IB attribution is verified"
                                                    : "License Key unavailable"}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                aria-label={`Remove account #${item.accountNumber}`}
                                                disabled={busyId === item.id}
                                                onClick={() =>
                                                    handleRemoveOrCancel(item)
                                                }
                                                className="rounded-lg h-8 text-xs"
                                            >
                                                <Trash2 size={13} />
                                                <span>
                                                    {item.status === "PENDING"
                                                        ? "Cancel"
                                                        : "Remove"}
                                                </span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
