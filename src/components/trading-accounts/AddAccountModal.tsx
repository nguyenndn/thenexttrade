"use client";

import { useState } from "react";
import { X, Copy, Download, Check, ArrowRight, MonitorPlay } from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { createTradingAccount } from "@/actions/accounts";

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (account: any) => void;
}

type Step = "select-platform" | "create" | "setup-instructions";

export function AddAccountModal({
    isOpen,
    onClose,
    onSuccess,
}: AddAccountModalProps) {
    const [step, setStep] = useState<Step>("select-platform");
    const [platform, setPlatform] = useState<string>("");
    const [name, setName] = useState("");
    const [color, setColor] = useState("hsl(var(--primary))");

    // Broker is auto-detected by EA, removed manual input
    const [isCreating, setIsCreating] = useState(false);
    const [createdAccount, setCreatedAccount] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const platforms = [
        { id: "MT4", name: "MetaTrader 4", description: "Classic MT4 platform", disabled: false },
        { id: "MT5", name: "MetaTrader 5", description: "Latest MT5 platform", disabled: false },
    ];

    async function handleCreate() {
        if (!name) {
            toast.error("Please enter an account name");
            return;
        }

        setIsCreating(true);
        try {
            const result = await createTradingAccount({
                platform,
                name,
                color,
                balance: 0,
                currency: "USD",
            });

            if (result.error) throw new Error(result.error);

            if (result.account) {
                setCreatedAccount(result.account);
                setStep("setup-instructions");
                toast.success("Account created successfully!");
                onSuccess(result.account);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create account");
        } finally {
            setIsCreating(false);
        }
    }

    function copyApiKey() {
        navigator.clipboard.writeText(createdAccount?.apiKey || "");
        setCopied(true);
        toast.success("API Key copied!");
        setTimeout(() => setCopied(false), 2000);
    }

    function handleClose() {
        setStep("select-platform");
        setPlatform("");
        setName("");
        setCreatedAccount(null);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
            <div className="relative z-10 bg-white dark:bg-[#1E2028] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 cursor-default">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {step === "select-platform" && "Connect Logic - Select Platform"}
                        {step === "create" && "Account Details"}
                        {step === "setup-instructions" && "Setup Instructions"}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        aria-label="Close modal"
                        className="rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Select Platform */}
                    {step === "select-platform" && (
                        <div className="space-y-4">
                            {platforms.map((p) => (
                                <Button
                                    key={p.id}
                                    variant="outline"
                                    disabled={p.disabled}
                                    onClick={() => {
                                        setPlatform(p.id);
                                        setStep("create");
                                    }}
                                    className={`
                    w-full flex items-center justify-between gap-4 p-4 h-auto rounded-xl border transition-all text-left group
                    ${p.disabled
                                            ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500"
                                            : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] hover:border-primary hover:bg-white dark:hover:bg-[#151925] hover:shadow-md transition-shadow dark:hover:shadow-primary/10"
                                        }
                  `}
                                >
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-primary transition-colors">
                                            {p.name}
                                        </p>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 normal-case">{p.description}</p>
                                    </div>
                                    {!p.disabled && <ArrowRight size={20} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Account Details */}
                    {step === "create" && (
                        <div className="space-y-6">
                            <PremiumInput
                                label="Account Name"
                                placeholder={`e.g. My ${platform} Growth`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
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
                                    variant="outline"
                                    onClick={() => setStep("select-platform")}
                                    className="px-6 h-12 font-bold"
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                    className="flex-1 h-12 font-bold shadow-lg shadow-primary/20"
                                >
                                    {isCreating ? (
                                        <>
                                            <MonitorPlay size={20} className="animate-spin mr-2" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Setup Instructions */}
                    {step === "setup-instructions" && createdAccount && (
                        <div className="space-y-6">
                            {/* API Key */}
                            <div className="p-4 bg-gray-50 dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                    Your API Key (Shown Once)
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-3 bg-white dark:bg-[#1E2028] rounded-lg text-sm font-mono text-primary break-all border border-gray-200 dark:border-white/10">
                                        {createdAccount.apiKey}
                                    </code>
                                    <Button
                                        variant="primary"
                                        size="icon"
                                        onClick={copyApiKey}
                                        aria-label="Copy API Key"
                                        className="h-11 w-11 rounded-lg shrink-0 hover:bg-[#00B377]"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </Button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">
                                    Setup Steps
                                </h3>
                                <ol className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                            1
                                        </span>
                                        <span>
                                            Download the <strong className="text-gray-900 dark:text-white">GSN Trade Sync EA</strong> for {platform}.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                            2
                                        </span>
                                        <span className="break-all">
                                            Copy the file to your <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">MQL{platform === "MT5" ? "5" : "4"}/Experts</code> folder.
                                        </span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                            3
                                        </span>
                                        <span>Restart {platform} and attach EA to any chart.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                            4
                                        </span>
                                        <span>Paste the API Key above into EA settings input.</span>
                                    </li>
                                </ol>
                            </div>

                            {/* Download Button */}
                            <a
                                href={`/downloads/GSN_TradeSync_${platform}.ex${platform === "MT5" ? "5" : "4"}`}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-[#00B377] transition-colors shadow-lg shadow-primary/20"
                            >
                                <Download size={18} />
                                Download EA for {platform}
                            </a>

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
                    )}
                </div>
            </div>
        </div>
    );
}
