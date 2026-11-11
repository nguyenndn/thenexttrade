"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import {
    X,
    Check,
    RefreshCw,
    Trash2,
    Shield,
    ShieldCheck,
    CloudSync,
    KeyRound,
    AlertCircle,
    ExternalLink,
    Server,
    Hash,
    Building2,
    Monitor,
    ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { updateTradingAccount } from "@/actions/accounts";
import { updateAccountProfitTargets } from "@/actions/profit-targets";
import {
    saveCloudSyncCredentials,
    getCloudSyncStatus,
    revealTradingAccountPassword,
} from "@/actions/cloud-sync";
import {
    AccountProfitTargetSettings,
    AccountProfitTargetState,
} from "./AccountProfitTargetSettings";
import type { TargetType } from "@/components/dashboard/targets/TargetProgressTypes";
import {
    BROKER_INFO,
    SupportedBroker,
} from "@/lib/validations/vip-request";
import { ServerCombobox } from "@/components/trading-accounts/ServerCombobox";
import { getCurrencyInfo } from "@/lib/utils/cent-account";
import Link from "next/link";

interface AccountSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: any;
    onUpdate: () => void;
    onDelete: () => void;
}

const COLORS = [
    // Row 1: 15 Vibrant & Fresh Shades
    "hsl(var(--primary))", // Primary Green
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#0EA5E9", // Sky
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#A855F7", // Purple
    "#D946EF", // Fuchsia
    "#EC4899", // Pink
    "#F43F5E", // Rose
    "#EF4444", // Red
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#EAB308", // Yellow
    "#84CC16", // Lime
    // Row 2: 15 Deep, Jewel & Pro Tech Shades
    "#059669", // Forest Green
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#0284C7", // Cobalt
    "#1D4ED8", // Navy Blue
    "#4338CA", // Deep Indigo
    "#7C3AED", // Royal Violet
    "#9333EA", // Deep Purple
    "#C026D3", // Magenta Plum
    "#BE123C", // Ruby Wine
    "#DC2626", // Crimson
    "#C2410C", // Rust Orange
    "#B45309", // Bronze
    "#64748B", // Slate
    "#1E293B", // Midnight Zinc
];

const CURRENCY_OPTIONS = [
    { code: "USD", label: "USD ($)" },
    { code: "USC", label: "USC (Cent)" },
    { code: "EUR", label: "EUR (€)" },
    { code: "EUC", label: "EUC (EUR Cent)" },
    { code: "GBP", label: "GBP (£)" },
    { code: "GBC", label: "GBC (GBP Cent)" },
    { code: "JPY", label: "JPY (¥)" },
    { code: "AUD", label: "AUD (A$)" },
    { code: "CAD", label: "CAD (C$)" },
    { code: "CHF", label: "CHF" },
    { code: "NZD", label: "NZD (NZ$)" },
    { code: "SGD", label: "SGD (S$)" },
] as const;

