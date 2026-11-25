"use client";

import { AlertTriangle, Check, Copy, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import { PlaybookSchematicSvg } from "./PlaybookSchematicSvg";
import type { PlaybookPreset } from "@/lib/strategies/playbook-presets";

interface PlaybookTemplatePreviewModalProps {
    preset: PlaybookPreset | null;
    isAlreadyCloned: boolean;
    isCloning: boolean;
    onClose: () => void;
    onClone: (preset: PlaybookPreset) => void;
}

export function PlaybookTemplatePreviewModal({
    preset,
    isAlreadyCloned,
    isCloning,
    onClose,
    onClone,
}: PlaybookTemplatePreviewModalProps) {
    if (!preset) return null;

    return (
        <Dialog open={Boolean(preset)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                hideCloseButton
                className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#0D111C] border border-dashboard rounded-2xl p-5 sm:p-6"
            >
                <DialogHeader className="space-y-1 text-left">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: preset.color }}
                            />
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-gold">
                                {preset.style}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                {preset.setupType} · {preset.market}
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            aria-label="Close strategy preview"
                            className="h-8 w-8 rounded-lg shrink-0"
                        >
                            <X size={15} />
                        </Button>
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white pt-1">
                        {preset.name}
                    </DialogTitle>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {preset.description}
                    </p>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <PlaybookSchematicSvg
                        type={preset.schematicType}
                        accentColor={preset.color}
                    />

                    {/* Execution Formula Banner */}
                    <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-gold">
                            Execution Sequence
                        </p>
                        <p className="text-xs font-bold font-mono text-gray-800 dark:text-gray-100 mt-0.5">
                            {preset.formula}
                        </p>
                    </div>

                    {/* Common Retail Trap Callout */}
                    <div className="p-3 rounded-xl bg-red-500/[0.05] border border-red-500/20 flex items-start gap-2.5">
                        <AlertTriangle
                            size={15}
                            className="text-red-500 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                                Common Trader Trap to Avoid
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
                                {preset.commonTrap}
                            </p>
                        </div>
                    </div>

                    {/* 2x2 Matrix Specs Card */}
                    <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/10 rounded-xl border border-dashboard bg-gray-50/70 dark:bg-[#151925] overflow-hidden">
                        <div className="p-3">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                                Timeframes
                            </p>
                            <p className="text-xs font-black font-mono text-gray-800 dark:text-white mt-0.5">
                                {preset.timeframes.join(" · ")}
                            </p>
                        </div>
                        <div className="p-3">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                                Target Pairs
                            </p>
                            <p className="text-xs font-black font-mono text-gray-800 dark:text-white mt-0.5 truncate">
                                {preset.pairs.join(", ")}
                            </p>
                        </div>
                        <div className="p-3">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                                Minimum R:R
                            </p>
                            <p className="text-xs font-black font-mono text-emerald-500 mt-0.5">
                                1 : {preset.riskRewardMin.toFixed(1)}
                            </p>
                        </div>
                        <div className="p-3">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                                Hard Invalidation SL
                            </p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-0.5 line-clamp-1">
                                {preset.idealStopLoss}
                            </p>
                        </div>
                    </div>

                    {/* Built-in Auditable Rule Checklist */}
                    <div className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                <ShieldAlert size={14} className="text-gold" />
                                Auditable Rule Checklist ({preset.ruleItems.length} Rules)
                            </h4>
                            <span className="text-[10px] font-semibold text-gray-400">
                                Cloned directly into Journal grading
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {preset.ruleItems.map((rule, idx) => (
                                <div
                                    key={idx}
                                    className="py-2 flex items-start justify-between gap-3"
                                >
                                    <div className="flex items-start gap-2 min-w-0">
                                        <span className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-gold mt-0.5">
                                            0{idx + 1}
                                        </span>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-snug">
                                            {rule.title}
                                        </p>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 shrink-0">
                                        {rule.category}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 pt-3 border-t border-dashboard flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        type="button"
                        variant={isAlreadyCloned ? "outline" : "gold"}
                        disabled={isCloning}
                        onClick={() => onClone(preset)}
                        className="gap-1.5 font-bold"
                    >
                        {isAlreadyCloned ? (
                            <>
                                <Check size={15} className="text-emerald-500" />
                                <span>Added — Clone Copy</span>
                            </>
                        ) : (
                            <>
                                <Copy size={15} />
                                <span>
                                    {isCloning
                                        ? "Cloning Strategy..."
                                        : "Clone to My Strategies"}
                                </span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
