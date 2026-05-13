"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { X, Copy, Check, Loader2, Wallet, UserPlus, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { createTradingAccount } from "@/actions/accounts";
import { createPartnerProAccount, upgradeToPartnerPro } from "@/actions/account-pro";
import { trackEvent } from "@/lib/track";
import { trackBrokerClick } from "@/actions/ib-lead";
import { TurnstileWidget } from "@/components/ui/TurnstileWidget";
import { BROKER_INFO, SUPPORTED_BROKERS, SupportedBroker } from "@/lib/validations/vip-request";
import Image from "next/image";

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (account: any) => void;
    initialMode?: "chooser" | "free" | "pro" | "upgrade-pro";
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
    | "upgrade-pro";  // prefilled upgrade form

export function AddAccountModal({
    isOpen,
    onClose,
    onSuccess,
    initialMode = "chooser",
    sourceAccount,
    userEmail = "",
    userName = "",
    userTelegramId = "",
    userCountry = "",
}: AddAccountModalProps) {
    const [step, setStep] = useState<Step>(
        initialMode === "free" ? "free-create"
        : initialMode === "pro" ? "pro-broker"
        : initialMode === "upgrade-pro" ? "upgrade-pro"
        : "chooser"
    );
    const [isPending, startTransition] = useTransition();

    // Reset when opened/closed
    useEffect(() => {
        if (isOpen) {
            setStep(
                initialMode === "free" ? "free-create"
                : initialMode === "pro" ? "pro-broker"
                : initialMode === "upgrade-pro" ? "upgrade-pro"
                : "chooser"
            );
            // Reset state
            setName("");
            setColor("hsl(var(--primary))");
            setCreatedAccount(null);
            setCopied(false);
            setFreeAccountNumber("");

            setSelectedBroker(null);
            setAccountStatus(null);
            // Prefill from sourceAccount if upgrade-pro
            setAccountNumber(sourceAccount?.accountNumber ?? "");
            setBalance(sourceAccount?.balance != null ? String(sourceAccount.balance) : "");
            setTelegramId(userTelegramId);
            setFullName(userName);
            setCountry(userCountry);
            setScreenshotUrl("");
            setError(null);
        }
    }, [isOpen, initialMode, userName, sourceAccount]);

    // --- Free Account State ---
    const platform = "MT5";
    const [name, setName] = useState("");
    const [freeAccountNumber, setFreeAccountNumber] = useState("");
    const [color, setColor] = useState("hsl(var(--primary))");
    const [createdAccount, setCreatedAccount] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    // --- Partner Pro State ---
    const [selectedBroker, setSelectedBroker] = useState<SupportedBroker | null>(null);
    const [accountStatus, setAccountStatus] = useState<"new" | "existing" | null>(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [balance, setBalance] = useState("");
    const [telegramId, setTelegramId] = useState(userTelegramId);
    const [fullName, setFullName] = useState(userName);
    const [country, setCountry] = useState(userCountry);
    const [screenshotUrl, setScreenshotUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");

    const sessionIdRef = useRef<string>("");
    useEffect(() => {
        if (isOpen && !sessionIdRef.current) {
            sessionIdRef.current = crypto.randomUUID();
        }
    }, [isOpen]);

    const brokerInfo = selectedBroker ? BROKER_INFO[selectedBroker] : null;

    if (!isOpen) return null;

    function handleClose() {
        onClose();
    }

    // --- Free Account Actions ---
    async function handleCreateFree() {
        if (!name) {
            toast.error("Please enter an account name");
            return;
        }

        startTransition(async () => {
            try {
                const result = await createTradingAccount({
                    platform,
                    name,
                    accountNumber: freeAccountNumber || undefined,
                    color,
                    balance: 0,
                    currency: "USD",
                });

                if (result.error) throw new Error(result.error);

                if (result.account) {
                    setCreatedAccount(result.account);
                    setStep("free-setup");
                    toast.success("Account created successfully!");
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
        if (screenshotUrl) formData.set("screenshotUrl", screenshotUrl);
        formData.set("cf-turnstile-response", turnstileToken);

        startTransition(async () => {
            const result = await createPartnerProAccount(formData);
            if (result.error) {
                setError(result.error);
                setShowConfirm(false);
            } else {
                trackEvent('signup_complete', { broker: selectedBroker });
                setCreatedAccount({
                    id: result.accountId,
                    apiKey: result.apiKey,
                    isNewAccount: result.isNewAccount
                });
                setStep("pro-success");
                setShowConfirm(false);
                toast.success("Partner Pro Account created successfully!");
            }
        });
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const renderHeader = (title: string, desc?: string, showBackToChooser: boolean = true) => (
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
                {showBackToChooser && step !== "chooser" && step !== "free-setup" && step !== "pro-success" && step !== "upgrade-pro" && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (step.startsWith("free-")) setStep("chooser");
                            else if (step === "pro-broker") setStep("chooser");
                            else if (step === "pro-status") setStep("pro-broker");
                            else if (step === "pro-details") setStep("pro-status");
                            else if (step === "pro-review") setStep("pro-details");
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
                    {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
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
        formData.set("balance", sourceAccount.balance != null ? String(sourceAccount.balance) : balance);
        formData.set("email", userEmail);
        formData.set("telegramId", telegramId);
        if (fullName) formData.set("fullName", fullName);
        if (country) formData.set("country", country);
        if (screenshotUrl) formData.set("screenshotUrl", screenshotUrl);
        formData.set("cf-turnstile-response", turnstileToken);

        startTransition(async () => {
            const result = await upgradeToPartnerPro(sourceAccount.id, formData);
            if (result.error) {
                setError(result.error);
                setShowConfirm(false);
            } else {
                setCreatedAccount({ id: result.accountId, apiKey: result.apiKey, isNewAccount: result.isNewAccount });
                setStep("pro-success");
                setShowConfirm(false);
                toast.success("Upgrade request submitted!");
            }
        });
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
            <div className="relative z-10 bg-white dark:bg-[#1E2028] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 cursor-default flex flex-col">

                {/* 0. UPGRADE-PRO STEP — prefilled from existing account */}
                {step === "upgrade-pro" && sourceAccount && (
                    <>
                        {renderHeader(
                            "Unlock Partner Pro",
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
                            <div className="rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 p-4 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">Account to Upgrade</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Broker</p>
                                        <p className="font-bold text-gray-800 dark:text-white">{sourceAccount.broker || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Account Number</p>
                                        <p className="font-bold text-gray-800 dark:text-white">{sourceAccount.accountNumber || "—"}</p>
                                    </div>
                                    {sourceAccount.balance != null && (
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Balance</p>
                                            <p className="font-bold text-gray-800 dark:text-white">${sourceAccount.balance.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verification fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PremiumInput
                                    label="Telegram ID *"
                                    value={telegramId}
                                    onChange={(e) => setTelegramId(e.target.value)}
                                    placeholder="@yourusername"
                                />
                                <PremiumInput label="Email *" value={userEmail} disabled />
                                <PremiumInput
                                    label="Full Name (optional)"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                                <PremiumInput
                                    label="Country (optional)"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="e.g. Vietnam"
                                />
                            </div>

                            <PremiumInput
                                label="Account Screenshot URL (optional)"
                                placeholder="https://imgur.com/... or Google Drive link"
                                value={screenshotUrl}
                                onChange={(e) => setScreenshotUrl(e.target.value)}
                            />
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-2">
                                Paste a link to a screenshot showing your account number and balance. Speeds up verification.
                            </p>

                            <TurnstileWidget onVerify={setTurnstileToken} className="flex justify-center" />

                            <div className="flex justify-end pt-2">
                                <Button
                                    variant="primary"
                                    onClick={handleUpgradeSubmit}
                                    disabled={isPending || !telegramId}
                                    className="bg-amber-500 hover:bg-amber-600 border-none gap-2 h-11 px-6 font-bold"
                                >
                                    {isPending ? (
                                        <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                                    ) : (
                                        <><Check size={16} /> Submit Upgrade Request</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 1. CHOOSER STEP */}
                {step === "chooser" && (
                    <>
                        {renderHeader("Add Trading Account", "Select the type of account you want to connect", false)}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                role="button"
                                onClick={() => setStep("free-create")}
                                className="flex flex-col items-start gap-4 p-6 rounded-2xl border-2 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group cursor-pointer bg-transparent w-full"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Wallet size={24} className="text-gray-600 dark:text-gray-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Free Account</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Connect any MT5 account to track your stats. No special broker required.</p>
                                </div>
                            </button>
                            <button
                                role="button"
                                onClick={() => setStep("pro-broker")}
                                className="flex flex-col items-start gap-4 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-500/50 bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all text-left group cursor-pointer w-full"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
                                    <Check size={24} className="text-white" strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-1">Partner Pro Account</h3>
                                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80">Open under our IB to unlock Pro features, EA access, and VIP tools automatically.</p>
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
                                placeholder={`e.g. My ${platform} Growth`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <PremiumInput
                                label="MT5 Account Number"
                                placeholder="e.g. 2001140658"
                                value={freeAccountNumber}
                                onChange={(e) => setFreeAccountNumber(e.target.value.replace(/\D/g, ''))}
                                helperText="Find this in MT5 → Navigator → Accounts. Required for TNT Connect sync."
                            />

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                    Label Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "hsl(var(--primary))", "#10B981", "#3B82F6", "#0EA5E9", "#6366F1",
                                        "#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F43F5E",
                                        "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
                                        "#14B8A6", "#06B6D4", "#64748B", "#475569", "#1E293B"
                                    ].map((c) => (
                                        <Button
                                            variant="ghost"
                                            type="button"
                                            key={c}
                                            onClick={() => setColor(c)}
                                            aria-label={`Select color ${c}`}
                                            className={`w-9 h-9 p-0 rounded-full transition-all flex items-center justify-center ${color === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1E2028] scale-110 hover:bg-transparent hover:text-white" : "hover:scale-105 hover:bg-transparent"
                                                }`}
                                            style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}80` : "none" }}
                                        >
                                            {color === c && <Check size={14} className="text-white drop-shadow-md" />}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="primary"
                                    onClick={handleCreateFree}
                                    disabled={isPending}
                                    className="flex-1 h-12 font-bold shadow-lg shadow-primary/20"
                                >
                                    {isPending ? (
                                        <><Loader2 size={20} className="animate-spin mr-2" /> Creating...</>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 3. FREE ACCOUNT SETUP */}
                {step === "free-setup" && createdAccount && (
                    <>
                        {renderHeader("Setup Instructions", "Connect your MT5 account to the platform", false)}
                        <div className="p-6 space-y-6">
                            {/* API Key */}
                            <div className="p-4 bg-gray-50 dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                    Your Sync API Key
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-3 bg-white dark:bg-[#1E2028] rounded-lg text-sm font-mono text-primary break-all border border-gray-200 dark:border-white/10">
                                        {createdAccount.apiKey}
                                    </code>
                                    <Button
                                        variant="primary"
                                        size="icon"
                                        onClick={() => copyToClipboard(createdAccount.apiKey)}
                                        aria-label="Copy API Key"
                                        className="h-11 w-11 rounded-lg shrink-0 hover:bg-[#00B377]"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This key works for both TNT Connect and EA Sync. Save it now — you can find it later in Settings → TNT Connect.</p>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">
                                    Setup Steps
                                </h3>
                                <ol className="space-y-4 text-sm text-gray-600 dark:text-gray-500">
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                                        <span>Download the <strong className="text-gray-700 dark:text-white">TheNextTrade Sync EA</strong> for {platform}.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                                        <span className="break-all">Copy the file to your <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">MQL{platform === "MT5" ? "5" : "4"}/Experts</code> folder.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                                        <span>Restart {platform} and attach EA to any chart.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                                        <span>Paste the API Key above into EA settings input.</span>
                                    </li>
                                </ol>
                            </div>


                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleClose();
                                    onSuccess(createdAccount);
                                }}
                                className="w-full h-12 font-medium"
                            >
                                Done
                            </Button>
                        </div>
                    </>
                )}

                {/* 4. PRO - BROKER SELECTION */}
                {step === "pro-broker" && (
                    <>
                        {renderHeader("Select Partner Broker", "Step 1 of 4: Choose your broker")}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {SUPPORTED_BROKERS.map((broker) => {
                                    const info = BROKER_INFO[broker];
                                    return (
                                        <button
                                            key={broker}
                                            onClick={() => handleSelectBroker(broker)}
                                            className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500/50 bg-white dark:bg-[#151925] hover:shadow-lg transition-all text-center"
                                        >
                                            <Image src={info.logo} alt={info.name} width={80} height={80} className="rounded-xl object-contain dark:brightness-0 dark:invert" />
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white text-base">{info.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Min. ${info.minDeposit} USD</p>
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
                        {renderHeader("Account Status", `Step 2 of 4: Do you already have a ${brokerInfo.name} account?`)}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setAccountStatus("new");
                                        trackBrokerClick({
                                            broker: selectedBroker,
                                            affiliateUrl: brokerInfo.affiliateUrl,
                                            source: "DASHBOARD",
                                            sessionId: sessionIdRef.current,
                                        });
                                        window.open(brokerInfo.affiliateUrl, "_blank");
                                    }}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${
                                        accountStatus === "new"
                                            ? "border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/5"
                                            : "border-gray-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/20 bg-white dark:bg-[#151925]"
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                                        <UserPlus size={22} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800 dark:text-white">No, create new account</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Opens registration in new tab</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setAccountStatus("existing")}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${
                                        accountStatus === "existing"
                                            ? "border-blue-400 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/5"
                                            : "border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/20 bg-white dark:bg-[#151925]"
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                        <RefreshCw size={22} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800 dark:text-white">Yes, I have an account</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Transfer IB to get VIP access</p>
                                    </div>
                                </button>
                            </div>

                            {accountStatus === "existing" && (
                                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15 space-y-3">
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">How to transfer IB — {brokerInfo.name}</p>
                                    <ol className="text-sm text-blue-600 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
                                        {brokerInfo.ibTransferGuide.steps.map((s, i) => <li key={i}>{s}</li>)}
                                    </ol>
                                    {brokerInfo.ibTransferGuide.emails && (
                                        <div className="p-3 rounded-lg bg-white dark:bg-[#151925] border border-blue-100 dark:border-white/5 space-y-1.5">
                                            <div className="text-xs space-y-0.5 text-gray-700 dark:text-gray-300">
                                                <p><strong>To:</strong> {brokerInfo.ibTransferGuide.emails.to}</p>
                                                {brokerInfo.ibTransferGuide.emails.cc && <p><strong>CC:</strong> {brokerInfo.ibTransferGuide.emails.cc}</p>}
                                                <p><strong>Subject:</strong> {brokerInfo.ibTransferGuide.emails.subject}</p>
                                                <p><strong>Content:</strong> {brokerInfo.ibTransferGuide.emails.body}</p>
                                            </div>
                                            <button onClick={() => copyToClipboard(brokerInfo.ibTransferGuide.emails!.body)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1">
                                                <Copy size={10} /> {copied ? "Copied!" : "Copy email"}
                                            </button>
                                        </div>
                                    )}
                                    {brokerInfo.ibTransferGuide.note && (
                                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/15 rounded-lg p-2.5">
                                            ⚠️ {brokerInfo.ibTransferGuide.note}
                                        </p>
                                    )}
                                </div>
                            )}

                            {accountStatus && (
                                <div className="flex justify-end pt-4">
                                    <Button variant="primary" onClick={() => setStep("pro-details")} className="gap-2">Continue <ArrowRight size={16}/></Button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 6. PRO - DETAILS */}
                {step === "pro-details" && brokerInfo && selectedBroker && (
                    <>
                        {renderHeader("Account Details", "Step 3 of 4: Enter your account information")}
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PremiumInput label="Account Number *" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 12345678" />
                                <PremiumInput label="Balance (USD) *" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="e.g. 200" />
                                <PremiumInput label="Telegram ID *" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="@yourusername" />
                                <PremiumInput label="Email *" value={userEmail} disabled />
                                {brokerInfo.requiresFullName && <PremiumInput label="Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} />}
                                {brokerInfo.requiresCountry && <PremiumInput label="Country *" value={country} onChange={(e) => setCountry(e.target.value)} />}
                            </div>
                            {/* Screenshot proof — optional but shown to admin */}
                            <PremiumInput
                                label="Account Screenshot URL (optional)"
                                placeholder="https://imgur.com/... or Google Drive link"
                                value={screenshotUrl}
                                onChange={(e) => setScreenshotUrl(e.target.value)}
                            />
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-2">
                                Paste a link to a screenshot of your broker account page showing your account number and balance. Helps speed up verification.
                            </p>
                            <div className="flex justify-end pt-4">
                                <Button 
                                    variant="primary" 
                                    onClick={() => {
                                        if (!accountNumber || !balance || !telegramId || (brokerInfo.requiresFullName && !fullName) || (brokerInfo.requiresCountry && !country)) {
                                            setError("Please fill in all required fields");
                                            return;
                                        }
                                        setError(null);
                                        setStep("pro-review");
                                    }} 
                                    className="gap-2"
                                >
                                    Review <ArrowRight size={16}/>
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* 7. PRO - REVIEW & SUBMIT */}
                {step === "pro-review" && brokerInfo && selectedBroker && (
                    <>
                        {renderHeader("Review Request", "Step 4 of 4: Confirm your information")}
                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div><p className="text-[10px] text-gray-500 uppercase">Broker</p><p className="font-bold text-gray-800 dark:text-white">{brokerInfo.name}</p></div>
                                    <div><p className="text-[10px] text-gray-500 uppercase">Account</p><p className="font-bold text-gray-800 dark:text-white">{accountNumber}</p></div>
                                    <div><p className="text-[10px] text-gray-500 uppercase">Balance</p><p className="font-bold text-gray-800 dark:text-white">${balance}</p></div>
                                    <div><p className="text-[10px] text-gray-500 uppercase">Telegram</p><p className="font-bold text-gray-800 dark:text-white">{telegramId}</p></div>
                                    {brokerInfo.requiresFullName && <div><p className="text-[10px] text-gray-500 uppercase">Name</p><p className="font-bold text-gray-800 dark:text-white">{fullName}</p></div>}
                                    {brokerInfo.requiresCountry && <div><p className="text-[10px] text-gray-500 uppercase">Country</p><p className="font-bold text-gray-800 dark:text-white">{country}</p></div>}
                                    {screenshotUrl && <div className="col-span-2 sm:col-span-3"><p className="text-[10px] text-gray-500 uppercase">Screenshot</p><a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline truncate block">{screenshotUrl}</a></div>}
                                </div>
                            </div>

                            <TurnstileWidget onVerify={setTurnstileToken} className="flex justify-center" />

                            <div className="flex justify-end gap-3">
                                <Button variant="primary" onClick={() => setShowConfirm(true)} disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                                    <Check size={16} /> Submit Request
                                </Button>
                            </div>

                            {/* Confirm Sub-Modal */}
                            {showConfirm && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm rounded-xl">
                                    <div className="w-full max-w-sm bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            <AlertCircle className="text-amber-500" /> Confirm Submission
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            I confirm that this account is registered under the correct IB and all information is accurate.
                                        </p>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                                            <Button variant="primary" onClick={handleProSubmit} disabled={isPending} className="bg-amber-500 hover:bg-amber-600 border-none">
                                                {isPending ? <Loader2 size={16} className="animate-spin" /> : "Confirm"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 8. PRO - SUCCESS */}
                {step === "pro-success" && (
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Request Submitted!</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                            Your VIP request is under review. The account has been added to your dashboard. We will upgrade its status once verified.
                        </p>
                        
                        {createdAccount?.apiKey && (
                            <div className="text-left mt-6">
                                <div className="p-4 bg-gray-50 dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                        Your Sync API Key
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 p-3 bg-white dark:bg-[#1E2028] rounded-lg text-sm font-mono text-primary break-all border border-gray-200 dark:border-white/10">
                                            {createdAccount.apiKey}
                                        </code>
                                        <Button
                                            variant="primary"
                                            size="icon"
                                            onClick={() => copyToClipboard(createdAccount.apiKey)}
                                            className="h-11 w-11 rounded-lg shrink-0"
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This key works for both TNT Connect and EA Sync. Save it now — you can find it later in Settings → TNT Connect.</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button variant="primary" onClick={() => { handleClose(); onSuccess(createdAccount); }} className="w-full h-12 font-bold">
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
