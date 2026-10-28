"use client";

import React from "react";
import { GripHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
    id: string;
    isEditable?: boolean;
    currentWidth?: number;
    currentHeight?: number;
    minWidth?: number;
    onWidthChange?: (id: string, newWidth: number) => void;
    onRemove?: (id: string) => void;
    children: React.ReactNode;
}

const WIDTH_PRESETS = [
    { label: "1/4", value: 60 },
    { label: "1/3", value: 80 },
    { label: "1/2", value: 120 },
    { label: "2/3", value: 160 },
    { label: "Full", value: 240 },
] as const;

function getWidthFractionLabel(w?: number): string {
    if (!w) return "";
    const cols = Math.round(w / 20);
    if (cols === 12) return "Full";
    if (cols === 9) return "3/4";
    if (cols === 8) return "2/3";
    if (cols === 6) return "1/2";
    if (cols === 4) return "1/3";
    if (cols === 3) return "1/4";
    if (cols === 2) return "1/6";
    return `${cols}/12`;
}

export function WidgetWrapper({
    id,
    isEditable = false,
    currentWidth,
    minWidth = 40,
    onWidthChange,
    onRemove,
    children,
}: WidgetWrapperProps) {
    const snappedWidth = currentWidth
        ? Math.round(currentWidth / 20) * 20
        : undefined;
    const widthBadge = getWidthFractionLabel(snappedWidth);
    const isStandardPresetWidth = WIDTH_PRESETS.some(
        (p) => p.value === snappedWidth
    );
    const isWideEnoughForLabel = !snappedWidth || snappedWidth >= 120;

    return (
        <div
            className={cn(
                "w-full h-full relative group rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col",
                isEditable
                    ? "ring-1 ring-amber-500/35 border-amber-500/60 dark:border-amber-400/50 shadow-md shadow-amber-500/5 hover:ring-amber-500/60"
                    : "transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-gray-300 dark:hover:border-white/15"
            )}
        >
            {/* Edit Mode Header Bar */}
            {isEditable && (
                <div className="widget-drag-handle handle absolute top-0 left-0 right-0 h-8 bg-amber-500/[0.07] dark:bg-amber-500/[0.06] border-b border-amber-500/25 dark:border-amber-400/20 flex items-center justify-between px-2.5 z-20 select-none">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                        <GripHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {isWideEnoughForLabel && (
                            <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                Drag
                            </span>
                        )}
                        {widthBadge && (
                            <span
                                className={cn(
                                    "text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md shrink-0",
                                    isStandardPresetWidth && "sm:hidden"
                                )}
                            >
                                {widthBadge}
                            </span>
                        )}
                    </div>

                    <div
                        className="no-drag flex items-center gap-1 shrink-0"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        {onWidthChange && (
                            <div className="hidden sm:flex items-center gap-0.5 bg-white/80 dark:bg-black/25 border border-amber-500/20 rounded-md p-0.5">
                                {WIDTH_PRESETS.map((preset) => {
                                    const isDisabled = preset.value < minWidth;
                                    const isActive =
                                        snappedWidth === preset.value;
                                    return (
                                        <Button
                                            key={preset.value}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDisabled}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onWidthChange(id, preset.value);
                                            }}
                                            className={cn(
                                                "h-5 px-1.5 text-[10px] font-bold rounded transition-colors min-w-0",
                                                isActive
                                                    ? "bg-amber-500 text-white hover:bg-amber-600"
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400",
                                                isDisabled &&
                                                    "opacity-30 cursor-not-allowed"
                                            )}
                                            aria-label={`Set width to ${preset.label}`}
                                            title={`Resize width to ${preset.label}`}
                                        >
                                            {preset.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        )}

                        <Button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove?.(id);
                            }}
                            variant="ghost"
                            size="icon"
                            className="no-drag h-6 w-6 p-0 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"
                            aria-label="Remove widget"
                            title="Remove widget"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            <div
                className={cn(
                    "widget-content-body flex-1 overflow-hidden flex flex-col",
                    isEditable && "pt-8 pointer-events-none select-none opacity-90"
                )}
            >
                {children}
            </div>
        </div>
    );
}

