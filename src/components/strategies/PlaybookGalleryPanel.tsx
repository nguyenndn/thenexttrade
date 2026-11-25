"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { createStrategy } from "@/actions/strategies";
import {
    PLAYBOOK_PRESETS,
    type PlaybookPreset,
    type PlaybookStyle,
} from "@/lib/strategies/playbook-presets";
import { PlaybookSchematicSvg } from "./PlaybookSchematicSvg";
import { PlaybookTemplatePreviewModal } from "./PlaybookTemplatePreviewModal";

interface PlaybookGalleryPanelProps {
    existingStrategyNames: string[];
    onCloned: () => void;
}

type StyleFilter = "ALL" | PlaybookStyle;

export function PlaybookGalleryPanel({
    existingStrategyNames,
    onCloned,
}: PlaybookGalleryPanelProps) {
    const [styleFilter, setStyleFilter] = useState<StyleFilter>("ALL");
    const [query, setQuery] = useState("");
    const [previewPreset, setPreviewPreset] = useState<PlaybookPreset | null>(null);
    const [cloningId, setCloningId] = useState<string | null>(null);

    const existingSet = useMemo(
        () => new Set(existingStrategyNames.map((n) => n.trim().toLowerCase())),
        [existingStrategyNames]
    );

    const filteredPresets = useMemo(() => {
        const q = query.trim().toLowerCase();
        return PLAYBOOK_PRESETS.filter((preset) => {
            if (styleFilter !== "ALL" && preset.style !== styleFilter) {
                return false;
            }
            if (!q) return true;
            return (
                preset.name.toLowerCase().includes(q) ||
                preset.formula.toLowerCase().includes(q) ||
                preset.pairs.some((p) => p.toLowerCase().includes(q)) ||
                preset.setupType.toLowerCase().includes(q)
            );
        });
    }, [styleFilter, query]);

    const handleClone = async (preset: PlaybookPreset) => {
        setCloningId(preset.id);
        try {
            const baseName = preset.name;
            const targetName = existingSet.has(baseName.toLowerCase())
                ? `${baseName} (Copy)`
                : baseName;

            const res = await createStrategy({
                name: targetName,
                description: preset.description,
                rules: null,
                ruleItems: preset.ruleItems.map((r) => ({ ...r, isActive: true })),
                color: preset.color,
                isPlaybook: true,
                setupType: preset.setupType,
                timeframes: preset.timeframes,
                pairs: preset.pairs,
                idealEntry: preset.idealEntry,
                idealStopLoss: preset.idealStopLoss,
                idealTakeProfit: preset.idealTakeProfit,
                riskRewardMin: preset.riskRewardMin,
                referenceImages: [],
            });

            if (res.error) throw new Error(res.error);

            toast.success(`Cloned "${targetName}" with ${preset.ruleItems.length} rules!`);
            setPreviewPreset(null);
            onCloned();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to clone strategy"
            );
        } finally {
            setCloningId(null);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#1E2028] border border-dashboard rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="w-full sm:max-w-xs">
                    <PremiumInput
                        icon={Search}
                        aria-label="Filter strategy templates by setup or pair"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="py-2 text-xs sm:text-sm"
                    />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-dashboard overflow-x-auto scrollbar-hide">
                    {(["ALL", "Scalp", "Intraday", "Swing"] as const).map((style) => (
                        <Button
                            key={style}
                            type="button"
                            size="sm"
                            variant={styleFilter === style ? "gold" : "ghost"}
                            onClick={() => setStyleFilter(style)}
                            className="h-auto px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                        >
                            {style === "ALL" ? `All (${PLAYBOOK_PRESETS.length})` : style}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Illustrated Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {filteredPresets.map((preset) => {
                    const isCloned = existingSet.has(preset.name.toLowerCase());
                    const isCloning = cloningId === preset.id;

                    return (
                        <div
                            key={preset.id}
                            className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] p-3.5 flex flex-col justify-between gap-3 shadow-sm hover:border-amber-500/40 transition-all min-w-0"
                        >
                            <div className="space-y-3">
                                <PlaybookSchematicSvg
                                    type={preset.schematicType}
                                    accentColor={preset.color}
                                />

                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-gold">
                                            {preset.style}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                            {preset.setupType}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono tabular-nums font-bold text-emerald-500">
                                        Min 1:{preset.riskRewardMin.toFixed(1)} R:R ·{" "}
                                        {preset.ruleItems.length} Rules
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-snug">
                                        {preset.name}
                                    </h3>
                                    <p className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400 mt-1 line-clamp-1">
                                        {preset.formula}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                                        {preset.description}
                                    </p>
                                </div>

                                <div className="p-2.5 rounded-lg bg-red-500/[0.04] dark:bg-red-500/[0.06] border border-red-500/15 flex items-start gap-2">
                                    <AlertTriangle
                                        size={13}
                                        className="text-red-500 shrink-0 mt-0.5"
                                    />
                                    <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-snug">
                                        <span className="font-bold text-red-600 dark:text-red-400">
                                            Trap:{" "}
                                        </span>
                                        {preset.commonTrap}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreviewPreset(preset)}
                                    className="flex-1 px-2 gap-1 text-[11px] font-bold min-w-0"
                                >
                                    <Eye size={12} className="shrink-0" />
                                    <span className="truncate">Rules</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant={isCloned ? "outline" : "gold"}
                                    size="sm"
                                    disabled={isCloning}
                                    onClick={() => handleClone(preset)}
                                    className="flex-1 px-2 gap-1 text-[11px] font-bold min-w-0"
                                >
                                    {isCloned ? (
                                        <>
                                            <Check
                                                size={13}
                                                className="text-emerald-500"
                                            />
                                            <span>Added</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={13} />
                                            <span>
                                                {isCloning ? "Cloning..." : "Clone"}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <PlaybookTemplatePreviewModal
                preset={previewPreset}
                isAlreadyCloned={
                    previewPreset
                        ? existingSet.has(previewPreset.name.toLowerCase())
                        : false
                }
                isCloning={
                    previewPreset ? cloningId === previewPreset.id : false
                }
                onClose={() => setPreviewPreset(null)}
                onClone={handleClone}
            />
        </div>
    );
}