export function AccountSettingsModal({
    isOpen,
    onClose,
    account,
    onUpdate,
    onDelete,
}: AccountSettingsModalProps) {
    const [name, setName] = useState(account.name || "");
    const [server, setServer] = useState(account.server || "");
    const [currency, setCurrency] = useState(
        getCurrencyInfo(account.currency, account.server).code
    );
    const [color, setColor] = useState(account.color || "hsl(var(--primary))");
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const initialHasSavedPassword = Boolean(
        account.hasSavedPassword ?? account.hasCredentials ?? account.credential
    );
    const [investorPassword, setInvestorPassword] = useState("");
    const [loadedSavedPassword, setLoadedSavedPassword] = useState("");
    const [hasCredentials, setHasCredentials] = useState(initialHasSavedPassword);
    const isPasswordDirtyRef = useRef(false);
    const [isSaving, setIsSaving] = useState(false);
    const [targetState, setTargetState] = useState<AccountProfitTargetState>({
        weeklyEnabled: Boolean(account.weeklyTarget && account.weeklyTarget > 0),
        weeklyTarget: account.weeklyTarget ? String(account.weeklyTarget) : "",
        weeklyTargetType: (account.weeklyTargetType as TargetType) || "USD",
        monthlyEnabled: Boolean(account.monthlyTarget && account.monthlyTarget > 0),
        monthlyTarget: account.monthlyTarget ? String(account.monthlyTarget) : "",
        monthlyTargetType: (account.monthlyTargetType as TargetType) || "USD",
    });

    // Fetch fresh cloud sync credential status & prefill saved password on open
    useEffect(() => {
        if (!isOpen || !account?.id) return;
        let isMounted = true;
        const saved = Boolean(
            account.hasSavedPassword ??
                account.hasCredentials ??
                account.credential
        );
        setName(account.name || "");
        setServer(account.server || "");
        setCurrency(getCurrencyInfo(account.currency, account.server).code);
        setColor(account.color || "hsl(var(--primary))");
        isPasswordDirtyRef.current = false;
        setInvestorPassword("");
        setLoadedSavedPassword("");
        setHasCredentials(saved);
        setTargetState({
            weeklyEnabled: Boolean(account.weeklyTarget && account.weeklyTarget > 0),
            weeklyTarget: account.weeklyTarget ? String(account.weeklyTarget) : "",
            weeklyTargetType: (account.weeklyTargetType as TargetType) || "USD",
            monthlyEnabled: Boolean(account.monthlyTarget && account.monthlyTarget > 0),
            monthlyTarget: account.monthlyTarget ? String(account.monthlyTarget) : "",
            monthlyTargetType: (account.monthlyTargetType as TargetType) || "USD",
        });

        let requestedReveal = false;
        const populateSavedPassword = () => {
            if (requestedReveal) return;
            requestedReveal = true;
            revealTradingAccountPassword(account.id)
                .then((pwRes) => {
                    if (!isMounted || !pwRes.success || !pwRes.password) return;
                    setLoadedSavedPassword(pwRes.password);
                    if (!isPasswordDirtyRef.current) {
                        setInvestorPassword(pwRes.password);
                    }
                })
                .catch(() => {});
        };

        if (saved) {
            populateSavedPassword();
        }

        getCloudSyncStatus(account.id)
            .then((res) => {
                if (!isMounted) return;
                if (res.success) {
                    const hasSaved = Boolean(
                        res.hasSavedPassword ?? res.hasCredentials
                    );
                    setHasCredentials(hasSaved);
                    if (hasSaved) {
                        populateSavedPassword();
                    }
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, [isOpen, account?.id, account?.name, account?.server, account?.currency, account?.color, account?.hasSavedPassword, account?.hasCredentials]);

    // Body scroll lock
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    async function handleSave() {
        if (!name.trim()) {
            toast.error("Account name cannot be empty");
            return;
        }

        const weeklyTarget = !targetState.weeklyEnabled
            ? null
            : targetState.weeklyTarget.trim() === ""
            ? null
            : Number(targetState.weeklyTarget);
        const monthlyTarget = !targetState.monthlyEnabled
            ? null
            : targetState.monthlyTarget.trim() === ""
            ? null
            : Number(targetState.monthlyTarget);

        if (targetState.weeklyEnabled && (weeklyTarget === null || !Number.isFinite(weeklyTarget) || weeklyTarget <= 0)) {
            toast.error("Please enter a valid weekly target or uncheck to disable.");
            return;
        }
        if (targetState.monthlyEnabled && (monthlyTarget === null || !Number.isFinite(monthlyTarget) || monthlyTarget <= 0)) {
            toast.error("Please enter a valid monthly target or uncheck to disable.");
            return;
        }
        if (targetState.weeklyEnabled && targetState.weeklyTargetType === "PERCENT" && weeklyTarget !== null && weeklyTarget > 1000) {
            toast.error("Weekly target percentage cannot exceed 1,000%.");
            return;
        }
        if (targetState.monthlyEnabled && targetState.monthlyTargetType === "PERCENT" && monthlyTarget !== null && monthlyTarget > 1000) {
            toast.error("Monthly target percentage cannot exceed 1,000%.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Update basic account fields
            const resolvedCurrency = getCurrencyInfo(
                currency,
                server.trim() || account.server
            ).code;
            const result = await updateTradingAccount(account.id, {
                name: name.trim(),
                color,
                broker: account.broker || undefined,
                server: server.trim() || undefined,
                balance: account.balance,
                currency: resolvedCurrency,
            });

            if (result.error) throw new Error(result.error);

            // 2. Update profit targets
            const targetRes = await updateAccountProfitTargets(account.id, {
                weeklyTarget,
                weeklyTargetType: targetState.weeklyTargetType,
                monthlyTarget,
                monthlyTargetType: targetState.monthlyTargetType,
            });
            if (!targetRes.success) {
                toast.error(targetRes.error || "Failed to update profit targets");
                return;
            }

            // 3. Save Investor Password if provided or modified
            const trimmedPass = investorPassword.trim();
            const shouldSavePassword =
                trimmedPass.length > 0 &&
                (!hasCredentials || trimmedPass !== loadedSavedPassword);

            if (shouldSavePassword) {
                const credResult = await saveCloudSyncCredentials(
                    account.id,
                    trimmedPass,
                    server.trim() || undefined
                );

                if (!credResult.success) {
                    toast.error(credResult.error || "Failed to update investor password");
                    onUpdate();
                    return;
                } else {
                    setHasCredentials(true);
                    setLoadedSavedPassword(trimmedPass);
                    isPasswordDirtyRef.current = false;
                    toast.success("Investor password saved");
                }
            }

            toast.success("Account settings updated successfully");
            onUpdate();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    }

    const brokerDisplayName = account.broker
        ? BROKER_INFO[account.broker as SupportedBroker]?.name ?? account.broker
        : "Unassigned";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                variants={backdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={SPRING_SOFT}
                className="relative z-10 bg-white dark:bg-[#1E2028] rounded-2xl w-full max-w-[540px] overflow-hidden border border-dashboard shadow-2xl flex flex-col max-h-[90vh] cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard relative bg-white dark:bg-[#1E2028] z-10 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Account Settings
                    </h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close settings"
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 shrink-0"
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* General Settings */}
                    <div className="space-y-4">
                        <PremiumInput
                            id="settings-trading-account-name"
                            name="settings_trading_account_name"
                            autoComplete="off"
                            data-lpignore="true"
                            label="Account Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            prefix={
                                <Popover
                                    open={colorPickerOpen}
                                    onOpenChange={setColorPickerOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer group/color focus:outline-none"
                                            title="Choose account color badge"
                                            aria-label="Choose account color badge"
                                        >
                                            <span
                                                className="w-4 h-4 rounded-full border border-black/15 dark:border-white/20 shadow-sm shrink-0 transition-transform group-hover/color:scale-110"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                            <ChevronDown
                                                size={11}
                                                className="text-gray-400 group-hover/color:text-gray-600 dark:group-hover/color:text-gray-300 transition-colors shrink-0"
                                            />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-64 p-3 bg-white dark:bg-[#1E2028] border border-dashboard shadow-2xl rounded-lg z-[150]"
                                        align="start"
                                        sideOffset={8}
                                    >
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-dashboard">
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                                    Account Color Badge
                                                </span>
                                                <span
                                                    className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-6 gap-2 pt-0.5">
                                                {COLORS.map((c) => (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        key={c}
                                                        onClick={() => {
                                                            setColor(c);
                                                            setColorPickerOpen(false);
                                                        }}
                                                        aria-label={`Select color ${c}`}
                                                        className={`w-7 h-7 p-0 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                                                            color === c
                                                                ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1E2028] scale-110"
                                                                : "hover:scale-110 opacity-90 hover:opacity-100"
                                                        }`}
                                                        style={{
                                                            backgroundColor: c,
                                                            boxShadow:
                                                                color === c
                                                                    ? `0 0 8px ${c}80`
                                                                    : "none",
                                                        }}
                                                    >
                                                        {color === c && (
                                                            <Check
                                                                size={13}
                                                                strokeWidth={3}
                                                                className="text-white drop-shadow-md"
                                                            />
                                                        )}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            }
                        />

                        <ServerCombobox
                            value={server}
                            onChange={(val) => setServer(val)}
                            label="Broker Server"
                            required={false}
                            helperText="Optional MT5 broker server name"
                        />

                        {/* Account Specs - 2 rows x 2 columns */}
                        <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-dashboard divide-y divide-gray-200 dark:divide-white/5 text-xs overflow-hidden">
                            {/* Row 1: Account Number & Broker */}
                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/5">
                                <div className="px-4 py-2.5 min-w-0">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                        <Hash size={12} className="text-gray-400 shrink-0" />
                                        Account Number
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums block truncate">
                                        #{account.accountNumber || "N/A"}
                                    </span>
                                </div>
                                <div className="px-4 py-2.5 min-w-0">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                        <Building2 size={12} className="text-gray-400 shrink-0" />
                                        Broker
                                    </span>
                                    <span
                                        className="font-semibold text-gray-800 dark:text-gray-200 block truncate"
                                        title={brokerDisplayName}
                                    >
                                        {brokerDisplayName}
                                    </span>
                                </div>
                            </div>

                            {/* Row 2: Active Server & Platform & Base */}
                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/5">
                                <div className="px-4 py-2.5 min-w-0">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                        <Server size={12} className="text-gray-400 shrink-0" />
                                        Active Server
                                    </span>
                                    <span
                                        className="font-semibold text-gray-800 dark:text-gray-200 font-mono block truncate"
                                        title={server || account.server || "Not configured"}
                                    >
                                        {server || account.server || "Not configured"}
                                    </span>
                                </div>
                                <div className="px-4 py-2.5 min-w-0">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                        <Monitor size={12} className="text-gray-400 shrink-0" />
                                        Platform & Base
                                    </span>
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                            {account.platform || "MT5"}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 py-0 text-[11px] font-bold rounded-md border-dashboard bg-white dark:bg-[#1E2028] text-gray-700 dark:text-gray-200 flex items-center gap-1 shrink-0"
                                                    aria-label="Select account currency"
                                                >
                                                    <span>
                                                        {
                                                            getCurrencyInfo(
                                                                currency,
                                                                server || account.server
                                                            ).label
                                                        }
                                                    </span>
                                                    <ChevronDown size={11} className="text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="min-w-[150px] max-h-60 overflow-y-auto custom-scrollbar z-[220]"
                                            >
                                                {CURRENCY_OPTIONS.map((opt) => (
                                                    <DropdownMenuItem
                                                        key={opt.code}
                                                        onClick={() => setCurrency(opt.code)}
                                                        className="flex items-center justify-between gap-2 text-xs font-medium"
                                                    >
                                                        <span>{opt.label}</span>
                                                        {currency === opt.code && (
                                                            <Check size={13} className="text-primary" />
                                                        )}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cloud Sync & Credentials */}
                    <div className="space-y-4 pt-2 border-t border-dashboard">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <h3 className="text-[11px] font-black text-primary uppercase tracking-widest">
                                    Cloud Sync Credentials
                                </h3>
                            </div>
                            {hasCredentials ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <ShieldCheck size={11} className="text-emerald-500" />
                                    Active & Saved
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <KeyRound size={11} className="text-amber-500" />
                                    Password Required
                                </span>
                            )}
                        </div>

                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2.5">
                            <CloudSync size={16} className="text-primary shrink-0" />
                            <p className="text-[11px] leading-relaxed">
                                Provide your <strong>PASS INVESTOR ( Password also accept )</strong> to enable automated Cloud Sync.
                            </p>
                        </div>

                        <div>
                            <PremiumInput
                                id="settings-investor-password"
                                name="settings_investor_password"
                                type="password"
                                allowCopy
                                autoComplete="new-password"
                                data-lpignore="true"
                                label={
                                    <>
                                        PASS INVESTOR{" "}
                                        <span className="normal-case">
                                            ( Password also accept )
                                        </span>
                                    </>
                                }
                                value={investorPassword}
                                onChange={(e) => {
                                    isPasswordDirtyRef.current = true;
                                    setInvestorPassword(e.target.value);
                                }}
                                helperText={
                                    hasCredentials
                                        ? "Password stored for automated Cloud Sync. Update anytime if changed."
                                        : "Pass investor or master password to enable Cloud Sync."
                                }
                            />
                        </div>
                    </div>


                    {/* Profit Milestones & Targets */}
                    <AccountProfitTargetSettings
                        value={targetState}
                        onChange={setTargetState}
                        currency={
                            getCurrencyInfo(currency, server || account.server)
                                .code
                        }
                    />

                    {/* API Configuration */}
                    <div className="space-y-3 pt-2 border-t border-dashboard">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                            <h3 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                API Configuration
                            </h3>
                        </div>

                        <div className="p-3.5 bg-gray-50 dark:bg-white/[0.02] rounded-lg border border-dashboard flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Shield size={15} className="text-emerald-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-800 dark:text-white">
                                    Unified Sync API Key
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                                    One global key syncs all your connected accounts.
                                </p>
                            </div>
                            <Link
                                href="/dashboard/settings/sync-settings"
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
                            >
                                <span>Settings</span>
                                <ExternalLink size={12} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-dashboard flex items-center justify-between gap-3 bg-white dark:bg-[#1E2028] shrink-0">
                    <Button
                        variant="destructive"
                        size="smd"
                        onClick={onDelete}
                        className="px-3.5 rounded-lg font-bold gap-1.5 text-xs"
                        title="Delete this account"
                    >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete Account</span>
                    </Button>

                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={onClose}
                            className="px-4 rounded-lg font-bold text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="smd"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 rounded-lg font-bold text-xs shadow-lg shadow-amber-500/20 min-w-[120px]"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw
                                        size={14}
                                        className="animate-spin mr-1.5"
                                    />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
