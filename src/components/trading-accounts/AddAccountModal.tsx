"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import {
    X,
    Copy,
    Check,
    ChevronDown,
    Loader2,
    Wallet,
    UserPlus,
    ArrowRight,
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    AlertTriangle,
    ExternalLink,
    Mail,
    CloudSync,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";

const ACCOUNT_COLORS = [
    "hsl(var(--primary))",
    "#10B981",
    "#3B82F6",
    "#0EA5E9",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#D946EF",
    "#EC4899",
    "#F43F5E",
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#EAB308",
    "#84CC16",
    "#14B8A6",
    "#06B6D4",
    "#64748B",
    "#475569",
    "#1E293B",
];
import { createTradingAccount } from "@/actions/accounts";
import { saveCloudSyncCredentials } from "@/actions/cloud-sync";
import {
    createPartnerProAccount,
    upgradeToPartnerPro,
} from "@/actions/account-pro";
import { trackEvent } from "@/lib/track";
import { trackBrokerClick } from "@/actions/ib-lead";
import { SyncTroubleshootingPanel } from "@/components/trading-accounts/SyncTroubleshootingPanel";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import {
    BROKER_INFO,
    SUPPORTED_BROKERS,
    SupportedBroker,
} from "@/lib/validations/vip-request";
import { ServerCombobox } from "@/components/trading-accounts/ServerCombobox";
import Image from "next/image";

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (account: any) => void;
    initialMode?: "chooser" | "free" | "pro" | "upgrade-pro";
    setupSyncMethod?: "TNT_CONNECT" | "EA_SYNC" | "MANUAL";
    sourceAccount?: {
        id: string;
        name: string;
        broker: string | null;
        accountNumber: string | null;
        balance?: number | null;
        accountType?: string | null;
        server?: string | null;
    };
    userEmail?: string;
    userName?: string;
    userTelegramId?: string;
    userCountry?: string;
}

type Step =
    | "chooser"
    | "free-create"
    | "free-setup"
    | "pro-broker"
    | "pro-status"
    | "pro-details"
    | "pro-review"
    | "pro-success"
    | "upgrade-pro"; // prefilled upgrade form

