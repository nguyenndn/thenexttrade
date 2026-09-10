"use client";

import { useState, useEffect } from "react";
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
import { updateTradingAccount } from "@/actions/accounts";
import { updateTradingRules } from "@/actions/trading-rules";
import { saveCloudSyncCredentials, getCloudSyncStatus } from "@/actions/cloud-sync";
import {
    BROKER_INFO,
    SupportedBroker,
} from "@/lib/validations/vip-request";
import { ServerCombobox } from "@/components/trading-accounts/ServerCombobox";
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

export function AccountSettingsModal({
    isOpen,
    onClose,
    account,
    onUpdate,
    onDelete,
}: AccountSettingsModalProps) {
    const [name, setName] = useState(account.name || "");
    const [server, setServer] = useState(account.server || "");
    const [color, setColor] = useState(account.color || "hsl(var(--primary))");
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [investorPassword, setInvestorPassword] = useState("");
    const [hasCredentials, setHasCredentials] = useState(Boolean(account.credential));
    const [isSaving, setIsSaving] = useState(false);

    // Trading Protection Rules state
    const [maxDailyLoss, setMaxDailyLoss] = useState<string>(
        account.maxDailyLoss?.toString() || ""
    );
    const [maxDailyTrades, setMaxDailyTrades] = useState<string>(
        account.maxDailyTrades?.toString() || ""
    );
    const [maxRiskPercent, setMaxRiskPercent] = useState<string>(
        account.maxRiskPercent?.toString() || ""
    );

    // Fetch fresh cloud sync credential status on open
    useEffect(() => {
        if (!isOpen || !account?.id) return;
        let isMounted = true;
        setServer(account.server || "");

        getCloudSyncStatus(account.id)
            .then((res) => {
                if (!isMounted) return;
                if (res.success) {
                    setHasCredentials(Boolean(res.hasCredentials));
                }
            })
            .catch(() => { });

        return () => {
            isMounted = false;
        };
    }, [isOpen, account?.id]);

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

        setIsSaving(true);
        try {
            // 1. Update basic account fields
            const result = await updateTradingAccount(account.id, {
                name: name.trim(),
                color,
                broker: account.broker || undefined,
                server: server.trim() || undefined,
                balance: account.balance,
                currency: account.currency,
            });

            if (result.error) throw new Error(result.error);

            // 2. Save Trading Rules
            const rulesResult = await updateTradingRules(account.id, {
                maxDailyLoss: maxDailyLoss ? parseFloat(maxDailyLoss) : null,
                maxDailyTrades: maxDailyTrades
                    ? parseInt(maxDailyTrades)
                    : null,
                maxRiskPercent: maxRiskPercent
                    ? parseFloat(maxRiskPercent)
                    : null,
                cooldownAfterLosses: null,
            });

            if (rulesResult.error) {
                toast.error("Failed to save trading rules");
            }

            // 3. Save Investor Password if provided
            if (investorPassword.trim()) {
                const credResult = await saveCloudSyncCredentials(
                    account.id,
                    investorPassword.trim(),
                    server.trim() || undefined
                );

                if (!credResult.success) {
                    toast.error(credResult.error || "Failed to update investor password");
                } else {
                    setHasCredentials(true);
                    setInvestorPassword("");
                    toast.success("Investor password encrypted & stored securely");
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
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close settings"
                        className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 shrink-0"
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* General Settings */}
                    <div className="space-y-4">
                        <PremiumInput
                            label="Account Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            prefix={
                                <Popover
                                    open={colorPickerOpen}
                                    onOpenChange={setColorPickerOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer group/color focus:outline-none"
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
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-64 p-3 bg-white dark:bg-[#1E2028] border border-dashboard shadow-2xl rounded-2xl z-[150]"
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
                                                    <button
                                                        type="button"
                                                        key={c}
                                                        onClick={() => {
                                                            setColor(c);
                                                            setColorPickerOpen(false);
                                                        }}
                                                        aria-label={`Select color ${c}`}
                                                        className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
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
                                                    </button>
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
                            helperText="MT5 Broker server name used for automated Cloud Sync"
                        />

                        {/* Account Specs - 2 rows x 2 columns */}
                        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-dashboard divide-y divide-gray-200/60 dark:divide-white/5 text-xs overflow-hidden">
                            {/* Row 1: Account Number & Broker */}
                            <div className="grid grid-cols-2 divide-x divide-gray-200/60 dark:divide-white/5">
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
                            <div className="grid grid-cols-2 divide-x divide-gray-200/60 dark:divide-white/5">
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
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">
                                        {account.platform || "MT5"} ({account.currency || "USD"})
                                    </span>
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
                                    Active & Encrypted
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <KeyRound size={11} className="text-amber-500" />
                                    Password Required
                                </span>
                            )}
                        </div>

                        {/* Domain Realism Notice */}
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2.5">
                            <CloudSync size={16} className="text-primary shrink-0" />
                            <p className="text-[11px] leading-relaxed">
                                Provide your <strong>investor password (passview)</strong> to enable automated Cloud Sync.
                            </p>
                        </div>

                        <div>
                            <PremiumInput
                                type="password"
                                label="Investor Password (Passview)"
                                value={investorPassword}
                                onChange={(e) => setInvestorPassword(e.target.value)}
                                placeholder={
                                    hasCredentials
                                        ? "•••••••••••• (Leave blank to keep existing passview)"
                                        : "Enter investor password (passview)"
                                }
                                helperText={
                                    hasCredentials
                                        ? "Passview encrypted and stored securely. Fill only to update."
                                        : "Enter read-only passview to enable Cloud Sync."
                                }
                            />
                        </div>
                    </div>

                    {/* Capital Preservation Guardrails */}
                    <div className="space-y-4 pt-2 border-t border-dashboard">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <h3 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    Capital Preservation Guardrails
                                </h3>
                            </div>
                            <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg tracking-wider uppercase">
                                Optional
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed -mt-1">
                            Set hard risk limits to prevent revenge trading and drawdowns. System will dispatch breach alerts to your Notification Bell when approaching thresholds.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <PremiumInput
                                label={`Daily Loss (${account.currency || "USD"})`}
                                type="number"
                                value={maxDailyLoss}
                                onChange={(e) => setMaxDailyLoss(e.target.value)}
                            />
                            <PremiumInput
                                label="Max Trades / Day"
                                type="number"
                                value={maxDailyTrades}
                                onChange={(e) => setMaxDailyTrades(e.target.value)}
                            />
                            <PremiumInput
                                label="Max Risk % / Trade"
                                type="number"
                                value={maxRiskPercent}
                                onChange={(e) => setMaxRiskPercent(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* API Configuration */}
                    <div className="space-y-3 pt-2 border-t border-dashboard">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                            <h3 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                API Configuration
                            </h3>
                        </div>

                        <div className="p-3.5 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashboard flex items-start gap-3">
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
                        className="px-3.5 rounded-xl font-bold gap-1.5 text-xs"
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
                            className="px-4 rounded-xl font-bold text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="smd"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 min-w-[120px]"
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
