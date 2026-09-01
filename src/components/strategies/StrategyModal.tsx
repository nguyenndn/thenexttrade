"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    X,
    ImagePlus,
    Loader2,
    BookOpen,
    Trash2,
    Sparkles,
    ChevronDown,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createStrategy, updateStrategy } from "@/actions/strategies";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import { PLAYBOOK_PRESETS, PlaybookPreset } from "@/lib/strategies/playbook-presets";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Strategy {
    id: string;
    name: string;
    description: string | null;
    rules: string | null;
    color: string;
    isPlaybook: boolean;
    setupType: string | null;
    timeframes: string[];
    pairs: string[];
    idealEntry: string | null;
    idealStopLoss: string | null;
    idealTakeProfit: string | null;
    riskRewardMin: number | null;
    referenceImages: string[];
}

interface StrategyModalProps {
    strategy?: Strategy | null;
    onClose: () => void;
    onSave: () => void;
    defaultPlaybook?: boolean;
}

const COLORS = [
    "#00C785", "#10B981", "#3B82F6", "#0EA5E9", "#6366F1",
    "#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F43F5E",
    "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
    "#14B8A6", "#06B6D4", "#64748B", "#475569", "#1E293B",
];

const SETUP_TYPES = [
    "Reversal", "Breakout", "Continuation", "Scalp", "Swing", "Range", "News", "Other",
];

