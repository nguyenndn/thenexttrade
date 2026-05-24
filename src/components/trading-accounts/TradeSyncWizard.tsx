"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { 
    Cable, 
    Monitor, 
    Download, 
    ArrowRight, 
    ArrowLeft, 
    Key, 
    Copy, 
    Check, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    Info 
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TradingAccount {
    id: string;
    name: string;
    broker: string | null;
    accountNumber: string | null;
}

interface TradeSyncWizardProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: TradingAccount[];
}

export function TradeSyncWizard({ isOpen, onClose, accounts }: TradeSyncWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [syncMethod, setSyncMethod] = useState<"TNT_CONNECT" | "EA_SYNC">("TNT_CONNECT");
    
    // API Key states
    const [isLoadingKey, setIsLoadingKey] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [keyData, setKeyData] = useState<{
        hasKey: boolean;
        key: string | null;
        fullKey: string | null;
        createdAt: string | null;
    }>({ hasKey: false, key: null, fullKey: null, createdAt: null });
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [showFullKey, setShowFullKey] = useState(false);
    
    // Checkbox confirmation in step 3
    const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
        if (isOpen && step === 2) {
            fetchKey();
        }
    }, [isOpen, step]);

    const fetchKey = async () => {
        setIsLoadingKey(true);
        try {
            const res = await fetch("/api/sync/api-key");
            if (res.ok) {
                const data = await res.json();
                setKeyData(data);
            }
        } catch {
            toast.error("Failed to load Sync API Key");
        } finally {
            setIsLoadingKey(false);
        }
    };

    const handleGenerateKey = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/sync/api-key", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setGeneratedKey(data.key);
            setShowFullKey(true);
            setKeyData({ 
                hasKey: true, 
                key: data.key, 
                fullKey: data.key, 
                createdAt: new Date().toISOString() 
            });
            toast.success("Sync API key generated!");
        } catch (e: any) {
            toast.error(e.message || "Failed to generate key");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyKey = () => {
        const keyToCopy = generatedKey || keyData.fullKey;
        if (keyToCopy) {
            navigator.clipboard.writeText(keyToCopy);
            setCopied(true);
            toast.success("API key copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNext = () => {
        if (step < 3) {
            setStep((prev) => (prev + 1) as any);
        } else {
            onClose();
            setStep(1);
            setIsConfirmed(false);
            toast.success("Setup wizard completed!");
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((prev) => (prev - 1) as any);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-[#1E2028] border-gray-200 dark:border-white/10 shadow-2xl">
                {/* Wizard Steps Indicator */}
                <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-primary/5 to-cyan-500/10 p-6 border-b border-gray-100 dark:border-white/10">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="flex items-center gap-2 text-xl font-black text-gray-800 dark:text-white">
                                <Cable className="w-6 h-6 text-amber-500 animate-pulse" />
                                Interactive Sync Wizard
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                                3 simple steps to sync your MT5 trades automatically.
                            </DialogDescription>
                        </DialogHeader>
                        
                        {/* Step Dots */}
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((s) => (
                                <div 
                                    key={s} 
                                    className={cn(
                                        "h-2 rounded-full transition-all duration-300",
                                        step === s 
                                            ? "w-8 bg-amber-500 shadow-sm shadow-amber-500/30" 
                                            : "w-2 bg-gray-200 dark:bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* ═══════════════════════════════════════════════════════════════
                        STEP 1: SELECT METHOD
                    ═══════════════════════════════════════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="text-center max-w-md mx-auto mb-2">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Choose your connection style</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    TNT Connect works in the background (recommended), while EA Sync attaches directly to a chart in MT5.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Option 1: TNT Connect (Recommended) */}
                                <div 
                                    onClick={() => setSyncMethod("TNT_CONNECT")}
                                    className={cn(
                                        "relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between h-56",
                                        syncMethod === "TNT_CONNECT"
                                            ? "border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] shadow-lg shadow-amber-500/5"
                                            : "border-gray-200 dark:border-white/10 bg-transparent hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.01]"
                                    )}
                                >
                                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                                        Recommended
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Monitor size={18} className="text-amber-500 shrink-0" />
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">TNT Connect App</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            A lightweight Windows app that runs in your system tray, auto-detects MT5, syncs trades, and updates automatically.
                                        </p>
                                    </div>
                                    <div className="pt-4 mt-auto">
                                        <a
                                            href="/downloads/TheNextTradeConnect-1.0.2.exe"
                                            download
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-sm shadow-amber-500/20"
                                        >
                                            <Download size={13} />
                                            Download App (.exe)
                                        </a>
                                    </div>
                                </div>

                                {/* Option 2: EA Sync (Advanced) */}
                                <div 
                                    onClick={() => setSyncMethod("EA_SYNC")}
                                    className={cn(
                                        "relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between h-56",
                                        syncMethod === "EA_SYNC"
                                            ? "border-cyan-500 bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05] shadow-lg shadow-cyan-500/5"
                                            : "border-gray-200 dark:border-white/10 bg-transparent hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.01]"
                                    )}
                                >
                                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-cyan-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                                        Advanced
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Cable size={18} className="text-cyan-500 shrink-0" />
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">EA Sync Package</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            An Expert Advisor (.ex5) placed directly on an MT5 chart. Ideal for users running custom VPS environments or non-Windows devices.
                                        </p>
                                    </div>
                                    <div className="pt-4 mt-auto">
                                        <a
                                            href="/downloads/TheNextTrade_TradeSync.ex5"
                                            download
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs transition-colors shadow-sm shadow-cyan-500/20"
                                        >
                                            <Download size={13} />
                                            Download EA (.ex5)
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════
                        STEP 2: API KEY & ACCOUNT MATCHING
                    ═══════════════════════════════════════════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {/* API Key Panel */}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Key size={16} className="text-amber-500" />
                                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sync API Key</h3>
                                </div>

                                {isLoadingKey ? (
                                    <div className="flex items-center justify-center py-4">
                                        <RefreshCw className="animate-spin text-amber-500" size={20} />
                                    </div>
                                ) : !keyData.hasKey ? (
                                    <div className="text-center py-4 space-y-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">You don't have a Sync API Key generated yet.</p>
                                        <Button
                                            onClick={handleGenerateKey}
                                            variant="outline"
                                            size="sm"
                                            disabled={isGenerating}
                                            className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                                        >
                                            {isGenerating ? "Generating..." : "Generate API Key"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={showFullKey && generatedKey ? generatedKey : (keyData.fullKey || keyData.key || "")}
                                                className="flex-1 px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 select-all focus:outline-none"
                                            />
                                            <Button
                                                onClick={handleCopyKey}
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0 h-[36px] w-[36px] rounded-lg border-gray-200 dark:border-white/10"
                                            >
                                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                            </Button>
                                        </div>
                                        
                                        {showFullKey && generatedKey && (
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400">
                                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                                <p>Save this key now! This is the only time it will be shown in full.</p>
                                            </div>
                                        )}
                                        
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            This secret key connects your local MT5 sync app with your cloud dashboard. Keep it secret.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Account Reference Panel */}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-white dark:bg-white/[0.01]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Info size={16} className="text-cyan-500" />
                                        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Your Registered Accounts</h3>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Match Required</span>
                                </div>

                                {accounts.length === 0 ? (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-red-500 font-bold">No MT5 account registered in Account Hub.</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Please add your MT5 account number in the Hub before syncing.</p>
                                    </div>
                                ) : (
                                    <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                                        {accounts.map((acc) => (
                                            <div key={acc.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{acc.name}</span>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded border border-primary/20">{acc.accountNumber}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════
                        STEP 3: WHITELIST & WEBREQUEST
                    ═══════════════════════════════════════════════════════════════ */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-amber-500/[0.02] p-4 text-xs space-y-3">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    Configure MT5 allowed URLs (Crucial Step)
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    For security and stability, MetaTrader 5 blocks external network requests by default. You must whitelist our secure API gateway:
                                </p>
                                
                                <div className="space-y-2 p-3 bg-gray-50 dark:bg-black/30 rounded-lg border border-gray-200 dark:border-white/5">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Path inside MetaTrader 5:</p>
                                    <p className="font-bold text-gray-700 dark:text-gray-300">Tools &gt; Options &gt; Expert Advisors</p>
                                    
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-3">1. Check the box:</p>
                                    <p className="text-gray-700 dark:text-gray-300">☑ Allow WebRequest for listed URL:</p>
                                    
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-3">2. Add this URL:</p>
                                    <div className="flex gap-2 items-center">
                                        <code className="flex-1 bg-white dark:bg-black/40 p-2 rounded border border-gray-200 dark:border-white/10 font-mono text-[11px] text-primary break-all">https://zcedocoskwlvjturukrg.supabase.co</code>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Checkbox */}
                            <label className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/[0.02] cursor-pointer group hover:bg-primary/[0.04] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                                />
                                <div>
                                    <p className="text-xs font-bold text-gray-800 dark:text-white">I have configured MT5 correctly</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        I have added the secure URL to WebRequest list and pasted my Sync API Key into settings.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01]">
                    {/* Back Button */}
                    {step > 1 ? (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} />
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {/* Next / Finish Button */}
                    <Button
                        variant={step === 3 ? "primary" : "outline"}
                        disabled={step === 3 && !isConfirmed}
                        onClick={handleNext}
                        className={cn(
                            "flex items-center gap-1.5",
                            step === 3 ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 border-none" : "hover:border-primary hover:text-primary"
                        )}
                    >
                        {step === 3 ? "Finish & Active" : "Continue"}
                        {step < 3 && <ArrowRight size={14} />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
