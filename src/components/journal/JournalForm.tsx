"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, AlertCircle, Plus, Brain, Check, X, RefreshCw, ExternalLink, ChevronDown } from "lucide-react";
import { EmotionSelector } from "@/components/psychology/EmotionSelector";
import { MistakeSelector } from "@/components/mistakes/MistakeSelector";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/Button";
import { StrategyModal } from "@/components/strategies/StrategyModal";
import { calculateProfitLoss } from "@/lib/calculators";
import { formatAccountLabel, transformImageUrl } from "@/lib/utils";
import { celebrateXP } from "@/lib/celebrate";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { fetchTradingAccounts } from "@/lib/cached-config";

interface JournalFormProps {
    initialData?: any;
    isEditMode?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function JournalForm({ initialData, isEditMode = false, onSuccess, onCancel }: JournalFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [strategies, setStrategies] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [showStrategyModal, setShowStrategyModal] = useState(false);

    const [formData, setFormData] = useState({
        symbol: initialData?.symbol || "",
        type: initialData?.type || "BUY",
        entryPrice: initialData?.entryPrice || "",
        exitPrice: initialData?.exitPrice || "",
        stopLoss: initialData?.stopLoss || "",
        takeProfit: initialData?.takeProfit || "",
        lotSize: initialData?.lotSize || "",
        entryDate: initialData?.entryDate ? format(new Date(initialData.entryDate), "yyyy-MM-dd'T'HH:mm") : "",
        status: initialData?.status || "OPEN",
        result: initialData?.result || "",
        pnl: initialData?.pnl || "",
        notes: initialData?.notes || "",
        entryReason: initialData?.entryReason || "",
        exitReason: initialData?.exitReason || "",
        accountId: initialData?.accountId || "",
        strategy: initialData?.strategy || "",
        tags: initialData?.tags || [], // Custom Tags
        // Psychology (Phase 44)
        emotionBefore: initialData?.emotionBefore || null,
        emotionAfter: initialData?.emotionAfter || null,
        confidenceLevel: initialData?.confidenceLevel || null,
        followedPlan: initialData?.followedPlan === undefined ? null : initialData?.followedPlan,
        notesPsychology: initialData?.notesPsychology || "",
        // Mistakes (Phase 45)
        mistakes: initialData?.mistakes || [],
        // Screenshots (Phase 53)
        images: initialData?.images || []
    });

    const [customTagInput, setCustomTagInput] = useState("");

    const addCustomTag = () => {
        if (!customTagInput.trim()) return;
        if (!formData.tags.includes(customTagInput.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, customTagInput.trim()] }));
        }
        setCustomTagInput("");
    };

    const removeCustomTag = (tag: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tag) }));
    };

    const fetchStrategies = async () => {
        try {
            const res = await fetch("/api/strategies");
            const data = await res.json();
            setStrategies(data.strategies || []);
        } catch (error) {
            console.error("Failed to load strategies", error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const accs = await fetchTradingAccounts();
            setAccounts(accs);

            // Set default account if creating new and none selected
            if (!isEditMode && !formData.accountId) {
                const defaultAccount = accs.find((a: any) => a.isDefault);
                if (defaultAccount) {
                    setFormData(prev => ({ ...prev, accountId: defaultAccount.id }));
                }
            }
        } catch (error) {
            console.error("Failed to load accounts", error);
        }
    };

    useEffect(() => {
        fetchStrategies();
        fetchAccounts();
        
        // Anti-pattern Fix: Client-side Date Initialization prevents Hydration Mismatch
        if (!isEditMode && !formData.entryDate) {
             setFormData(prev => ({ ...prev, entryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm") }));
        }
    }, []);

    // Auto-Calculate PnL
    useEffect(() => {
        const { entryPrice, exitPrice, lotSize, type, symbol } = formData;

        if (entryPrice && exitPrice && lotSize && symbol) {
            const entry = parseFloat(entryPrice);
            const exit = parseFloat(exitPrice);
            const lots = parseFloat(lotSize);

            if (!isNaN(entry) && !isNaN(exit) && !isNaN(lots)) {
                const result = calculateProfitLoss({
                    entryPrice: entry,
                    exitPrice: exit,
                    lotSize: lots,
                    direction: type === "BUY" ? "LONG" : "SHORT",
                    pair: symbol
                });
                setFormData(prev => ({ ...prev, pnl: result.profitLoss.toString() }));
            }
        }
    }, [formData.entryPrice, formData.exitPrice, formData.lotSize, formData.type, formData.symbol]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Phase 9: Data Validation Shield
        const ep = parseFloat(formData.entryPrice);
        const sl = formData.stopLoss ? parseFloat(formData.stopLoss) : null;
        const tp = formData.takeProfit ? parseFloat(formData.takeProfit) : null;

        if (!isNaN(ep)) {
            if (formData.type === "BUY") {
                if (sl !== null && sl >= ep) return toast.error("Invalid Logic: For BUY trades, Stop Loss must be LOWER than Entry Price.");
                if (tp !== null && tp <= ep) return toast.error("Invalid Logic: For BUY trades, Take Profit must be HIGHER than Entry Price.");
            } else if (formData.type === "SELL") {
                if (sl !== null && sl <= ep) return toast.error("Invalid Logic: For SELL trades, Stop Loss must be HIGHER than Entry Price.");
                if (tp !== null && tp >= ep) return toast.error("Invalid Logic: For SELL trades, Take Profit must be LOWER than Entry Price.");
            }
        }

        setIsSubmitting(true);

        try {
            // Auto-add pending image URL if user forgot to click add
            let currentImages = formData.images || [];
            if (imageInputRef.current) {
                const pendingUrl = imageInputRef.current.value.trim();
                if (pendingUrl) {
                    if (pendingUrl.startsWith("http")) {
                        const directUrl = transformImageUrl(pendingUrl);
                        currentImages = [...currentImages, directUrl];
                        // Clear input to indicate it was handled
                        imageInputRef.current.value = "";
                    }
                }
            }

            // Convert numbers
            const payload: any = {
                ...formData,
                images: currentImages,
                entryPrice: parseFloat(formData.entryPrice),
                exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
                stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
                takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
                lotSize: parseFloat(formData.lotSize),
                pnl: formData.pnl ? parseFloat(formData.pnl) : null,
                result: formData.result || null,
                strategy: formData.strategy || null,
                accountId: formData.accountId || null,
                tags: formData.tags || [],
                // Psychology
                emotionBefore: formData.emotionBefore || null,
                emotionAfter: formData.emotionAfter || null,
                confidenceLevel: formData.confidenceLevel ? parseInt(formData.confidenceLevel.toString()) : null,
                followedPlan: formData.followedPlan,
                notesPsychology: formData.notesPsychology || null,
                // Mistakes (Phase 45)
                mistakes: formData.mistakes || [],
                // Screenshots (Phase 53) - Handled above in currentImages
            };

            // For synced trades, strip locked core data to prevent
            // unintended overwrites (e.g. entryDate timezone drift changing sort order)
            if (isSynced) {
                delete payload.symbol;
                delete payload.type;
                delete payload.entryPrice;
                delete payload.exitPrice;
                delete payload.stopLoss;
                delete payload.takeProfit;
                delete payload.lotSize;
                delete payload.pnl;
                delete payload.entryDate;
                delete payload.status;
                delete payload.result;
                delete payload.accountId;
            }

            const url = isEditMode ? `/api/journal-entries/${initialData.id}` : "/api/journal-entries";
            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed using API");
            }

            const responseData = await res.json();

            if (!isEditMode && responseData.gamification?.xpEarned) {
                await celebrateXP({
                    xp: responseData.gamification.xpEarned,
                    message: "Trade Logged Successfully!",
                    badge: responseData.gamification.isFirstTrade ? "First Trade" : null,
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                toast.success(isEditMode ? "Trade updated successfully" : "Trade logged successfully");
                router.push("/dashboard/journal");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check for Synced Trade
    const isSynced = !!initialData?.externalTicket;

    return (
        <div className="w-full mx-auto space-y-6">
            {/* Header - Only show if not in modal (i.e. if onCancel is not provided, or explicit prop) 
                For now, if onCancel is provided, we assume it's a modal and hide the main header 
            */}
            {!onCancel && (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/journal" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-700 dark:text-white">
                            {isEditMode ? "Edit Trade" : "Log New Trade"}
                        </h1>
                    </div>
                </div>
            )}

            {isSynced && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20 text-sm font-medium">
                    <AlertCircle size={16} />
                    This trade was synced from MT5. Core data is locked. You can edit notes and psychology.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                        Trade Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Account Selection */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Trading Account</label>
                            <select
                                name="accountId"
                                value={formData.accountId}
                                onChange={handleChange}
                                disabled={isSynced || isEditMode}
                                className={`w-full h-[50px] px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none font-medium transition-all ${isSynced || isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Select Account (Optional)</option>
                                {accounts.map((acc: any) => (
                                    <option key={acc.id} value={acc.id}>
                                        {formatAccountLabel(acc)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Pair / Symbol</label>
                            <input
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleChange}
                                placeholder="EURUSD"
                                disabled={isSynced}
                                className={`w-full h-[50px] px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none uppercase font-bold transition-all ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Date & Time</label>
                            <input
                                type="datetime-local"
                                name="entryDate"
                                value={formData.entryDate}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-[50px] px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Type</label>
                            <div className={`flex bg-gray-50 dark:bg-black/20 p-1 rounded-xl border border-gray-200 dark:border-white/10 h-[50px] ${isSynced ? 'opacity-60 pointer-events-none' : ''}`}>
                                {["BUY", "SELL"].map(type => (
                                    <Button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, type }))}
                                        className={`flex-1 h-full text-sm font-bold transition-all rounded-lg ${formData.type === type
                                            ? type === 'BUY' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                            : 'bg-transparent text-gray-600 hover:bg-white dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-[50px] px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                <option value="OPEN">OPEN - Running</option>
                                <option value="CLOSED">CLOSED - Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Price & Risk */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                        Pricing & Risk
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Entry Price</label>
                            <input
                                type="number" step="any"
                                name="entryPrice"
                                value={formData.entryPrice}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none font-mono ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Lot Size</label>
                            <input
                                type="number" step="any"
                                name="lotSize"
                                value={formData.lotSize}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none font-mono ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Exit Price</label>
                            <input
                                type="number" step="any"
                                name="exitPrice"
                                value={formData.exitPrice}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none font-mono ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-red-500">Stop Loss</label>
                            <input
                                type="number" step="any"
                                name="stopLoss"
                                value={formData.stopLoss}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 focus:border-red-500 focus:outline-none font-mono ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary">Take Profit</label>
                            <input
                                type="number" step="any"
                                name="takeProfit"
                                value={formData.takeProfit}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full p-3 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/20 focus:border-primary focus:outline-none font-mono ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Profit / Loss (Cash)</label>
                            <input
                                type="number" step="any"
                                name="pnl"
                                value={formData.pnl}
                                onChange={handleChange}
                                placeholder="Auto or Manual"
                                disabled={isSynced}
                                className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none font-mono font-bold ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Analysis */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                        Analysis & Result
                    </h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">

                            {/* Strategy Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Strategy</label>
                                {strategies.length === 0 ? (
                                    /* Empty State — no strategies yet */
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10">
                                        <span className="text-sm text-gray-500 flex-1">No strategies found</span>
                                        <a
                                            href="/dashboard/strategies"
                                            target="_blank"
                                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                            Create Strategy
                                        </a>
                                    </div>
                                ) : (
                                    /* Has strategies — show dropdown + refresh */
                                    <div className="flex gap-2">
                                        <DropdownMenu className="flex-1">
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-between p-3 h-auto rounded-xl bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium"
                                                >
                                                    <span className={`flex items-center gap-2 ${formData.strategy ? "text-gray-700 dark:text-white" : "text-gray-500"}`}>
                                                        {formData.strategy ? (
                                                            <>
                                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: strategies.find((s: any) => s.name === formData.strategy)?.color || '#6366F1' }} />
                                                                {formData.strategy}
                                                            </>
                                                        ) : "No Strategy"}
                                                    </span>
                                                    <ChevronDown size={16} className="text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="max-h-[240px] overflow-y-auto">
                                                <DropdownMenuItem
                                                    onClick={() => setFormData(p => ({ ...p, strategy: "" }))}
                                                    className={!formData.strategy ? "bg-gray-100 dark:bg-white/10" : ""}
                                                >
                                                    No Strategy
                                                </DropdownMenuItem>
                                                {strategies.map((s: any) => (
                                                    <DropdownMenuItem
                                                        key={s.id}
                                                        onClick={() => setFormData(p => ({ ...p, strategy: s.name }))}
                                                        className={formData.strategy === s.name ? "bg-gray-100 dark:bg-white/10" : ""}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#6366F1' }} />
                                                            {s.name}
                                                        </span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={fetchStrategies}
                                            aria-label="Refresh strategies"
                                            className="p-3 w-12 h-12 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-600 hover:text-primary"
                                            title="Refresh strategies"
                                        >
                                            <RefreshCw size={18} />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Custom Tags */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Custom Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(formData.tags || []).map((tag: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold border border-gray-200 dark:border-white/10 flex items-center gap-1">
                                            {tag}
                                            <Button variant="outline" size="icon" type="button" onClick={() => removeCustomTag(tag)} aria-label={`Remove tag ${tag}`} className="w-4 h-4 hover:bg-transparent border-transparent hover:text-red-500 p-0 text-gray-500">
                                                <X size={12} />
                                            </Button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCustomTag();
                                            }
                                        }}
                                        placeholder="Add custom tag (e.g. NFP, Test)..."
                                        className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addCustomTag()}
                                        className="h-[50px] px-6 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-primary font-bold gap-2"
                                    >
                                        Add <Plus size={20} />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Entry Reason</label>
                                <textarea
                                    name="entryReason"
                                    value={formData.entryReason}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Why did you take this trade?"
                                />
                            </div>

                            {/* Mistakes */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Mistakes</label>
                                <MistakeSelector
                                    value={formData.mistakes}
                                    onChange={(val) => setFormData(prev => ({ ...prev, mistakes: val }))}
                                    label=""
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Exit Reason / Result</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        {(["WIN", "LOSS", "BREAK_EVEN"] as const).map(res => {
                                            const isActive = formData.result === res;
                                            const activeColorMap: Record<string, string> = {
                                                WIN: 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:border-emerald-500 dark:text-white',
                                                LOSS: 'bg-red-500 border-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:border-red-500 dark:text-white',
                                                BREAK_EVEN: 'bg-gray-500 border-gray-500 text-white hover:bg-gray-600 dark:bg-gray-500 dark:border-gray-500 dark:text-white',
                                            };
                                            const labelMap: Record<string, string> = { WIN: "WIN", LOSS: "LOSS", BREAK_EVEN: "EVEN" };
                                            return (
                                                <Button
                                                    key={res}
                                                    type="button"
                                                    variant={isActive ? "primary" : "outline"}
                                                    disabled={isSynced}
                                                    onClick={() => setFormData(p => ({ ...p, result: res }))}
                                                    className={`flex-1 py-4 text-xs font-bold transition-all rounded-lg ${isActive
                                                        ? activeColorMap[res]
                                                        : `border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 ${isSynced ? 'opacity-60 cursor-not-allowed' : ''}`
                                                        }`}
                                                >
                                                    {labelMap[res]}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <textarea
                                        name="exitReason"
                                        value={formData.exitReason}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none resize-none"
                                        rows={2}
                                        placeholder="What happened?"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Psychology Tracking (Phase 44) */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
                            <Brain size={20} />
                        </div>
                        Psychology Tracking
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full ml-2">Optional</span>
                    </h3>

                    <div className="space-y-8">
                        {/* Emotion Before Entry */}
                        <div className="space-y-2">
                            <EmotionSelector
                                value={formData.emotionBefore}
                                onChange={(value) => setFormData({ ...formData, emotionBefore: value })}
                                label="How did you feel BEFORE entering this trade?"
                                phase="before"
                            />
                        </div>

                        {/* Emotion After Exit */}
                        {formData.status === "CLOSED" && (
                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-white/10">
                                <EmotionSelector
                                    value={formData.emotionAfter}
                                    onChange={(value) => setFormData({ ...formData, emotionAfter: value })}
                                    label="How did you feel AFTER closing this trade?"
                                    phase="after"
                                />
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-gray-200 dark:border-white/10">
                            {/* Confidence Level */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Confidence Level (Pre-Entry)
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <Button
                                            key={level}
                                            type="button"
                                            variant="outline"
                                            onClick={() => setFormData({ ...formData, confidenceLevel: level })}
                                            className={`
                                              w-12 h-12 rounded-xl font-bold text-lg transition-all border p-0
                                              ${formData.confidenceLevel === level
                                                    ? "bg-purple-500 text-white border-purple-500 ring-2 ring-purple-300 ring-offset-2 dark:ring-offset-gray-900 shadow-lg shadow-purple-500/20 hover:bg-purple-600 hover:text-white"
                                                    : "bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5 border-gray-200 dark:border-white/10"
                                                }
                                            `}
                                        >
                                            {level}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    1 = Uncertain, 5 = Very Confident
                                </p>
                            </div>

                            {/* Plan Adherence */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Did you follow your plan?
                                </label>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant={formData.followedPlan === true ? "primary" : "outline"}
                                        onClick={() => setFormData({ ...formData, followedPlan: true })}
                                        className={`
                                            flex-1 min-h-[50px] rounded-xl font-bold transition-all flex items-center justify-center gap-2 border
                                            ${formData.followedPlan === true
                                                ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20 hover:bg-green-600"
                                                : "bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-500 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5"
                                            }
                                          `}
                                    >
                                        <Check size={18} />
                                        Yes
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.followedPlan === false ? "primary" : "outline"}
                                        onClick={() => setFormData({ ...formData, followedPlan: false })}
                                        className={`
                                            flex-1 min-h-[50px] rounded-xl font-bold transition-all flex items-center justify-center gap-2 border
                                            ${formData.followedPlan === false
                                                ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20 hover:bg-red-600"
                                                : "bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-500 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5"
                                            }
                                          `}
                                    >
                                        <X size={18} />
                                        No
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Psychology Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Psychology Notes</label>
                            <textarea
                                name="notesPsychology"
                                value={formData.notesPsychology}
                                onChange={handleChange}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none resize-none"
                                rows={3}
                                placeholder="What thoughts influenced your decision? Any emotional triggers?"
                            />
                        </div>
                    </div>
                </div>

                {/* Strategy Modal */}
                {showStrategyModal && (
                    <StrategyModal
                        onClose={() => setShowStrategyModal(false)}
                        onSave={() => {
                            setShowStrategyModal(false);
                            fetchStrategies();
                        }}
                    />
                )}

                {/* Screenshots Section (Phase 53) */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
                        Trade Screenshots
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Existing Images */}
                        {(formData.images || []).map((rawImg: string, idx: number) => {
                            const img = transformImageUrl(rawImg);
                            return (
                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group border border-gray-200 dark:border-white/10">
                                    <Image
                                        src={img}
                                        alt={`Screenshot ${idx + 1}`}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500 text-sm p-4 text-center">Image failed to load<br/><span class="text-xs opacity-60 break-all">${img}</span></div>`;
                                            }
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            aria-label="Remove image"
                                            onClick={() => {
                                                const newImages = [...(formData.images || [])];
                                                newImages.splice(idx, 1);
                                                setFormData(prev => ({ ...prev, images: newImages }));
                                            }}
                                            className="w-10 h-10 rounded-full hover:scale-110 transition-transform shadow-lg"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* URL Input */}
                        <div className="flex gap-2 items-start">
                            <input
                                ref={imageInputRef}
                                type="url"
                                placeholder="Paste image URL (e.g. TradingView, Imgur)..."
                                className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-primary focus:outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        const url = input.value.trim();
                                        if (url) {
                                            if (url.startsWith("http")) {
                                                const directUrl = transformImageUrl(url);
                                                setFormData(prev => ({ ...prev, images: [...(prev.images || []), directUrl] }));
                                                input.value = "";
                                            } else {
                                                toast.error("URL must start with http:// or https://");
                                            }
                                        }
                                    }
                                }}
                            />
                            <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            if (imageInputRef.current) {
                                                const url = imageInputRef.current.value.trim();
                                                if (url) {
                                                    if (url.startsWith("http")) {
                                                        const directUrl = transformImageUrl(url);
                                                        setFormData(prev => ({ ...prev, images: [...(prev.images || []), directUrl] }));
                                                        imageInputRef.current.value = "";
                                                    } else {
                                                        toast.error("URL must start with http:// or https://");
                                                    }
                                                }
                                            }
                                        }}
                                        className="h-[50px] px-6 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-primary font-bold gap-2"
                                    >
                                        Add <Plus size={20} />
                                    </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    {onCancel ? (
                        <Button
                            type="button"
                            onClick={onCancel}
                            variant="outline"
                            className="rounded-xl font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >Cancel
                        </Button>
                    ) : (
                        <Link
                            href="/dashboard/journal"
                            className={buttonVariants({ variant: 'outline', className: "rounded-xl font-bold transition-colors" })}
                        >
                            Cancel
                        </Link>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className=""
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Save Trade
                    </Button>
                </div>
            </form>
        </div>
    );
}