const COMMON_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];
const COMMON_PAIRS = [
    "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "NZDUSD",
    "USDCAD", "USDCHF", "GBPJPY", "EURJPY", "NAS100", "US30", "SPX500", "BTCUSD"
];

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function StrategyModal({
    strategy,
    onClose,
    onSave,
    defaultPlaybook = false,
}: StrategyModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: strategy?.name || "",
        description: strategy?.description || "",
        rules: strategy?.rules || "",
        color: strategy?.color || COLORS[0],
        isPlaybook: strategy?.isPlaybook ?? defaultPlaybook,
        setupType: strategy?.setupType || "",
        timeframes: strategy?.timeframes || [],
        pairs: strategy?.pairs || [],
        idealEntry: strategy?.idealEntry || "",
        idealStopLoss: strategy?.idealStopLoss || "",
        idealTakeProfit: strategy?.idealTakeProfit || "",
        riskRewardMin: strategy?.riskRewardMin ?? null,
        referenceImages: strategy?.referenceImages || [],
    });

    const [tfInput, setTfInput] = useState("");
    const [pairInput, setPairInput] = useState("");
    const [showTfSuggestions, setShowTfSuggestions] = useState(false);
    const [showPairSuggestions, setShowPairSuggestions] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const handleApplyPreset = (preset: PlaybookPreset) => {
        setFormData({
            name: preset.name,
            description: preset.description,
            rules: preset.rules,
            color: preset.color,
            isPlaybook: true,
            setupType: preset.setupType,
            timeframes: preset.timeframes,
            pairs: preset.pairs,
            idealEntry: preset.idealEntry,
            idealStopLoss: preset.idealStopLoss,
            idealTakeProfit: preset.idealTakeProfit,
            riskRewardMin: preset.riskRewardMin,
            referenceImages: formData.referenceImages.length > 0 ? formData.referenceImages : preset.referenceImages,
        });
        toast.success(`Loaded "${preset.name}" template!`);
    };

    const addTimeframe = (tf: string) => {
        const value = tf.toUpperCase().trim();
        if (value && !formData.timeframes.includes(value)) {
            setFormData((prev) => ({ ...prev, timeframes: [...prev.timeframes, value] }));
        }
        setTfInput("");
        setShowTfSuggestions(false);
    };

    const removeTimeframe = (tf: string) => {
        setFormData((prev) => ({
            ...prev,
            timeframes: prev.timeframes.filter((t) => t !== tf),
        }));
    };

    const addPair = (pair: string) => {
        const value = pair.toUpperCase().trim();
        if (value && !formData.pairs.includes(value)) {
            setFormData((prev) => ({ ...prev, pairs: [...prev.pairs, value] }));
        }
        setPairInput("");
        setShowPairSuggestions(false);
    };

    const removePair = (pair: string) => {
        setFormData((prev) => ({
            ...prev,
            pairs: prev.pairs.filter((p) => p !== pair),
        }));
    };

    const handleImageUpload = async (file: File) => {
        if (formData.referenceImages.length >= 3) {
            toast.error("Maximum 3 reference images allowed.");
            return;
        }
        if (file.size > 1 * 1024 * 1024) {
            toast.error("Image must be under 1MB.");
            return;
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.error("Only JPG, PNG, and WebP images are accepted.");
            return;
        }

        setUploadingImage(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("purpose", "journal");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: fd,
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Upload failed");
                return;
            }

            setFormData((prev) => ({
                ...prev,
                referenceImages: [...prev.referenceImages, data.url],
            }));
            toast.success("Reference chart uploaded!");
        } catch {
            toast.error("Upload failed. Please try again.");
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (idx: number) => {
        setFormData((prev) => ({
            ...prev,
            referenceImages: prev.referenceImages.filter((_, i) => i !== idx),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                rules: formData.rules.trim() || null,
                color: formData.color,
                isPlaybook: formData.isPlaybook,
                setupType: formData.isPlaybook && formData.setupType ? formData.setupType : null,
                timeframes: formData.isPlaybook ? formData.timeframes : [],
                pairs: formData.isPlaybook ? formData.pairs : [],
                idealEntry: formData.isPlaybook && formData.idealEntry ? formData.idealEntry.trim() : null,
                idealStopLoss: formData.isPlaybook && formData.idealStopLoss ? formData.idealStopLoss.trim() : null,
                idealTakeProfit: formData.isPlaybook && formData.idealTakeProfit ? formData.idealTakeProfit.trim() : null,
                riskRewardMin: formData.isPlaybook && formData.riskRewardMin != null ? formData.riskRewardMin : null,
                referenceImages: formData.isPlaybook ? formData.referenceImages : [],
            };

            const result = !strategy || strategy.id.startsWith("temp-")
                ? await createStrategy(payload)
                : await updateStrategy(strategy.id, payload);

            if (result.error) throw new Error(result.error);

            toast.success(
                strategy && !strategy.id.startsWith("temp-")
                    ? formData.isPlaybook ? "Playbook updated" : "Strategy updated"
                    : formData.isPlaybook ? "Playbook created" : "Strategy created"
            );
            onSave();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTfSuggestions = COMMON_TIMEFRAMES.filter(
        (tf) => !formData.timeframes.includes(tf) && tf.includes(tfInput.toUpperCase())
    );
    const filteredPairSuggestions = COMMON_PAIRS.filter(
        (p) => !formData.pairs.includes(p) && p.includes(pairInput.toUpperCase())
    );

    const inputClasses =
        "w-full rounded-xl border border-dashboard bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600 text-gray-700 dark:text-white";
    const labelClasses = "text-sm font-bold text-gray-700 dark:text-gray-300";

    return (
        <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Box */}
            <motion.div
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={SPRING_SOFT}
                className={`relative z-10 bg-white dark:bg-[#1E2028] w-full max-h-[90vh] flex flex-col rounded-xl shadow-2xl border border-dashboard ${
                    formData.isPlaybook ? "max-w-2xl" : "max-w-lg"
                } transition-all duration-300 overflow-hidden`}
            >
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-dashboard shrink-0 bg-white dark:bg-[#1E2028]">
                    <div className="flex items-center gap-3">
                        {formData.isPlaybook && (
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <BookOpen size={18} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-white">
                                {strategy
                                    ? formData.isPlaybook ? "Edit Playbook" : "Edit Strategy"
                                    : formData.isPlaybook ? "New Playbook" : "New Strategy"}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {formData.isPlaybook
                                    ? "Define your A+ setup rules and reference charts"
                                    : "Create a strategy tag to group your trades"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Preset Templates Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="hidden sm:flex items-center gap-1.5 text-xs text-primary border-primary/20 hover:bg-primary/10"
                                >
                                    <Sparkles size={14} />
                                    <span>Templates</span>
                                    <ChevronDown size={12} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-gray-400">
                                    Load Preset Setup
                                </div>
                                {PLAYBOOK_PRESETS.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.id}
                                        onClick={() => handleApplyPreset(preset)}
                                        className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                                    >
                                        <span className="font-bold text-xs text-gray-700 dark:text-white flex items-center gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: preset.color }}
                                            />
                                            {preset.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 line-clamp-1">
                                            {preset.setupType} · {preset.pairs.join(", ")}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full border-dashboard h-9 w-9"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                {/* Scrollable Form Content */}
                <form
                    id="strategy-modal-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6"
                >
                    {/* Basic Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className={labelClasses}>
                                Strategy / Setup Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                placeholder="e.g. London Liquidity Sweep"
                                className={inputClasses}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Color Tag</label>
                            <div className="flex gap-2.5 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                                            formData.color === c
                                                ? "scale-110 ring-2 ring-offset-2 ring-primary"
                                                : "hover:scale-105 opacity-80 hover:opacity-100"
                                        }`}
                                        style={{ backgroundColor: c }}
                                        aria-label={`Select color ${c}`}
                                    >
                                        {formData.color === c && (
                                            <Check size={14} className="text-white drop-shadow" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className={labelClasses}>
                                Description <span className="font-normal text-gray-500 text-xs">(Optional)</span>
                            </label>
                            <textarea
                                id="description"
                                rows={2}
                                placeholder="Brief summary of when and how to trade this strategy..."
                                className={`${inputClasses} resize-none`}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="rules" className={labelClasses}>
                                Rules & Checklist <span className="font-normal text-gray-500 text-xs">(1 rule per line)</span>
                            </label>
                            <textarea
                                id="rules"
                                rows={3}
                                placeholder={"- HTF Trend Aligned\n- Asian Range Swept\n- M15 MSS Confirmation"}
                                className={`${inputClasses} font-mono text-xs`}
                                value={formData.rules}
                                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Playbook Section Toggle */}
                    <div className="border border-primary/20 rounded-xl bg-primary/[0.02] dark:bg-primary/[0.04] overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-primary/10">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData((p) => ({ ...p, isPlaybook: !p.isPlaybook }))}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        formData.isPlaybook ? "bg-primary" : "bg-gray-200 dark:bg-white/20"
                                    }`}
                                    role="switch"
                                    aria-checked={formData.isPlaybook}
                                    aria-label="Toggle Playbook details"
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            formData.isPlaybook ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-1.5">
                                        <BookOpen size={14} className="text-primary" />
                                        Enable Playbook Details
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Add setup template with reference charts, timeframes, and entry rules
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Playbook Fields */}
                        <AnimatePresence initial={false}>
                            {formData.isPlaybook && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 space-y-4 border-t border-primary/10">
                                        {/* Setup Type */}
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Setup Type</label>
                                            <select
                                                className={inputClasses}
                                                value={formData.setupType}
                                                onChange={(e) => setFormData({ ...formData, setupType: e.target.value })}
                                            >
                                                <option value="">Select type...</option>
                                                {SETUP_TYPES.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Timeframes */}
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Recommended Timeframes</label>
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {formData.timeframes.map((tf) => (
                                                    <span
                                                        key={tf}
                                                        className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5 border border-primary/20"
                                                    >
                                                        {tf}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTimeframe(tf)}
                                                            className="hover:text-red-500 transition-colors"
                                                            aria-label={`Remove timeframe ${tf}`}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Type or select timeframe (e.g. M15, H4)..."
                                                    className={inputClasses}
                                                    value={tfInput}
                                                    onFocus={() => setShowTfSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowTfSuggestions(false), 200)}
                                                    onChange={(e) => setTfInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (tfInput) addTimeframe(tfInput);
                                                        }
                                                    }}
                                                />
                                                {showTfSuggestions && filteredTfSuggestions.length > 0 && (
                                                    <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-[#1E2028] border border-dashboard rounded-xl shadow-xl z-20 max-h-36 overflow-y-auto p-1">
                                                        {filteredTfSuggestions.map((tf) => (
                                                            <button
                                                                type="button"
                                                                key={tf}
                                                                onMouseDown={() => addTimeframe(tf)}
                                                                className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                                            >
                                                                {tf}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pairs / Symbols */}
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Applicable Pairs / Symbols</label>
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {formData.pairs.map((pair) => (
                                                    <span
                                                        key={pair}
                                                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-amber-500/20"
                                                    >
                                                        {pair}
                                                        <button
                                                            type="button"
                                                            onClick={() => removePair(pair)}
                                                            className="hover:text-red-500 transition-colors"
                                                            aria-label={`Remove pair ${pair}`}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Type or select symbol (e.g. XAUUSD, NAS100)..."
                                                    className={inputClasses}
                                                    value={pairInput}
                                                    onFocus={() => setShowPairSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowPairSuggestions(false), 200)}
                                                    onChange={(e) => setPairInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (pairInput) addPair(pairInput);
                                                        }
                                                    }}
                                                />
                                                {showPairSuggestions && filteredPairSuggestions.length > 0 && (
                                                    <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-[#1E2028] border border-dashboard rounded-xl shadow-xl z-20 max-h-36 overflow-y-auto p-1">
                                                        {filteredPairSuggestions.map((p) => (
                                                            <button
                                                                type="button"
                                                                key={p}
                                                                onMouseDown={() => addPair(p)}
                                                                className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-500/10 hover:text-amber-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ideal Entry / SL / TP */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    Ideal Entry
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="50% of OB zone"
                                                    className={inputClasses}
                                                    value={formData.idealEntry}
                                                    onChange={(e) => setFormData({ ...formData, idealEntry: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    Ideal SL
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Below OB wick"
                                                    className={inputClasses}
                                                    value={formData.idealStopLoss}
                                                    onChange={(e) => setFormData({ ...formData, idealStopLoss: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    Ideal TP
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Previous high"
                                                    className={inputClasses}
                                                    value={formData.idealTakeProfit}
                                                    onChange={(e) => setFormData({ ...formData, idealTakeProfit: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Min R:R */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Minimum Risk : Reward
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    placeholder="2.0"
                                                    className={`${inputClasses} max-w-[140px]`}
                                                    value={formData.riskRewardMin ?? ""}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            riskRewardMin: e.target.value ? parseFloat(e.target.value) : null,
                                                        })
                                                    }
                                                />
                                                <span className="text-xs font-bold text-gray-400">: 1</span>
                                            </div>
                                        </div>

                                        {/* Reference Images */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className={labelClasses}>
                                                    Reference Charts ({formData.referenceImages.length}/3)
                                                </label>
                                                <span className="text-[11px] text-gray-500">Max 1MB per image</span>
                                            </div>

                                            {/* Hidden File Input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(file);
                                                    e.target.value = "";
                                                }}
                                            />

                                            <div className="grid grid-cols-3 gap-3">
                                                {formData.referenceImages.map((url, idx) => (
                                                    <div
                                                        key={url}
                                                        className="relative aspect-video rounded-xl overflow-hidden border border-dashboard group bg-black/20"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Reference ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                                            aria-label={`Remove image ${idx + 1}`}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}

                                                {uploadingImage && (
                                                    <div className="aspect-video rounded-xl border-2 border-dashed border-dashboard flex items-center justify-center bg-gray-50/50 dark:bg-white/[0.02]">
                                                        <Loader2 size={24} className="animate-spin text-primary" />
                                                    </div>
                                                )}

                                                {formData.referenceImages.length < 3 && !uploadingImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="aspect-video rounded-xl border-2 border-dashed border-dashboard hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer group transition-colors bg-gray-50/50 dark:bg-white/[0.02]"
                                                    >
                                                        <ImagePlus
                                                            size={22}
                                                            className="text-gray-400 group-hover:text-primary transition-colors"
                                                        />
                                                        <span className="text-xs text-gray-400 group-hover:text-primary mt-1 font-medium transition-colors">
                                                            Upload
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </form>

                {/* Fixed Footer at Bottom */}
                <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-dashboard shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                    <Button
                        type="button"
                        variant="outline"
                        size="smd"
                        onClick={onClose}
                        className="font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="strategy-modal-form"
                        variant="primary"
                        size="smd"
                        isLoading={isLoading}
                        className="font-bold shadow-md shadow-primary/20"
                    >
                        {formData.isPlaybook ? "Save Playbook" : "Save Strategy"}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
