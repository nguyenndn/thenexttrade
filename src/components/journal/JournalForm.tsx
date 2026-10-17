"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    Plus,
    Brain,
    Check,
    X,
    RefreshCw,
    ExternalLink,
    ChevronDown,
    ClipboardList,
    BookOpen,
    Layers,
    CheckSquare,
    Square,
    ShieldCheck,
    Sparkles,
    ImagePlus,
} from "lucide-react";
import { PlaybookLightbox } from "@/components/strategies/PlaybookLightbox";
import { EmotionSelector } from "@/components/psychology/EmotionSelector";
import { MistakeSelector } from "@/components/mistakes/MistakeSelector";

import { getTradingRulesList } from "@/actions/rulebook";

import Link from "next/link";

import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { StrategyModal } from "@/components/strategies/StrategyModal";
import { calculateProfitLoss } from "@/lib/calculators";
import { formatAccountLabel } from "@/lib/utils";
import { celebrateXP } from "@/lib/celebrate";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface JournalFormProps {
    initialData?: any;
    isEditMode?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

async function fetchTradingAccounts() {
    const res = await fetch("/api/trading-accounts");
    if (!res.ok) throw new Error("Failed to fetch accounts");

    const data = await res.json();
    return Array.isArray(data) ? data : data.accounts || [];
}

export default function JournalForm({
    initialData,
    isEditMode = false,
    onSuccess,
    onCancel,
}: JournalFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImages, setUploadingImages] = useState<number>(0);
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
        entryDate: initialData?.entryDate
            ? format(new Date(initialData.entryDate), "yyyy-MM-dd'T'HH:mm")
            : "",
        status: initialData?.status || "OPEN",
        result: initialData?.result || "",
        pnl: initialData?.pnl !== undefined && initialData?.pnl !== null ? initialData.pnl : "",
        commission: initialData?.commission !== undefined && initialData?.commission !== null ? initialData.commission : "",
        swap: initialData?.swap !== undefined && initialData?.swap !== null ? initialData.swap : "",
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
        followedPlan:
            initialData?.followedPlan === undefined
                ? null
                : initialData?.followedPlan,
        notesPsychology: initialData?.notesPsychology || "",
        // Mistakes (Phase 45)
        mistakes: initialData?.mistakes || [],
        // Screenshots (Phase 53)
        images: initialData?.images || [],
        // Playbook (Phase 2 & 3)
        playbookGrade: initialData?.playbookGrade || "",
        playbookComplianceScore: initialData?.playbookComplianceScore ?? null,
    });

    const [playbookChecks, setPlaybookChecks] = useState<Record<number, boolean>>({});
    const [formLightboxIndex, setFormLightboxIndex] = useState<number | null>(null);
    const [customTagInput, setCustomTagInput] = useState("");
    const [activeRules, setActiveRules] = useState<any[]>([]);
    const [ruleChecks, setRuleChecks] = useState<
        Record<
            string,
            { status: "FOLLOWED" | "BROKEN" | "SKIPPED"; note: string }
        >
    >({});
    useEffect(() => {
        async function loadRules() {
            try {
                const activeRulesList = await getTradingRulesList();
                setActiveRules(activeRulesList.filter((r) => r.isActive));

                if (initialData?.ruleChecks) {
                    const checksMap: any = {};
                    initialData.ruleChecks.forEach((c: any) => {
                        checksMap[c.tradingRuleId] = {
                            status: c.status,
                            note: c.note || "",
                        };
                    });
                    setRuleChecks(checksMap);
                }
            } catch (err) {
                console.error("Failed to load rules", err);
            }
        }
        loadRules();
    }, [initialData]);

    const addCustomTag = () => {
        if (!customTagInput.trim()) return;
        if (!formData.tags.includes(customTagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, customTagInput.trim()],
            }));
        }
        setCustomTagInput("");
    };

    const removeCustomTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t: string) => t !== tag),
        }));
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
                    setFormData((prev) => ({
                        ...prev,
                        accountId: defaultAccount.id,
                    }));
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
            setFormData((prev) => ({
                ...prev,
                entryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    pair: symbol,
                });
                setFormData((prev) => ({
                    ...prev,
                    pnl: result.profitLoss.toString(),
                }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        formData.entryPrice,
        formData.exitPrice,
        formData.lotSize,
        formData.type,
        formData.symbol,
    ]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Phase 9: Data Validation Shield
        const ep = parseFloat(formData.entryPrice);
        const sl = formData.stopLoss ? parseFloat(formData.stopLoss) : null;
        const tp = formData.takeProfit ? parseFloat(formData.takeProfit) : null;

        if (!isNaN(ep)) {
            if (formData.type === "BUY") {
                if (sl !== null && sl >= ep)
                    return toast.error(
                        "Invalid Logic: For BUY trades, Stop Loss must be LOWER than Entry Price."
                    );
                if (tp !== null && tp <= ep)
                    return toast.error(
                        "Invalid Logic: For BUY trades, Take Profit must be HIGHER than Entry Price."
                    );
            } else if (formData.type === "SELL") {
                if (sl !== null && sl <= ep)
                    return toast.error(
                        "Invalid Logic: For SELL trades, Stop Loss must be HIGHER than Entry Price."
                    );
                if (tp !== null && tp >= ep)
                    return toast.error(
                        "Invalid Logic: For SELL trades, Take Profit must be LOWER than Entry Price."
                    );
            }
        }

        setIsSubmitting(true);

        try {
            const currentImages = formData.images || [];

            // Convert ruleChecks mapping back to ruleChecks payload array
            const ruleChecksPayload = Object.entries(ruleChecks).map(
                ([ruleId, check]) => ({
                    tradingRuleId: ruleId,
                    status: check.status,
                    note: check.note || null,
                })
            );

            // Convert numbers
            const payload: any = {
                ...formData,
                images: currentImages,
                entryPrice: parseFloat(formData.entryPrice),
                exitPrice: formData.exitPrice
                    ? parseFloat(formData.exitPrice)
                    : null,
                stopLoss: formData.stopLoss
                    ? parseFloat(formData.stopLoss)
                    : null,
                takeProfit: formData.takeProfit
                    ? parseFloat(formData.takeProfit)
                    : null,
                lotSize: parseFloat(formData.lotSize),
                pnl: formData.pnl !== "" && formData.pnl !== null ? parseFloat(formData.pnl) : null,
                commission: formData.commission !== "" && formData.commission !== null ? parseFloat(formData.commission) : null,
                swap: formData.swap !== "" && formData.swap !== null ? parseFloat(formData.swap) : null,
                result: formData.result || null,
                strategy: formData.strategy || null,
                accountId:
                    formData.accountId && formData.accountId !== "none"
                        ? formData.accountId
                        : null,
                tags: formData.tags || [],
                // Psychology
                emotionBefore: formData.emotionBefore || null,
                emotionAfter: formData.emotionAfter || null,
                confidenceLevel: formData.confidenceLevel
                    ? parseInt(formData.confidenceLevel.toString())
                    : null,
                followedPlan: formData.followedPlan,
                playbookGrade: formData.playbookGrade || null,
                playbookComplianceScore: formData.playbookComplianceScore != null ? formData.playbookComplianceScore : null,
                notesPsychology: formData.notesPsychology || null,
                // Mistakes (Phase 45)
                mistakes: formData.mistakes || [],
                // Rule checks
                ruleChecks: ruleChecksPayload,
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
                delete payload.commission;
                delete payload.swap;
                delete payload.entryDate;
                delete payload.status;
                delete payload.result;
                delete payload.accountId;
            }

            const url = isEditMode
                ? `/api/journal-entries/${initialData.id}`
                : "/api/journal-entries";
            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
                    badge: responseData.gamification.isFirstTrade
                        ? "First Trade"
                        : null,
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                toast.success(
                    isEditMode
                        ? "Trade updated successfully"
                        : "Trade logged successfully"
                );
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
        <div className="w-full mx-auto space-y-4">
            {/* Header - Only show if not in modal (i.e. if onCancel is not provided, or explicit prop) 
 For now, if onCancel is provided, we assume it's a modal and hide the main header 
 */}
            {!onCancel && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/journal"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={18} className="text-gray-600" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-700 dark:text-white">
                            {isEditMode ? "Edit Trade" : "Log New Trade"}
                        </h1>
                    </div>
                </div>
            )}

            {isSynced && (
                <>
                    <div className="hidden md:flex items-center gap-2 py-2 px-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-500/20 text-xs font-medium">
                        <AlertCircle size={14} className="shrink-0" />
                        This trade was synced from MT5. Core data is locked. You
                        can edit notes and psychology.
                    </div>
                    <div className="md:hidden flex items-start gap-2 py-2 px-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-500/20 text-xs font-medium">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold">Synced from MT5</span>
                            <span className="font-normal opacity-90 text-[11px]">
                                For detailed strategy and chart tracking, import
                                your trades from a desktop browser. You can
                                still quick-review your psychology here.
                            </span>
                        </div>
                    </div>
                </>
            )}



            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Main Info Card */}
                <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-5 rounded-lg border border-dashboard shadow-sm space-y-4">
                    <h3 className="text-base font-bold font-sans tracking-tight text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                        Trade Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Account Selection */}
                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Trading Account
                            </label>
                            <Select
                                value={formData.accountId || "none"}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        accountId: value === "none" ? "" : value,
                                    }))
                                }
                                disabled={isSynced || isEditMode}
                            >
                                <SelectTrigger
                                    className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-xs sm:text-sm font-medium transition-all ${isSynced || isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    <SelectValue placeholder="Select Account (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Select Account (Optional)
                                    </SelectItem>
                                    {accounts.map((acc: any) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {formatAccountLabel(acc)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>



                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Pair / Symbol
                            </label>
                            <input
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleChange}
                                placeholder="EURUSD"
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none uppercase font-mono font-bold tracking-wider text-xs sm:text-sm transition-all ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                name="entryDate"
                                value={formData.entryDate}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono text-xs sm:text-sm transition-all ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Type
                            </label>
                            <div
                                className={`flex bg-gray-50 dark:bg-black/20 p-1 rounded-lg border border-dashboard h-10 ${isSynced ? "opacity-60 pointer-events-none" : ""}`}
                            >
                                {["BUY", "SELL"].map((type) => (
                                    <Button
                                        key={type}
                                        type="button"
                                        onClick={() =>
                                            setFormData((p) => ({ ...p, type }))
                                        }
                                        className={`flex-1 h-full text-xs font-bold transition-all rounded-lg ${
                                            formData.type === type
                                                ? type === "BUY"
                                                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                                                    : "bg-red-500 text-white shadow-md shadow-red-500/20"
                                                : "bg-transparent text-gray-600 hover:bg-white dark:hover:bg-white/5"
                                        }`}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Status
                            </label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        status: value,
                                    }))
                                }
                                disabled={isSynced}
                            >
                                <SelectTrigger
                                    className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-xs sm:text-sm transition-all ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPEN">
                                        OPEN - Running
                                    </SelectItem>
                                    <SelectItem value="CLOSED">
                                        CLOSED - Completed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Price & Risk */}
                <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-5 rounded-lg border border-dashboard shadow-sm space-y-4">
                    <h3 className="text-base font-bold font-sans tracking-tight text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                        Pricing & Risk
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Entry Price
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="entryPrice"
                                value={formData.entryPrice}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none font-mono text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Lot Size
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="lotSize"
                                value={formData.lotSize}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none font-mono text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Exit Price
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="exitPrice"
                                value={formData.exitPrice}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none font-mono text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-red-500">
                                Stop Loss
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="stopLoss"
                                value={formData.stopLoss}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 focus:border-red-500 focus:outline-none font-mono text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-primary">
                                Take Profit
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="takeProfit"
                                value={formData.takeProfit}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/20 focus:border-primary focus:outline-none font-mono text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Profit / Loss (Cash)
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="pnl"
                                value={formData.pnl}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none font-mono font-bold text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Commission
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="commission"
                                value={formData.commission}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none font-mono text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Swap
                            </label>
                            <input
                                type="number"
                                step="any"
                                name="swap"
                                value={formData.swap}
                                onChange={handleChange}
                                disabled={isSynced}
                                className={`w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none font-mono text-xs sm:text-sm ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Analysis */}
                <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-5 rounded-lg border border-dashboard shadow-sm space-y-4">
                    <h3 className="text-base font-bold font-sans tracking-tight text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                        Analysis & Result
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Strategy Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Strategy
                                </label>
                                {strategies.length === 0 ? (
                                    /* Empty State — no strategies yet */
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard">
                                        <span className="text-xs text-gray-500 flex-1">
                                            No strategies found
                                        </span>
                                        <a
                                            href="/dashboard/strategies"
                                            target="_blank"
                                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <ExternalLink size={13} />
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
                                                    className="w-full justify-between px-3 h-10 rounded-lg bg-gray-50 dark:bg-black/20 border-dashboard hover:bg-gray-100 dark:hover:bg-white/5 text-xs sm:text-sm font-medium"
                                                >
                                                    <span
                                                        className={`flex items-center gap-2 ${formData.strategy ? "text-gray-700 dark:text-white" : "text-gray-500"}`}
                                                    >
                                                        {formData.strategy ? (
                                                            <>
                                                                <span
                                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                                    style={{
                                                                        backgroundColor:
                                                                            strategies.find(
                                                                                (
                                                                                    s: any
                                                                                ) =>
                                                                                    s.name ===
                                                                                    formData.strategy
                                                                            )
                                                                                ?.color ||
                                                                            "#6366F1",
                                                                    }}
                                                                />
                                                                {
                                                                    formData.strategy
                                                                }
                                                            </>
                                                        ) : (
                                                            "No Strategy"
                                                        )}
                                                    </span>
                                                    <ChevronDown
                                                        size={16}
                                                        className="text-gray-400"
                                                    />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="start"
                                                className="max-h-[240px] overflow-y-auto"
                                            >
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setFormData((p) => ({
                                                            ...p,
                                                            strategy: "",
                                                        }))
                                                    }
                                                    className={
                                                        !formData.strategy
                                                            ? "bg-gray-100 dark:bg-white/10"
                                                            : ""
                                                    }
                                                >
                                                    No Strategy
                                                </DropdownMenuItem>
                                                {strategies.map((s: any) => (
                                                    <DropdownMenuItem
                                                        key={s.id}
                                                        onClick={() =>
                                                            setFormData(
                                                                (p) => ({
                                                                    ...p,
                                                                    strategy:
                                                                        s.name,
                                                                })
                                                            )
                                                        }
                                                        className={
                                                            formData.strategy ===
                                                            s.name
                                                                ? "bg-gray-100 dark:bg-white/10"
                                                                : ""
                                                        }
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                                style={{
                                                                    backgroundColor:
                                                                        s.color ||
                                                                        "#6366F1",
                                                                }}
                                                            />
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
                                            className="p-2 w-10 h-10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 hover:text-primary shrink-0"
                                            title="Refresh strategies"
                                        >
                                            <RefreshCw size={16} />
                                        </Button>
                                    </div>
                                )}

                                {/* Playbook Quick Guide Card & Setup Grade */}
                                {(() => {
                                    const selectedStrategy = strategies.find(
                                        (s: any) => s.name === formData.strategy
                                    );
                                    if (!selectedStrategy || !selectedStrategy.isPlaybook) return null;

                                    const ruleItems: string[] = selectedStrategy.rules
                                        ? selectedStrategy.rules
                                              .split("\n")
                                              .map((r: string) => r.replace(/^[-*•\d.]+\s*/, "").trim())
                                              .filter(Boolean)
                                        : [];

                                    const totalRules = ruleItems.length;
                                    const checkedCount = ruleItems.reduce(
                                        (acc, _, idx) => (playbookChecks[idx] ? acc + 1 : acc),
                                        0
                                    );
                                    const complianceScore =
                                        totalRules > 0 ? Math.round((checkedCount / totalRules) * 100) : 100;

                                    const toggleRuleCheck = (idx: number) => {
                                        const nextChecks = { ...playbookChecks, [idx]: !playbookChecks[idx] };
                                        setPlaybookChecks(nextChecks);

                                        const nextCheckedCount = ruleItems.reduce(
                                            (acc, _, i) => (nextChecks[i] ? acc + 1 : acc),
                                            0
                                        );
                                        const nextScore =
                                            totalRules > 0
                                                ? Math.round((nextCheckedCount / totalRules) * 100)
                                                : 100;

                                        let suggestedGrade = "C";
                                        if (nextScore === 100) suggestedGrade = "A+";
                                        else if (nextScore >= 75) suggestedGrade = "A";
                                        else if (nextScore >= 50) suggestedGrade = "B";

                                        setFormData((p) => ({
                                            ...p,
                                            playbookComplianceScore: nextScore,
                                            playbookGrade: suggestedGrade,
                                        }));
                                    };

                                    return (
                                        <div className="mt-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-3.5">
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen size={16} className="text-gold" />
                                                    <span className="text-xs font-bold text-gold uppercase tracking-wider">
                                                        Playbook Benchmark
                                                    </span>
                                                </div>
                                                {selectedStrategy.setupType && (
                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-gold dark:text-amber-400 border border-amber-500/20">
                                                        {selectedStrategy.setupType}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Ideal Zones & Min RR */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                                {selectedStrategy.idealEntry && (
                                                    <div className="bg-white/60 dark:bg-white/5 p-2.5 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Ideal Entry</span>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200 line-clamp-1">{selectedStrategy.idealEntry}</span>
                                                    </div>
                                                )}
                                                {selectedStrategy.idealStopLoss && (
                                                    <div className="bg-white/60 dark:bg-white/5 p-2.5 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Ideal SL</span>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200 line-clamp-1">{selectedStrategy.idealStopLoss}</span>
                                                    </div>
                                                )}
                                                {selectedStrategy.riskRewardMin != null && (
                                                    <div className="bg-white/60 dark:bg-white/5 p-2.5 rounded-lg border border-dashboard">
                                                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Min R:R</span>
                                                        <span className="font-bold text-gold">{selectedStrategy.riskRewardMin}:1</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pre-Flight Execution Checklist */}
                                            {totalRules > 0 && (
                                                <div className="p-3 rounded-lg bg-white/70 dark:bg-white/5 border border-dashboard space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <ShieldCheck size={14} className="text-gold" />
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                                                Pre-Flight Execution Checklist
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-bold text-gold">
                                                                {checkedCount}/{totalRules} ({complianceScore}%)
                                                            </span>
                                                            <span
                                                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg ${
                                                                    complianceScore === 100
                                                                        ? "bg-emerald-500/10 text-emerald-600"
                                                                        : complianceScore >= 50
                                                                        ? "bg-amber-500/10 text-amber-600"
                                                                        : "bg-red-500/10 text-red-600"
                                                                }`}
                                                            >
                                                                {complianceScore === 100 ? "A+ Ready" : complianceScore >= 50 ? "Caution" : "Unverified"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        {ruleItems.map((rule, idx) => (
                                                            <button
                                                                type="button"
                                                                key={idx}
                                                                onClick={() => toggleRuleCheck(idx)}
                                                                className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2.5 transition-all cursor-pointer border ${
                                                                    playbookChecks[idx]
                                                                        ? "bg-amber-500/10 border-amber-500/40 text-gray-800 dark:text-white"
                                                                        : "bg-white/40 dark:bg-black/20 border-dashboard text-gray-600 dark:text-gray-400 hover:border-gray-300"
                                                                }`}
                                                            >
                                                                {playbookChecks[idx] ? (
                                                                    <CheckSquare size={15} className="text-gold shrink-0" />
                                                                ) : (
                                                                    <Square size={15} className="text-gray-400 shrink-0" />
                                                                )}
                                                                <span className={playbookChecks[idx] ? "font-medium line-through opacity-90" : "font-normal"}>
                                                                    {rule}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reference Charts Preview */}
                                            {selectedStrategy.referenceImages && selectedStrategy.referenceImages.length > 0 && (
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1.5">
                                                        Reference Charts (Click to inspect)
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {selectedStrategy.referenceImages.map((url: string, idx: number) => (
                                                            <button
                                                                type="button"
                                                                key={url}
                                                                onClick={() => setFormLightboxIndex(idx)}
                                                                className="w-16 h-11 rounded-lg overflow-hidden border border-dashboard hover:border-primary transition-colors cursor-pointer"
                                                            >
                                                                <img src={url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Setup Grade Selector */}
                                            <div className="pt-2 border-t border-dashboard/50">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                        Setup Execution Grade
                                                    </label>
                                                    {totalRules > 0 && (
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <Sparkles size={10} className="text-primary" /> Auto-suggested by checklist
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {[
                                                        { grade: "A+", label: "A+ Textbook", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
                                                        { grade: "A", label: "A Standard", color: "text-blue-600 bg-blue-500/10 border-blue-500/30" },
                                                        { grade: "B", label: "B Acceptable", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
                                                        { grade: "C", label: "C Impulsive", color: "text-red-600 bg-red-500/10 border-red-500/30" },
                                                    ].map((g) => (
                                                        <button
                                                            key={g.grade}
                                                            type="button"
                                                            onClick={() => setFormData((p) => ({ ...p, playbookGrade: p.playbookGrade === g.grade ? "" : g.grade }))}
                                                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                                                                formData.playbookGrade === g.grade
                                                                    ? `${g.color} ring-2 ring-primary/40`
                                                                    : "bg-white/60 dark:bg-white/5 border-dashboard text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                            }`}
                                                        >
                                                            {g.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Lightbox for form preview */}
                            {formLightboxIndex !== null && (
                                <PlaybookLightbox
                                    isOpen={formLightboxIndex !== null}
                                    images={
                                        strategies.find((s: any) => s.name === formData.strategy)?.referenceImages || []
                                    }
                                    initialIndex={formLightboxIndex}
                                    title={`${formData.strategy} — Reference Chart`}
                                    onClose={() => setFormLightboxIndex(null)}
                                />
                            )}

                            {/* Custom Tags */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Custom Tags
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                    {(formData.tags || []).map(
                                        (tag: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold border border-dashboard flex items-center gap-1"
                                            >
                                                {tag}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    type="button"
                                                    onClick={() =>
                                                        removeCustomTag(tag)
                                                    }
                                                    aria-label={`Remove tag ${tag}`}
                                                    className="w-3.5 h-3.5 hover:bg-transparent border-transparent hover:text-red-500 p-0 text-gray-500"
                                                >
                                                    <X size={10} />
                                                </Button>
                                            </span>
                                        )
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customTagInput}
                                        onChange={(e) =>
                                            setCustomTagInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addCustomTag();
                                            }
                                        }}
                                        placeholder="Add custom tag (e.g. NFP, Test)..."
                                        className="flex-1 h-10 px-3 text-xs sm:text-sm rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addCustomTag()}
                                        className="h-10 px-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-primary font-bold text-xs gap-1.5"
                                    >
                                        Add <Plus size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Entry Reason
                                </label>
                                <textarea
                                    name="entryReason"
                                    value={formData.entryReason}
                                    onChange={handleChange}
                                    className="w-full p-2.5 text-xs sm:text-sm rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none resize-none"
                                    rows={2}
                                />
                            </div>

                            {/* Mistakes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Mistakes
                                </label>
                                <MistakeSelector
                                    value={formData.mistakes}
                                    onChange={(val) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            mistakes: val,
                                        }))
                                    }
                                    label=""
                                />
                            </div>

                            {/* Rulebook Compliance Checklist */}
                            {activeRules.length > 0 && (
                                <div className="space-y-3 pt-3 border-t border-dashboard">
                                    <h3 className="text-sm font-bold font-sans tracking-tight text-gray-700 dark:text-white flex items-center gap-1.5">
                                        <ClipboardList
                                            size={16}
                                            className="text-primary"
                                        />
                                        Rulebook Compliance Checklist
                                    </h3>
                                    <div className="space-y-2.5">
                                        {activeRules.map((rule) => {
                                            const currentCheck = ruleChecks[
                                                rule.id
                                            ] || {
                                                status: "FOLLOWED",
                                                note: "",
                                            };

                                            return (
                                                <div
                                                    key={rule.id}
                                                    className="p-3 rounded-lg border border-dashboard bg-gray-50/50 dark:bg-black/10 space-y-2.5"
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                                                                        rule.severity ===
                                                                        "HIGH"
                                                                            ? "bg-red-50 text-red-500 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                                                                            : rule.severity ===
                                                                                "MEDIUM"
                                                                              ? "bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                                                              : "bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                                                    }`}
                                                                >
                                                                    {
                                                                        rule.severity
                                                                    }
                                                                </span>
                                                                <span className="text-xs font-black uppercase text-gray-400">
                                                                    {
                                                                        rule.category
                                                                    }
                                                                </span>
                                                            </div>
                                                            <h4 className="text-xs font-bold text-gray-700 dark:text-white mt-0.5">
                                                                {rule.title}
                                                            </h4>
                                                            {rule.description && (
                                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                                    {
                                                                        rule.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            {(
                                                                [
                                                                    "FOLLOWED",
                                                                    "BROKEN",
                                                                    "SKIPPED",
                                                                ] as const
                                                             ).map((status) => (
                                                                <button
                                                                    key={status}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setRuleChecks(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                [rule.id]:
                                                                                    {
                                                                                        ...currentCheck,
                                                                                        status,
                                                                                    },
                                                                            })
                                                                        )
                                                                    }
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                                                                        currentCheck.status ===
                                                                        status
                                                                            ? status ===
                                                                              "FOLLOWED"
                                                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10"
                                                                                : status ===
                                                                                    "BROKEN"
                                                                                  ? "bg-red-500 border-red-500 text-white shadow-sm shadow-red-500/10"
                                                                                  : "bg-gray-500 border-gray-500 text-white shadow-sm shadow-gray-500/10"
                                                                            : "bg-white dark:bg-black/20 text-gray-500 border-dashboard hover:border-gray-400"
                                                                    }`}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {(currentCheck.status ===
                                                        "BROKEN" ||
                                                        currentCheck.status ===
                                                            "SKIPPED") && (
                                                        <div className="pt-2 border-t border-dashboard/50 dark:border-white/[0.04]">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    currentCheck.note ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    setRuleChecks(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [rule.id]:
                                                                                {
                                                                                    ...currentCheck,
                                                                                    note: e
                                                                                        .target
                                                                                        .value,
                                                                                },
                                                                        })
                                                                    )
                                                                }
                                                                placeholder={`Explain why this rule was ${currentCheck.status.toLowerCase()}...`}
                                                                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#1E2028] border border-dashboard focus:border-primary focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Exit Reason / Result
                                </label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        {(
                                            [
                                                "WIN",
                                                "LOSS",
                                                "BREAK_EVEN",
                                            ] as const
                                        ).map((res) => {
                                            const isActive =
                                                formData.result === res;
                                            const activeColorMap: Record<
                                                string,
                                                string
                                            > = {
                                                WIN: "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:border-emerald-500 dark:text-white",
                                                LOSS: "bg-red-500 border-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:border-red-500 dark:text-white",
                                                BREAK_EVEN:
                                                    "bg-gray-500 border-gray-500 text-white hover:bg-gray-600 dark:bg-gray-500 dark:border-gray-500 dark:text-white",
                                            };
                                            const labelMap: Record<
                                                string,
                                                string
                                            > = {
                                                WIN: "WIN",
                                                LOSS: "LOSS",
                                                BREAK_EVEN: "EVEN",
                                            };
                                            return (
                                                <Button
                                                    key={res}
                                                    type="button"
                                                    variant={
                                                        isActive
                                                            ? "primary"
                                                            : "outline"
                                                    }
                                                    disabled={isSynced}
                                                    onClick={() =>
                                                        setFormData((p) => ({
                                                            ...p,
                                                            result: res,
                                                        }))
                                                    }
                                                    className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${
                                                        isActive
                                                            ? activeColorMap[
                                                                  res
                                                              ]
                                                            : `border-dashboard text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 ${isSynced ? "opacity-60 cursor-not-allowed" : ""}`
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
                                        className="w-full p-2.5 text-xs sm:text-sm rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Psychology Tracking (Phase 44) */}
                <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-5 rounded-lg border border-dashboard shadow-sm space-y-4">
                    <h3 className="text-base font-bold font-sans tracking-tight text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="p-1 bg-purple-500/10 text-purple-500 rounded-lg">
                            <Brain size={16} />
                        </div>
                        Psychology Tracking
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full ml-1">
                            Optional
                        </span>
                    </h3>

                    <div className="space-y-4">
                        {/* Emotion Before Entry */}
                        <div className="space-y-1.5">
                            <EmotionSelector
                                value={formData.emotionBefore}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        emotionBefore: value,
                                    })
                                }
                                label="How did you feel BEFORE entering this trade?"
                                phase="before"
                            />
                        </div>

                        {/* Emotion After Exit */}
                        {formData.status === "CLOSED" && (
                            <div className="space-y-1.5 pt-3 border-t border-dashboard">
                                <EmotionSelector
                                    value={formData.emotionAfter}
                                    onChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            emotionAfter: value,
                                        })
                                    }
                                    label="How did you feel AFTER closing this trade?"
                                    phase="after"
                                />
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-dashboard">
                            {/* Confidence Level */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Confidence Level (Pre-Entry)
                                </label>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <Button
                                            key={level}
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    confidenceLevel: level,
                                                })
                                            }
                                            className={`
 w-9 h-9 rounded-lg font-bold text-sm transition-all border p-0
 ${
     formData.confidenceLevel === level
         ? "bg-purple-500 text-white border-purple-500 ring-2 ring-purple-300 ring-offset-2 dark:ring-offset-gray-900 shadow-sm shadow-purple-500/20 hover:bg-purple-600 hover:text-white"
         : "bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5 border-dashboard "
 }
 `}
                                        >
                                            {level}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    1 = Uncertain, 5 = Very Confident
                                </p>
                            </div>

                            {/* Plan Adherence */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Did you follow your plan?
                                </label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={
                                            formData.followedPlan === true
                                                ? "primary"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                followedPlan: true,
                                            })
                                        }
                                        className={`
 flex-1 h-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 border
 ${
     formData.followedPlan === true
         ? "bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/20 hover:bg-green-600"
         : "bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-500 border-dashboard hover:bg-white dark:hover:bg-white/5"
 }
 `}
                                    >
                                        <Check size={14} />
                                        Yes
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            formData.followedPlan === false
                                                ? "primary"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                followedPlan: false,
                                            })
                                        }
                                        className={`
 flex-1 h-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 border
 ${
     formData.followedPlan === false
         ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20 hover:bg-red-600"
         : "bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-500 border-dashboard hover:bg-white dark:hover:bg-white/5"
 }
 `}
                                    >
                                        <X size={14} />
                                        No
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Psychology Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Psychology Notes
                            </label>
                            <textarea
                                name="notesPsychology"
                                value={formData.notesPsychology}
                                onChange={handleChange}
                                className="w-full p-2.5 text-xs sm:text-sm rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none resize-none"
                                rows={2}
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

                {/* Screenshots Section — R2 File Upload */}
                <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-5 rounded-lg border border-dashboard shadow-sm space-y-3.5">
                    <h3 className="text-base font-bold font-sans tracking-tight text-gray-700 dark:text-white flex items-center gap-2">
                        <div className="w-1 h-4 bg-pink-500 rounded-full"></div>
                        Trade Screenshots
                        <span className="text-xs font-medium text-gray-400 ml-auto">
                            {(formData.images || []).length}/2
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Existing Images */}
                        {(formData.images || []).map(
                            (imgUrl: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="relative aspect-video rounded-lg overflow-hidden group border border-dashboard"
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`Screenshot ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
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
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        images: newImages,
                                                    }));
                                                }}
                                                className="w-8 h-8 rounded-full hover:scale-110 transition-transform shadow-lg"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    </div>
                            )
                        )}

                        {/* Upload loading placeholder */}
                        {uploadingImages > 0 && Array.from({ length: uploadingImages }).map((_, idx) => (
                            <div
                                key={`uploading-${idx}`}
                                className="aspect-video rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 flex items-center justify-center"
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    <Loader2 size={20} className="animate-spin text-primary" />
                                    <span className="text-xs font-medium text-primary">Uploading...</span>
                                </div>
                            </div>
                        ))}

                        {/* Upload Drop Zone — hidden when 2 images reached */}
                        {(formData.images || []).length + uploadingImages < 2 && (
                            <label
                                className="aspect-[16/9] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-black/20 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group p-3 text-center"
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
                                onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                    const files = Array.from(e.dataTransfer.files);
                                    const currentCount = (formData.images || []).length + uploadingImages;
                                    const allowed = Math.min(files.length, 2 - currentCount);
                                    if (allowed <= 0) { toast.error("Maximum 2 screenshots per trade."); return; }
                                    for (let i = 0; i < allowed; i++) {
                                        const file = files[i];
                                        if (file.size > 1 * 1024 * 1024) { toast.error(`"${file.name}" exceeds 1MB limit.`); continue; }
                                        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error(`"${file.name}" is not a supported image type.`); continue; }
                                        setUploadingImages((prev) => prev + 1);
                                        try {
                                            const fd = new FormData();
                                            fd.append('file', file);
                                            fd.append('purpose', 'journal');
                                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                            const data = await res.json();
                                            if (!res.ok) { toast.error(data.error || 'Upload failed'); continue; }
                                            setFormData((prev) => ({ ...prev, images: [...(prev.images || []), data.url] }));
                                        } catch { toast.error('Upload failed. Please try again.'); }
                                        finally { setUploadingImages((prev) => Math.max(0, prev - 1)); }
                                    }
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        e.target.value = ''; // Reset so same file can be re-selected
                                        const currentCount = (formData.images || []).length + uploadingImages;
                                        if (currentCount >= 2) { toast.error("Maximum 2 screenshots per trade."); return; }
                                        if (file.size > 1 * 1024 * 1024) { toast.error(`File exceeds 1MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`); return; }
                                        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPG, PNG, and WebP images are accepted.'); return; }
                                        setUploadingImages((prev) => prev + 1);
                                        try {
                                            const fd = new FormData();
                                            fd.append('file', file);
                                            fd.append('purpose', 'journal');
                                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                            const data = await res.json();
                                            if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
                                            setFormData((prev) => ({ ...prev, images: [...(prev.images || []), data.url] }));
                                        } catch { toast.error('Upload failed. Please try again.'); }
                                        finally { setUploadingImages((prev) => Math.max(0, prev - 1)); }
                                    }}
                                />
                                <ImagePlus size={22} className="text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors" />
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
                                    Drop image or click to upload
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    JPG, PNG, WebP · Max 1MB
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-dashboard">
                    {onCancel ? (
                        <Button
                            type="button"
                            onClick={onCancel}
                            variant="outline"
                            size="smd"
                            className="font-bold text-xs sm:text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Link
                            href="/dashboard/journal"
                            className={buttonVariants({
                                variant: "outline",
                                size: "smd",
                                className: "font-bold text-xs sm:text-sm transition-colors",
                            })}
                        >
                            Cancel
                        </Link>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        size="smd"
                        disabled={isSubmitting}
                        className="font-bold text-xs sm:text-sm"
                    >
                        {isSubmitting ? (
                            <Loader2
                                size={15}
                                className="animate-spin mr-1.5"
                            />
                        ) : (
                            <Save size={15} className="mr-1.5" />
                        )}
                        Save Trade
                    </Button>
                </div>
            </form>
        </div>
    );
}