export function AddAccountModal({
    isOpen,
    onClose,
    onSuccess,
    initialMode = "chooser",
    setupSyncMethod = "TNT_CONNECT",
    sourceAccount,
    userEmail = "",
    userName = "",
    userTelegramId = "",
    userCountry = "",
}: AddAccountModalProps) {
    const [step, setStep] = useState<Step>(
        initialMode === "free"
            ? "free-create"
            : initialMode === "pro"
                ? "pro-broker"
                : initialMode === "upgrade-pro"
                    ? "upgrade-pro"
                    : "chooser"
    );
    const [isPending, startTransition] = useTransition();

    // Reset when opened/closed
    useEffect(() => {
        if (isOpen) {
            setStep(
                initialMode === "free"
                    ? "free-create"
                    : initialMode === "pro"
                        ? "pro-broker"
                        : initialMode === "upgrade-pro"
                            ? "upgrade-pro"
                            : "chooser"
            );
            // Reset state
            setName("");
            setColor("hsl(var(--primary))");
            setCreatedAccount(null);
            setCopied(false);
            setFreeAccountNumber("");
            setFreeServer("");

            setSelectedBroker(null);
            setAccountStatus(null);
            // Prefill from sourceAccount if upgrade-pro
            setAccountNumber(sourceAccount?.accountNumber ?? "");
            setBalance(
                sourceAccount?.balance != null
                    ? String(sourceAccount.balance)
                    : ""
            );
            setTelegramId(userTelegramId);
            setFullName(userName);
            setCountry(userCountry);
            setProServer(sourceAccount?.server ?? "");
            setError(null);
        }
    }, [isOpen, initialMode, userName, sourceAccount]);

    // Body scroll lock: lock while open, release on exit complete, safety net on unmount.
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
    }, [isOpen]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const releaseLock = () => {
        document.body.style.overflow = "unset";
    };

    // --- Free Account State ---
    const platform = "MT5";
    const [name, setName] = useState("");
    const [freeAccountNumber, setFreeAccountNumber] = useState("");
    const [freeServer, setFreeServer] = useState("");
    // Optional on free create — lets users who already hold a supported broker
    // account set it up front instead of being stuck in MISSING_ACCOUNT_INFO
    // for Pro eligibility until they edit Settings.
    const [freeBroker, setFreeBroker] = useState<string>("");
    const [color, setColor] = useState("hsl(var(--primary))");
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const [investorPassword, setInvestorPassword] = useState("");
    const [createdAccount, setCreatedAccount] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    // --- Partner Pro State ---
    const [selectedBroker, setSelectedBroker] =
        useState<SupportedBroker | null>(null);
    const [accountStatus, setAccountStatus] = useState<
        "new" | "existing" | null
    >(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [balance, setBalance] = useState("");
    const [telegramId, setTelegramId] = useState(userTelegramId);
    const [fullName, setFullName] = useState(userName);
    const [country, setCountry] = useState(userCountry);
    const [proServer, setProServer] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState("");

    const sessionIdRef = useRef<string>("");
    useEffect(() => {
        if (isOpen && !sessionIdRef.current) {
            sessionIdRef.current = crypto.randomUUID();
        }
    }, [isOpen]);

    const brokerInfo = selectedBroker ? BROKER_INFO[selectedBroker] : null;
    const effectiveSetupMethod =
        setupSyncMethod === "EA_SYNC" ? "EA_SYNC" : "TNT_CONNECT";
    const setupInstructions = {
        description: `Connect your ${platform} account with Trade Manager EA`,
        steps: [
            <>
                Download the{" "}
                <strong className="text-gray-700 dark:text-white">
                    Trade Manager EA (.ex5)
                </strong>{" "}
                for MT5.
            </>,
            <>
                In MT5, open the Data Folder, navigate to{" "}
                <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-800 dark:text-gray-200 font-mono text-xs">
                    MQL5/Experts
                </code>
                , and drop the file there.
            </>,
            <>
                Restart MT5 and attach Trade Manager EA to any chart (e.g.
                XAUUSD).
            </>,
            <>
                Go to the{" "}
                <strong className="text-gray-700 dark:text-white">SYNC</strong>{" "}
                tab on the EA panel, paste your API Key, and click Connect.
            </>,
        ],
    };

    function handleClose() {
        onClose();
    }

    // --- Free Account Actions ---
    async function handleCreateFree() {
        if (!name.trim()) {
            toast.error("Please enter an account name");
            return;
        }

        const trimmedPass = investorPassword.trim();
        if (trimmedPass) {
            if (!freeAccountNumber.trim()) {
                toast.error("MT5 Account Number is required for Cloud Sync");
                return;
            }
            if (!freeServer.trim()) {
                toast.error("Broker Server is required for Cloud Sync");
                return;
            }
        }

        startTransition(async () => {
            try {
                const result = await createTradingAccount({
                    platform,
                    name: name.trim(),
                    broker: freeBroker || undefined,
                    server: freeServer || undefined,
                    accountNumber: freeAccountNumber || undefined,
                    color,
                    balance: 0,
                    currency: "USD",
                });

                if (result.error) throw new Error(result.error);

                if (result.account) {
                    let hasCloudSync = false;
                    if (trimmedPass) {
                        const credResult = await saveCloudSyncCredentials(
                            result.account.id,
                            trimmedPass,
                            freeServer.trim() || undefined
                        );

                        if (credResult.success) {
                            hasCloudSync = true;
                            toast.success("Account created & Investor password saved!");
                        } else {
                            toast.warning(
                                credResult.error ||
                                    "Account created, but Cloud Sync setup failed. You can configure it later in Settings."
                            );
                        }
                    } else {
                        toast.success("Account created successfully!");
                    }

                    setCreatedAccount({
                        ...result.account,
                        hasCloudSync,
                        accountNumber: freeAccountNumber,
                        server: freeServer,
                    });
                    setStep("free-setup");
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to create account");
            }
        });
    }

    // --- Partner Pro Actions ---
    function handleSelectBroker(broker: SupportedBroker) {
        setSelectedBroker(broker);
        setStep("pro-status");
        setAccountStatus(null);
        setError(null);
    }

    function handleProSubmit() {
        if (!selectedBroker) return;
        setError(null);

        const formData = new FormData();
        formData.set("broker", selectedBroker);
        formData.set("accountNumber", accountNumber);
        formData.set("balance", balance);
        formData.set("email", userEmail);
        formData.set("telegramId", telegramId);
        if (fullName) formData.set("fullName", fullName);
        if (country) formData.set("country", country);
        if (proServer) formData.set("server", proServer);
        formData.set("cf-turnstile-response", turnstileToken);

        startTransition(async () => {
            const result = await createPartnerProAccount(formData);
            if (result.error) {
                setError(result.error);
            } else {
                trackEvent("signup_complete", { broker: selectedBroker });
                setCreatedAccount({
                    id: result.accountId,
                    apiKey: result.apiKey,
                    isNewAccount: result.isNewAccount,
                });
                setStep("pro-success");
                toast.success("Partner Pro Account created successfully!");
            }
        });
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const renderHeader = (
        title: string,
        desc?: string,
        showBackToChooser: boolean = true
    ) => (
        <div className="flex items-center justify-between p-6 border-b border-dashboard">
            <div className="flex items-center gap-3">
                {showBackToChooser &&
                    step !== "chooser" &&
                    step !== "free-setup" &&
                    step !== "pro-success" &&
                    step !== "upgrade-pro" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                if (step.startsWith("free-"))
                                    setStep("chooser");
                                else if (step === "pro-broker")
                                    setStep("chooser");
                                else if (step === "pro-status")
                                    setStep("pro-broker");
                                else if (step === "pro-details")
                                    setStep("pro-status");
                                else if (step === "pro-review")
                                    setStep("pro-details");
                            }}
                            className="rounded-lg h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            <ArrowLeft size={16} />
                        </Button>
                    )}
                <div>
                    <h2 className="text-xl font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        {title}
                    </h2>
                    {desc && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {desc}
                        </p>
                    )}
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label="Close modal"
                className="rounded-lg text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
                <X size={20} />
            </Button>
        </div>
    );

    // --- Upgrade Pro submit (uses existing account ID) ---
    function handleUpgradeSubmit() {
        if (!sourceAccount) return;
        setError(null);

        if (!telegramId) {
            setError("Telegram ID is required");
            return;
        }

        const formData = new FormData();
        formData.set("broker", sourceAccount.broker ?? "");
        formData.set("accountNumber", sourceAccount.accountNumber ?? "");
        formData.set(
            "balance",
            sourceAccount.balance != null
                ? String(sourceAccount.balance)
                : balance
        );
        formData.set("email", userEmail);
        formData.set("telegramId", telegramId);
        if (fullName) formData.set("fullName", fullName);
        if (country) formData.set("country", country);
        if (proServer) formData.set("server", proServer);
        formData.set("cf-turnstile-response", turnstileToken);

        startTransition(async () => {
            const result = await upgradeToPartnerPro(
                sourceAccount.id,
                formData
            );
            if (result.error) {
                setError(result.error);
            } else {
                setCreatedAccount({
                    id: result.accountId,
                    apiKey: result.apiKey,
                    isNewAccount: result.isNewAccount,
                });
                setStep("pro-success");
                toast.success("Upgrade request submitted!");
            }
        });
    }

    return (
        <AnimatePresence onExitComplete={releaseLock}>
            {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                variants={backdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <motion.div
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={SPRING_SOFT}
                className="relative z-10 bg-white dark:bg-[#1E2028] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dashboard shadow-2xl cursor-default flex flex-col"
            >
                {/* 0. UPGRADE-PRO STEP — prefilled from existing account */}
                {step === "upgrade-pro" && sourceAccount && (
                    <>
                        {renderHeader(
                            "Apply for Partner Pro",
                            `Upgrade ${sourceAccount.name || sourceAccount.accountNumber || "your account"} to Pro`,
                            false
                        )}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            {/* Read-only account summary */}
                            <div className="rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 p-5 space-y-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 text-center">
                                    Account to Upgrade
                                </p>
                                <div className="grid grid-cols-3 divide-x divide-amber-200/60 dark:divide-amber-500/20">
                                    <div className="text-center px-2">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                                            Broker
                                        </p>
                                        <p className="font-bold text-gray-800 dark:text-white leading-tight break-words">
                                            {sourceAccount.broker || "—"}
                                        </p>
                                    </div>
                                    <div className="text-center px-2">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                                            Account Number
                                        </p>
                                        <p className="font-bold text-gray-800 dark:text-white break-words">
                                            {sourceAccount.accountNumber || "—"}
                                        </p>
                                    </div>
                                    <div className="text-center px-2">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                                            Balance
                                        </p>
                                        <p className="font-bold text-gray-800 dark:text-white break-words">
                                            {sourceAccount.balance != null
                                                ? `$${sourceAccount.balance.toLocaleString()}`
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* VIP requires the account to be registered under our IB */}
                            <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 p-4 space-y-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <AlertTriangle size={14} /> VIP requires
                                    registration under our IB
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    To qualify for VIP access your trading
                                    account must be registered under our IB
                                    partner. If you opened it directly, transfer
                                    your IB or register a new account via our
                                    partner link — accounts not under our IB are
                                    rejected during review.
                                </p>
                                {(() => {
                                    const brokerKey = SUPPORTED_BROKERS.find(
                                        (b) =>
                                            BROKER_INFO[b].name.toLowerCase() ===
                                            (sourceAccount.broker || "")
                                                .trim()
                                                .toLowerCase()
                                    ) ||
                                    SUPPORTED_BROKERS.find(
                                        (b) =>
                                            b ===
                                            (sourceAccount.broker || "")
                                                .trim()
                                                .toUpperCase()
                                    );
                                    if (!brokerKey) return null;
                                    const bInfo = BROKER_INFO[brokerKey];
                                    return (
                                        <div className="space-y-2 rounded-lg bg-white dark:bg-[#1E2028] border border-amber-200/60 dark:border-amber-500/15 p-3">
                                            <p className="text-xs font-bold text-gray-800 dark:text-white">
                                                {bInfo.name} setup under our IB
                                            </p>
                                            <ol className="text-[11px] text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
                                                {bInfo.registerGuide.steps.map(
                                                    (s, i) => (
                                                        <li key={i}>{s}</li>
                                                    )
                                                )}
                                            </ol>
                                            <a
                                                href={bInfo.affiliateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-gold"
                                            >
                                                <UserPlus size={12} /> Register
                                                new {bInfo.name} account
                                                <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Verification fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PremiumInput
                                    label="Telegram ID *"
                                    value={telegramId}
                                    onChange={(e) =>
                                        setTelegramId(e.target.value)
                                    }
                                />
                                <PremiumInput
                                    label="Email *"
                                    value={userEmail}
                                    disabled
                                />
                                <PremiumInput
                                    label="Full Name (optional)"
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                />
                                <PremiumInput
                                    label="Country (optional)"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                />
                            </div>

                            {/* Server selection — filtered by account broker if known */}
                            <ServerCombobox
                                value={proServer}
                                onChange={(server) => setProServer(server)}
                                brokerFilter={sourceAccount.broker}
                                label="Select Server"
                                required={false}
                                helperText="Broker server name. Required for automated Cloud Sync (Passview)."
                            />

                            <TurnstileWidget
                                onVerify={setTurnstileToken}
                                className="flex justify-center"
                            />

                            <div className="flex justify-end pt-2">
                                <Button
                                    variant="primary"
                                    size="smd"
                                    onClick={handleUpgradeSubmit}
                                    disabled={
                                        isPending ||
                                        !telegramId ||
                                        !turnstileToken
                                    }
                                    className="bg-amber-500 hover:bg-amber-600 border-none gap-2 px-6 min-w-[180px] font-bold shadow-lg shadow-amber-500/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />{" "}
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} /> Submit Upgrade
                                            Request
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 1. CHOOSER STEP */}
                {step === "chooser" && (
                    <>
                        {renderHeader(
                            "Add Trading Account",
                            "Select the type of account you want to connect",
                            false
                        )}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                role="button"
                                onClick={() => setStep("free-create")}
                                className="flex flex-col items-start gap-4 p-6 rounded-2xl border-2 border-dashboard hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group cursor-pointer bg-transparent w-full"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Wallet
                                        size={24}
                                        className="text-gray-600 dark:text-gray-300"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                                        Free Account
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Connect any MT5 account to track your
                                        stats. No special broker required.
                                    </p>
                                </div>
                            </button>
                            <button
                                role="button"
                                onClick={() => setStep("pro-broker")}
                                className="flex flex-col items-start gap-4 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-500/50 bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all text-left group cursor-pointer w-full"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
                                    <Check
                                        size={24}
                                        className="text-white"
                                        strokeWidth={3}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-1">
                                        Partner Pro Account
                                    </h3>
                                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                                        Open under our IB to apply for Pro
                                        features, EA access, and VIP tools.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {/* 2. FREE ACCOUNT CREATION */}
                {step === "free-create" && (
                    <>
                        {renderHeader("Free Account Details")}
                        <div className="p-6 space-y-6">
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
                                                title="Choose account label color"
                                                aria-label="Choose account label color"
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
                                                        Label Color
                                                    </span>
                                                    <span
                                                        className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10"
                                                        style={{
                                                            backgroundColor: color,
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-5 gap-2 pt-0.5">
                                                    {ACCOUNT_COLORS.map((c) => (
                                                        <button
                                                            type="button"
                                                            key={c}
                                                            onClick={() => {
                                                                setColor(c);
                                                                setColorPickerOpen(false);
                                                            }}
                                                            aria-label={`Select color ${c}`}
                                                            className={`w-8 h-8 rounded-full transition-all flex items-center justify-center cursor-pointer ${
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
                                                                    size={14}
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

                            <PremiumInput
                                label="MT5 Account Number"
                                value={freeAccountNumber}
                                onChange={(e) =>
                                    setFreeAccountNumber(
                                        e.target.value.replace(/\D/g, "")
                                    )
                                }
                                helperText="Find this in MT5 → Navigator → Accounts. Required for Trade Manager sync."
                            />

                            <ServerCombobox
                                value={freeServer}
                                onChange={(server, broker) => {
                                    setFreeServer(server);
                                    if (broker) {
                                        setFreeBroker(broker);
                                    }
                                }}
                                label="Select Server"
                                required={false}
                                helperText="Broker server name. Required for automated Cloud Sync (Passview)."
                            />

                            {/* Cloud Sync (Optional) */}
                            <div className="space-y-2 pt-3 border-t border-dashboard">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <CloudSync size={13} className="text-primary shrink-0" />
                                        Automated Cloud Sync
                                    </span>
                                    <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg tracking-wider uppercase">
                                        Optional
                                    </span>
                                </div>
                                <PremiumInput
                                    type="password"
                                    label="Investor Password (Passview)"
                                    value={investorPassword}
                                    onChange={(e) => setInvestorPassword(e.target.value)}
                                    helperText="Read-only investor password. Enables automated 24/7 trade sync without VPS or EA."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="primary"
                                    size="smd"
                                    onClick={handleCreateFree}
                                    disabled={isPending}
                                    className="flex-1 font-bold shadow-lg shadow-primary/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2
                                                size={20}
                                                className="animate-spin mr-2"
                                            />{" "}
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 3. FREE ACCOUNT SETUP — method-specific success handoff */}
                {step === "free-setup" &&
                    createdAccount &&
                    (() => {
                        const hasCloudSync = Boolean(createdAccount.hasCloudSync);
                        const isManual = setupSyncMethod === "MANUAL";
                        const successTitle = hasCloudSync
                            ? "Cloud Sync Activated"
                            : isManual
                            ? "Account created"
                            : "Trade Manager is ready";
                        const successDesc = hasCloudSync
                            ? "Automated background sync is active. Your trade telemetry syncs 24/7 without needing a VPS or EA."
                            : isManual
                            ? "You can now start logging trades manually."
                            : setupInstructions.description;
                        const primaryCtaLabel = hasCloudSync
                            ? "Done & View Accounts"
                            : isManual
                            ? "Log First Trade"
                            : "Continue to Trade Manager Setup";

                        return (
                            <>
                                {renderHeader(successTitle, successDesc, false)}
                                <div className="p-6 space-y-6">
                                    {hasCloudSync ? (
                                        <div className="space-y-4">
                                            {/* Cloud Sync Status Card */}
                                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                            Automated Cloud Worker
                                                        </h4>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <ShieldCheck size={11} className="text-emerald-500" />
                                                        Active & Encrypted
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    Your investor password is securely stored with AES-256 encryption. Initial synchronization for the past 30 days has been dispatched to the automated worker queue.
                                                </p>
                                                {/* 2x2 Matrix Specs */}
                                                <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard divide-y divide-gray-200/60 dark:divide-white/5 text-xs overflow-hidden">
                                                    <div className="grid grid-cols-2 divide-x divide-gray-200/60 dark:divide-white/5">
                                                        <div className="px-3.5 py-2">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                                Account
                                                            </span>
                                                            <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                                                                #{createdAccount.accountNumber || freeAccountNumber || "N/A"}
                                                            </span>
                                                        </div>
                                                        <div className="px-3.5 py-2">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                                Server
                                                            </span>
                                                            <span
                                                                className="font-semibold text-gray-800 dark:text-gray-200 font-mono truncate block"
                                                                title={createdAccount.server || freeServer}
                                                            >
                                                                {createdAccount.server || freeServer || "Default"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Optional EA API Key disclosure */}
                                            <div className="p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashboard flex items-center justify-between text-xs">
                                                <div className="min-w-0 pr-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                        Sync API Key (Optional)
                                                    </span>
                                                    <span className="font-mono text-gray-500 truncate block text-[11px]">
                                                        {createdAccount.apiKey}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(createdAccount.apiKey)}
                                                    className="shrink-0 text-xs font-semibold rounded-lg h-7 px-2.5"
                                                >
                                                    {copied ? (
                                                        <Check size={12} className="mr-1 text-emerald-500" />
                                                    ) : (
                                                        <Copy size={12} className="mr-1" />
                                                    )}
                                                    {copied ? "Copied" : "Copy"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* API Key — always shown */}
                                            <div className="p-4 bg-gray-50 dark:bg-[#1E2028] rounded-xl border border-dashboard">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                                    Your Sync API Key
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 p-3 bg-white dark:bg-[#1E2028] rounded-lg text-sm font-mono text-primary break-all border border-dashboard">
                                                        {createdAccount.apiKey}
                                                    </code>
                                                    <Button
                                                        variant="primary"
                                                        size="icon"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                createdAccount.apiKey
                                                            )
                                                        }
                                                        aria-label="Copy API Key"
                                                        className="h-11 w-11 rounded-lg shrink-0 hover:bg-[#00B377]"
                                                    >
                                                        {copied ? (
                                                            <Check size={18} />
                                                        ) : (
                                                            <Copy size={18} />
                                                        )}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                    {isManual
                                                        ? "Save this key — you can use it later to set up auto-sync with Trade Manager."
                                                        : "Save this key now — you can find it later in Settings → Sync Settings."}
                                                </p>
                                            </div>

                                            {/* Setup steps — only for TNT/EA, hidden for MANUAL */}
                                            {!isManual && (
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-gray-700 dark:text-white border-b border-dashboard pb-2">
                                                        Setup Steps
                                                    </h3>
                                                    <ol className="space-y-4 text-sm text-gray-600 dark:text-gray-500">
                                                        {setupInstructions.steps.map(
                                                            (stepText, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="flex gap-3 items-start"
                                                                >
                                                                    <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                                        {index + 1}
                                                                    </span>
                                                                    <span className="break-words">
                                                                        {stepText}
                                                                    </span>
                                                                </li>
                                                            )
                                                        )}
                                                    </ol>
                                                </div>
                                            )}

                                            {/* Troubleshooting help — only for TNT/EA */}
                                            {!isManual && (
                                                <SyncTroubleshootingPanel
                                                    method={
                                                        effectiveSetupMethod as "EA_SYNC"
                                                    }
                                                />
                                            )}
                                        </>
                                    )}

                                    {/* Primary CTA — method-aware */}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="primary"
                                            size="smd"
                                            onClick={() => {
                                                trackEvent(
                                                    "add_account_success_next_clicked",
                                                    {
                                                        method: hasCloudSync
                                                            ? "cloud"
                                                            : isManual
                                                            ? "manual"
                                                            : "ea",
                                                    }
                                                );
                                                if (hasCloudSync) {
                                                    handleClose();
                                                    onSuccess(createdAccount);
                                                } else if (isManual) {
                                                    // Route to journal
                                                    handleClose();
                                                    onSuccess(createdAccount);
                                                    window.location.href =
                                                        "/dashboard/journal?action=log-trade&source=first-session";
                                                } else {
                                                    // Close modal, then reopen sync wizard via onSuccess callback
                                                    handleClose();
                                                    onSuccess(createdAccount);
                                                }
                                            }}
                                            className="w-full font-bold shadow-lg shadow-primary/20 gap-2"
                                        >
                                            {primaryCtaLabel}
                                            <ArrowRight size={16} />
                                        </Button>
                                        {!hasCloudSync && (
                                            <Button
                                                variant="outline"
                                                size="smd"
                                                onClick={() => {
                                                    handleClose();
                                                    onSuccess(createdAccount);
                                                }}
                                                className="w-full font-bold"
                                            >
                                                Skip for now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                {/* 4. PRO - BROKER SELECTION */}
                {step === "pro-broker" && (
                    <>
                        {renderHeader(
                            "Select Partner Broker",
                            "Step 1 of 4: Choose your broker"
                        )}
                        <div className="p-6 space-y-4">
                            <div className="p-3 mb-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
                                <AlertCircle
                                    size={14}
                                    className="shrink-0 mt-0.5"
                                />
                                <p>
                                    Partner Pro access depends on supported
                                    broker and account eligibility. If your
                                    account is not eligible, your request may be
                                    rejected after review.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {SUPPORTED_BROKERS.map((broker) => {
                                    const info = BROKER_INFO[broker];
                                    return (
                                        <button
                                            key={broker}
                                            onClick={() =>
                                                handleSelectBroker(broker)
                                            }
                                            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashboard hover:border-amber-400 dark:hover:border-amber-500/50 bg-white dark:bg-[#1E2028] hover:shadow-lg transition-all text-center"
                                        >
                                            <div className="h-16 flex items-center justify-center">
                                                <Image
                                                    src={info.logo}
                                                    alt={info.name}
                                                    width={90}
                                                    height={60}
                                                    className="rounded-xl object-contain max-h-14 w-auto dark:brightness-0 dark:invert"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white text-base">
                                                    {info.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Min. ${info.minDeposit} USD
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* 5. PRO - ACCOUNT STATUS */}
                {step === "pro-status" && brokerInfo && selectedBroker && (
                    <>
                        {renderHeader(
                            "Account Status",
                            `Step 2 of 4: Do you already have a ${brokerInfo.name} account?`
                        )}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setAccountStatus("new");
                                        trackBrokerClick({
                                            broker: selectedBroker,
                                            affiliateUrl:
                                                brokerInfo.affiliateUrl,
                                            source: "DASHBOARD",
                                            sessionId: sessionIdRef.current,
                                        });
                                        window.open(
                                            brokerInfo.affiliateUrl,
                                            "_blank"
                                        );
                                    }}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${accountStatus === "new"
                                            ? "border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/5"
                                            : "border-dashboard hover:border-amber-300 dark:hover:border-amber-500/20 bg-white dark:bg-[#1E2028]"
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                                        <UserPlus
                                            size={22}
                                            className="text-amber-600 dark:text-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800 dark:text-white">
                                            No, create new account
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            Opens registration in new tab
                                        </p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setAccountStatus("existing")}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${accountStatus === "existing"
                                            ? "border-blue-400 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/5"
                                            : "border-dashboard hover:border-blue-300 dark:hover:border-blue-500/20 bg-white dark:bg-[#1E2028]"
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                        <RefreshCw
                                            size={22}
                                            className="text-blue-600 dark:text-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800 dark:text-white">
                                            Yes, I have an account
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            Transfer IB to get VIP access
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {accountStatus === "existing" && (
                                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15 space-y-3">
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                        How to transfer IB — {brokerInfo.name}
                                    </p>
                                    <ol className="text-sm text-blue-600 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
                                        {brokerInfo.ibTransferGuide.steps.map(
                                            (s, i) => (
                                                <li key={i}>{s}</li>
                                            )
                                        )}
                                    </ol>
                                    {brokerInfo.ibTransferGuide.emails && (
                                        <div className="p-3 rounded-lg bg-white dark:bg-[#1E2028] border border-blue-100 space-y-1.5">
                                            <div className="text-xs space-y-0.5 text-gray-700 dark:text-gray-300">
                                                <p>
                                                    <strong>To:</strong>{" "}
                                                    {
                                                        brokerInfo
                                                            .ibTransferGuide
                                                            .emails.to
                                                    }
                                                </p>
                                                {brokerInfo.ibTransferGuide
                                                    .emails.cc && (
                                                        <p>
                                                            <strong>CC:</strong>{" "}
                                                            {
                                                                brokerInfo
                                                                    .ibTransferGuide
                                                                    .emails.cc
                                                            }
                                                        </p>
                                                    )}
                                                <p>
                                                    <strong>Subject:</strong>{" "}
                                                    {
                                                        brokerInfo
                                                            .ibTransferGuide
                                                            .emails.subject
                                                    }
                                                </p>
                                                <p>
                                                    <strong>Content:</strong>{" "}
                                                    {
                                                        brokerInfo
                                                            .ibTransferGuide
                                                            .emails.body
                                                    }
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        brokerInfo
                                                            .ibTransferGuide
                                                            .emails!.body
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                                            >
                                                <Copy size={10} />{" "}
                                                {copied
                                                    ? "Copied!"
                                                    : "Copy email"}
                                            </button>
                                        </div>
                                    )}
                                    {brokerInfo.ibTransferGuide.note && (
                                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/15 rounded-lg p-2.5">
                                            <AlertTriangle size={13} className="inline-block mr-1 align-[-1px]" /> {brokerInfo.ibTransferGuide.note}
                                        </p>
                                    )}
                                </div>
                            )}

                            {accountStatus === "new" && (
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 space-y-3">
                                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                        How to set up your {brokerInfo.name} account
                                    </p>
                                    <ol className="text-sm text-amber-600 dark:text-amber-300 space-y-1.5 list-decimal list-inside">
                                        {brokerInfo.registerGuide.steps.map(
                                            (s, i) => (
                                                <li key={i}>{s}</li>
                                            )
                                        )}
                                    </ol>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-white dark:bg-[#1E2028] border border-amber-200 dark:border-amber-500/15 rounded-lg p-2.5">
                                        <UserPlus size={13} className="inline-block mr-1 align-[-1px]" /> Registration link opened in a new tab — once your account is funded and verified, click Continue below.
                                    </p>
                                </div>
                            )}

                            {accountStatus && (
                                <div className="flex justify-end pt-4">
                                    <Button
                                        variant="primary"
                                        size="smd"
                                        onClick={() => setStep("pro-details")}
                                        className="gap-2 font-bold px-6 min-w-[160px] shadow-lg shadow-primary/20"
                                    >
                                        Continue <ArrowRight size={16} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 6. PRO - DETAILS */}
                {step === "pro-details" && brokerInfo && selectedBroker && (
                    <>
                        {renderHeader(
                            "Account Details",
                            "Step 3 of 4: Enter your account information"
                        )}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PremiumInput
                                    label="Account Number *"
                                    value={accountNumber}
                                    onChange={(e) =>
                                        setAccountNumber(e.target.value)
                                    }
                                />
                                <PremiumInput
                                    label="Balance (USD) *"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                />
                                <PremiumInput
                                    label="Telegram ID *"
                                    value={telegramId}
                                    onChange={(e) =>
                                        setTelegramId(e.target.value)
                                    }
                                />
                                <PremiumInput
                                    label="Email *"
                                    value={userEmail}
                                    disabled
                                />
                                {brokerInfo.requiresFullName && (
                                    <PremiumInput
                                        label="Full Name *"
                                        value={fullName}
                                        onChange={(e) =>
                                            setFullName(e.target.value)
                                        }
                                    />
                                )}
                                {brokerInfo.requiresCountry && (
                                    <div className="w-full space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Country *
                                        </label>
                                        <CountrySelect
                                            value={country}
                                            onChange={setCountry}
                                            className="h-[42px] px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#151925] border border-dashboard text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-none active:scale-100"
                                        />
                                    </div>
                                )}
                            </div>
                            {/* Server selection — strictly filtered by chosen broker */}
                            <ServerCombobox
                                value={proServer}
                                onChange={(server) => setProServer(server)}
                                brokerFilter={selectedBroker}
                                label="Select Server"
                                required={false}
                                helperText={`Select your ${brokerInfo.name} server for automated Cloud Sync.`}
                            />
                            <div className="flex justify-end pt-4">
                                <Button
                                    variant="primary"
                                    size="smd"
                                    onClick={() => {
                                        if (
                                            !accountNumber ||
                                            !balance ||
                                            !telegramId ||
                                            (brokerInfo.requiresFullName &&
                                                !fullName) ||
                                            (brokerInfo.requiresCountry &&
                                                !country)
                                        ) {
                                            setError(
                                                "Please fill in all required fields"
                                            );
                                            return;
                                        }
                                        setError(null);
                                        setStep("pro-review");
                                    }}
                                    className="gap-2 font-bold px-6 min-w-[160px] shadow-lg shadow-primary/20"
                                >
                                    Review <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 7. PRO - REVIEW & SUBMIT */}
                {step === "pro-review" && brokerInfo && selectedBroker && (
                    <>
                        {renderHeader(
                            "Review Request",
                            "Step 4 of 4: Confirm your information"
                        )}
                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}
                            <div className="rounded-xl border border-dashboard bg-gray-50 dark:bg-[#1E2028] p-5">
                                <div className="grid grid-cols-3 divide-x divide-dashboard">
                                    <div className="text-center px-2">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                                            Broker
                                        </p>
                                        <p className="font-bold text-gray-800 dark:text-white leading-tight break-words">
                                            {brokerInfo.name}
                                        </p>
                                    </div>
                                    <div className="text-center px-2">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                                            Account
                                        </p>
                                        <p className="font-bold text-gray-800 dark:text-white break-words">
                                            {accountNumber}
                                        </p>
                                    </div>
                                    <div className="text-center px-2">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                                            Balance
                                        </p>
                                        <p className="font-bold text-gray-800 dark:text-white break-words">
                                            ${balance}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashboard grid grid-cols-2 gap-4">
                                    <div className="text-center px-2">
                                        <p className="text-[10px] text-gray-500 uppercase mb-1">
                                            Telegram
                                        </p>
                                        <p className="font-bold text-gray-800 dark:text-white break-words">
                                            {telegramId}
                                        </p>
                                    </div>
                                    {brokerInfo.requiresFullName && (
                                        <div className="text-center px-2">
                                            <p className="text-[10px] text-gray-500 uppercase mb-1">
                                                Name
                                            </p>
                                            <p className="font-bold text-gray-800 dark:text-white break-words">
                                                {fullName}
                                            </p>
                                        </div>
                                    )}
                                    {brokerInfo.requiresCountry && (
                                        <div className="text-center px-2">
                                            <p className="text-[10px] text-gray-500 uppercase mb-1">
                                                Country
                                            </p>
                                            <p className="font-bold text-gray-800 dark:text-white break-words">
                                                {country}
                                            </p>
                                        </div>
                                    )}
                                    {userEmail && (
                                        <div className="text-center px-2">
                                            <p className="text-[10px] text-gray-500 uppercase mb-1">
                                                Email
                                            </p>
                                            <p
                                                className="font-bold text-gray-800 dark:text-white break-words text-xs truncate"
                                                title={userEmail}
                                            >
                                                {userEmail}
                                            </p>
                                        </div>
                                    )}
                                    {proServer && (
                                        <div className="col-span-2 text-center px-2 mt-2 pt-2 border-t border-dashboard/50">
                                            <p className="text-[10px] text-gray-500 uppercase mb-1">
                                                Server
                                            </p>
                                            <p className="font-bold text-primary dark:text-primary-light break-words text-sm">
                                                {proServer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <TurnstileWidget
                                onVerify={setTurnstileToken}
                                className="flex justify-center"
                            />

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="primary"
                                    size="smd"
                                    onClick={handleProSubmit}
                                    disabled={isPending || !turnstileToken}
                                    className="bg-amber-500 hover:bg-amber-600 text-white gap-2 font-bold px-6 min-w-[180px] shadow-lg shadow-amber-500/20"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />{" "}
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} /> Submit Request
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 8. PRO - SUCCESS */}
                {step === "pro-success" && (
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Request Submitted!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                            Your Partner Pro request is under review. The account has
                            been added to your dashboard. We will upgrade its
                            status once verified.
                        </p>

                        <div className="text-left mt-6">
                            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-center">
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    Use your global{" "}
                                    <strong className="font-bold">
                                        Sync API Key
                                    </strong>{" "}
                                    (found in Settings) to connect this account
                                    to EA Trade Manager.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                variant="primary"
                                size="smd"
                                onClick={() => {
                                    handleClose();
                                    onSuccess(createdAccount);
                                }}
                                className="w-full font-bold"
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
            )}
        </AnimatePresence>
    );
}
