"use client";

import React from "react";
import { LayoutGrid, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import {
    GridPresetId,
    PresetDefinition,
    PRESET_DEFINITIONS,
    buildPresetLayout,
} from "./grid-presets";

export type { GridPresetId, PresetDefinition };
export { PRESET_DEFINITIONS, buildPresetLayout };

export interface GridPresetsMenuProps {
    hasBackup: boolean;
    onRestoreFreeStyle: () => void;
    onApplyPreset: (presetId: GridPresetId) => void;
    onOpenCustomGrid: () => void;
}

export function GridPresetsMenu({
    hasBackup,
    onRestoreFreeStyle,
    onApplyPreset,
    onOpenCustomGrid,
}: GridPresetsMenuProps) {
    const bentoPresets = PRESET_DEFINITIONS.filter(
        (p) => p.category === "bento"
    );
    const symmetricPresets = PRESET_DEFINITIONS.filter(
        (p) => p.category === "symmetric"
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-1.5 px-2.5 h-7 min-w-[120px] text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mx-1 outline-none whitespace-nowrap shrink-0"
                    title="Grid Presets"
                >
                    <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                    Grid Presets
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[340px] sm:w-[380px] p-2.5 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] shadow-xl"
            >
                {/* Top Quick Action Bar */}
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <DropdownMenuItem
                        onClick={onRestoreFreeStyle}
                        disabled={!hasBackup}
                        className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-gray-50 dark:bg-white/[0.03] hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-gray-200/70 dark:border-white/10 disabled:opacity-40"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Restore Free Style</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onOpenCustomGrid}
                        className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-gray-50 dark:bg-white/[0.03] hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-gray-200/70 dark:border-white/10"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Custom N × M...</span>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1.5" />

                {/* Bento & Asymmetric Presets */}
                <div className="px-1 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pro Bento & Asymmetric Layouts
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {bentoPresets.map((preset) => (
                        <DropdownMenuItem
                            key={preset.id}
                            onClick={() => onApplyPreset(preset.id)}
                            className="flex items-center gap-2.5 cursor-pointer rounded-lg p-2 text-left text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 dark:hover:bg-white/5 border border-transparent hover:border-amber-500/30 transition-all"
                        >
                            <div className="shrink-0">{preset.preview}</div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                                    {preset.title}
                                </div>
                                <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                    {preset.badge}
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>

                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1.5" />

                {/* Symmetric Grids */}
                <div className="px-1 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Uniform Column Grids
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    {symmetricPresets.map((preset) => (
                        <DropdownMenuItem
                            key={preset.id}
                            onClick={() => onApplyPreset(preset.id)}
                            className="flex items-center gap-2.5 cursor-pointer rounded-lg p-2 text-left text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 dark:hover:bg-white/5 border border-transparent hover:border-amber-500/30 transition-all"
                        >
                            <div className="shrink-0">{preset.preview}</div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                                    {preset.title}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                                    {preset.badge}
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
