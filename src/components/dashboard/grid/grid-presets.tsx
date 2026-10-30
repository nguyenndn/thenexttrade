import React from "react";
import { LayoutItem } from "./WidgetGrid";
import { WIDGET_REGISTRY, WidgetType } from "./WidgetRegistry";
import { cn } from "@/lib/utils";

export type GridPresetId =
    | "command-center"
    | "executive-bento"
    | "analytics-wall"
    | "hero-split"
    | "focus-left"
    | "focus-right"
    | "triple-stage"
    | "pro-terminal"
    | "split-2col"
    | "grid-3col"
    | "grid-4col"
    | "single-col";

export interface PresetDefinition {
    id: GridPresetId;
    title: string;
    badge: string;
    category: "bento" | "symmetric";
    preview: React.ReactNode;
}

function PreviewBlock({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "rounded-[2px] bg-amber-500/30 dark:bg-amber-400/30 border border-amber-500/40 dark:border-amber-400/40",
                className
            )}
        />
    );
}

export const PRESET_DEFINITIONS: PresetDefinition[] = [
    {
        id: "command-center",
        title: "Command Center",
        badge: "1 + 3 + 2",
        category: "bento",
        preview: (
            <div className="w-9 h-6 flex flex-col gap-[2px]">
                <PreviewBlock className="w-full h-2" />
                <div className="grid grid-cols-3 gap-[2px] flex-1">
                    <PreviewBlock />
                    <PreviewBlock />
                    <PreviewBlock />
                </div>
                <div className="grid grid-cols-2 gap-[2px] h-1.5">
                    <PreviewBlock />
                    <PreviewBlock />
                </div>
            </div>
        ),
    },
    {
        id: "executive-bento",
        title: "Executive Bento",
        badge: "2 + 1 + 2",
        category: "bento",
        preview: (
            <div className="w-9 h-6 flex flex-col gap-[2px]">
                <div className="grid grid-cols-2 gap-[2px] h-2">
                    <PreviewBlock />
                    <PreviewBlock />
                </div>
                <PreviewBlock className="w-full flex-1" />
                <div className="grid grid-cols-2 gap-[2px] h-1.5">
                    <PreviewBlock />
                    <PreviewBlock />
                </div>
            </div>
        ),
    },
    {
        id: "analytics-wall",
        title: "Analytics Wall",
        badge: "1 + 2 + 3",
        category: "bento",
        preview: (
            <div className="w-9 h-6 flex flex-col gap-[2px]">
                <PreviewBlock className="w-full h-1.5" />
                <div className="grid grid-cols-2 gap-[2px] h-2">
                    <PreviewBlock />
                    <PreviewBlock />
                </div>
                <div className="grid grid-cols-3 gap-[2px] flex-1">
                    <PreviewBlock />
                    <PreviewBlock />
                    <PreviewBlock />
                </div>
            </div>
        ),
    },
    {
        id: "hero-split",
        title: "Hero + Trio",
        badge: "2/3:1/3 + 3",
        category: "bento",
        preview: (
            <div className="w-9 h-6 flex flex-col gap-[2px]">
                <div className="grid grid-cols-3 gap-[2px] h-2.5">
                    <PreviewBlock className="col-span-2" />
                    <PreviewBlock className="col-span-1" />
                </div>
                <div className="grid grid-cols-3 gap-[2px] flex-1">
                    <PreviewBlock />
                    <PreviewBlock />
                    <PreviewBlock />
                </div>
            </div>
        ),
    },
    {
        id: "triple-stage",
        title: "Center Stage",
        badge: "1/4 · 1/2 · 1/4",
        category: "bento",
        preview: (
            <div className="w-9 h-6 grid grid-cols-4 gap-[2px]">
                <PreviewBlock className="col-span-1 h-full" />
                <PreviewBlock className="col-span-2 h-full" />
                <PreviewBlock className="col-span-1 h-full" />
            </div>
        ),
    },
    {
        id: "focus-left",
        title: "Focus Left",
        badge: "2/3 : 1/3",
        category: "bento",
        preview: (
            <div className="w-9 h-6 grid grid-cols-3 gap-[2px]">
                <PreviewBlock className="col-span-2 h-full" />
                <div className="col-span-1 flex flex-col gap-[2px] h-full">
                    <PreviewBlock className="flex-1" />
                    <PreviewBlock className="flex-1" />
                </div>
            </div>
        ),
    },
    {
        id: "focus-right",
        title: "Focus Right",
        badge: "1/3 : 2/3",
        category: "bento",
        preview: (
            <div className="w-9 h-6 grid grid-cols-3 gap-[2px]">
                <div className="col-span-1 flex flex-col gap-[2px] h-full">
                    <PreviewBlock className="flex-1" />
                    <PreviewBlock className="flex-1" />
                </div>
                <PreviewBlock className="col-span-2 h-full" />
            </div>
        ),
    },
    {
        id: "pro-terminal",
        title: "Pro Terminal",
        badge: "3/4 : 1/4",
        category: "bento",
        preview: (
            <div className="w-9 h-6 grid grid-cols-4 gap-[2px]">
                <PreviewBlock className="col-span-3 h-full" />
                <div className="col-span-1 flex flex-col gap-[2px] h-full">
                    <PreviewBlock className="flex-1" />
                    <PreviewBlock className="flex-1" />
                </div>
            </div>
        ),
    },
    {
        id: "split-2col",
        title: "Split Screen",
        badge: "50 : 50",
        category: "symmetric",
        preview: (
            <div className="w-9 h-6 grid grid-cols-2 gap-[2px]">
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
            </div>
        ),
    },
    {
        id: "grid-3col",
        title: "3 Columns Grid",
        badge: "3 × 1/3",
        category: "symmetric",
        preview: (
            <div className="w-9 h-6 grid grid-cols-3 gap-[2px]">
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
            </div>
        ),
    },
    {
        id: "grid-4col",
        title: "4 Columns Grid",
        badge: "4 × 1/4",
        category: "symmetric",
        preview: (
            <div className="w-9 h-6 grid grid-cols-4 gap-[2px]">
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
            </div>
        ),
    },
    {
        id: "single-col",
        title: "Full Width Stack",
        badge: "100% Col",
        category: "symmetric",
        preview: (
            <div className="w-9 h-6 flex flex-col gap-[2px]">
                <PreviewBlock className="flex-1" />
                <PreviewBlock className="flex-1" />
                <PreviewBlock className="flex-1" />
            </div>
        ),
    },
];

function getItemMinH(item: LayoutItem, fallbackH: number): number {
    const config = WIDGET_REGISTRY[item.type as WidgetType];
    const minH = config?.minH || item.minH || 30;
    return Math.max(fallbackH, Math.ceil(minH / 4) * 4);
}

function appendUniformRows(
    items: LayoutItem[],
    colsPerRow: number,
    baseRowH: number,
    startY = 0
): { items: LayoutItem[]; nextY: number } {
    const result: LayoutItem[] = [];
    let currentY = startY;

    for (let i = 0; i < items.length; i += colsPerRow) {
        const rowItems = items.slice(i, i + colsPerRow);
        const count = rowItems.length;
        const colW = Math.floor(240 / count);
        const rowH = Math.max(
            ...rowItems.map((it) => getItemMinH(it, baseRowH))
        );

        rowItems.forEach((item, colIdx) => {
            const config = WIDGET_REGISTRY[item.type as WidgetType];
            const minW = Math.min(config?.minW || item.minW || 40, colW);
            result.push({
                ...item,
                x: colIdx * colW,
                y: currentY,
                w: colIdx === count - 1 ? 240 - colIdx * colW : colW,
                h: rowH,
                minW,
            });
        });

        currentY += rowH;
    }

    return { items: result, nextY: currentY };
}

export function buildPresetLayout(
    layout: LayoutItem[],
    presetId: GridPresetId
): { grid: LayoutItem[]; label: string } {
    const presetMeta = PRESET_DEFINITIONS.find((p) => p.id === presetId);
    const label = presetMeta?.title || "Grid Preset";

    if (layout.length === 0) {
        return { grid: [], label };
    }

    if (presetId === "command-center") {
        const result: LayoutItem[] = [];
        let currentY = 0;

        const first = layout[0];
        const firstH = getItemMinH(first, 68);
        result.push({ ...first, x: 0, y: currentY, w: 240, h: firstH });
        currentY += firstH;

        const middleSlice = layout.slice(1, 4);
        if (middleSlice.length > 0) {
            const { items: midItems, nextY } = appendUniformRows(
                middleSlice,
                3,
                64,
                currentY
            );
            result.push(...midItems);
            currentY = nextY;
        }

        const rest = layout.slice(4);
        if (rest.length > 0) {
            const { items: restItems } = appendUniformRows(
                rest,
                2,
                68,
                currentY
            );
            result.push(...restItems);
        }

        return { grid: result, label };
    }

    if (presetId === "executive-bento") {
        const result: LayoutItem[] = [];
        let currentY = 0;

        const topSlice = layout.slice(0, 2);
        if (topSlice.length > 0) {
            const { items: topItems, nextY } = appendUniformRows(
                topSlice,
                2,
                68,
                currentY
            );
            result.push(...topItems);
            currentY = nextY;
        }

        if (layout.length > 2) {
            const mid = layout[2];
            const midH = getItemMinH(mid, 68);
            result.push({ ...mid, x: 0, y: currentY, w: 240, h: midH });
            currentY += midH;
        }

        const rest = layout.slice(3);
        if (rest.length > 0) {
            const { items: restItems } = appendUniformRows(
                rest,
                2,
                68,
                currentY
            );
            result.push(...restItems);
        }

        return { grid: result, label };
    }

    if (presetId === "analytics-wall") {
        const result: LayoutItem[] = [];
        let currentY = 0;

        const first = layout[0];
        const firstH = getItemMinH(first, 68);
        result.push({ ...first, x: 0, y: currentY, w: 240, h: firstH });
        currentY += firstH;

        const secondRow = layout.slice(1, 3);
        if (secondRow.length > 0) {
            const { items: secondItems, nextY } = appendUniformRows(
                secondRow,
                2,
                68,
                currentY
            );
            result.push(...secondItems);
            currentY = nextY;
        }

        const rest = layout.slice(3);
        if (rest.length > 0) {
            const { items: restItems } = appendUniformRows(
                rest,
                3,
                64,
                currentY
            );
            result.push(...restItems);
        }

        return { grid: result, label };
    }

    if (presetId === "hero-split") {
        const result: LayoutItem[] = [];
        let currentY = 0;

        if (layout.length === 1) {
            const h = getItemMinH(layout[0], 68);
            result.push({ ...layout[0], x: 0, y: 0, w: 240, h });
            return { grid: result, label };
        }

        const topA = layout[0];
        const topB = layout[1];
        const topH = Math.max(getItemMinH(topA, 68), getItemMinH(topB, 68));
        result.push({ ...topA, x: 0, y: currentY, w: 160, h: topH });
        result.push({ ...topB, x: 160, y: currentY, w: 80, h: topH });
        currentY += topH;

        const rest = layout.slice(2);
        if (rest.length > 0) {
            const { items: restItems } = appendUniformRows(
                rest,
                3,
                64,
                currentY
            );
            result.push(...restItems);
        }

        return { grid: result, label };
    }

    if (
        presetId === "focus-left" ||
        presetId === "focus-right" ||
        presetId === "pro-terminal"
    ) {
        const focusW = presetId === "pro-terminal" ? 180 : 160;
        const sideW = 240 - focusW;
        const isFocusLeft = presetId !== "focus-right";
        const result: LayoutItem[] = [];
        let currentY = 0;

        for (let i = 0; i < layout.length; i += 3) {
            const group = layout.slice(i, i + 3);
            if (group.length === 3) {
                const topSideH = getItemMinH(
                    group[1],
                    presetId === "pro-terminal" ? 60 : 64
                );
                const bottomSideH = getItemMinH(
                    group[2],
                    presetId === "pro-terminal" ? 60 : 64
                );
                const totalFocusH = Math.max(
                    topSideH + bottomSideH,
                    getItemMinH(group[0], topSideH + bottomSideH)
                );
                const adjustedTopH = Math.floor(totalFocusH / 8) * 4;
                const adjustedBottomH = totalFocusH - adjustedTopH;

                const focusX = isFocusLeft ? 0 : sideW;
                const sideX = isFocusLeft ? focusW : 0;

                result.push({
                    ...group[0],
                    x: focusX,
                    y: currentY,
                    w: focusW,
                    h: totalFocusH,
                });
                result.push({
                    ...group[1],
                    x: sideX,
                    y: currentY,
                    w: sideW,
                    h: adjustedTopH,
                    minW: Math.min(group[1].minW || 40, sideW),
                });
                result.push({
                    ...group[2],
                    x: sideX,
                    y: currentY + adjustedTopH,
                    w: sideW,
                    h: adjustedBottomH,
                    minW: Math.min(group[2].minW || 40, sideW),
                });
                currentY += totalFocusH;
            } else if (group.length === 2) {
                const rowH = Math.max(
                    getItemMinH(group[0], 68),
                    getItemMinH(group[1], 68)
                );
                const leftW = isFocusLeft ? focusW : sideW;
                const rightW = 240 - leftW;
                result.push({
                    ...group[0],
                    x: 0,
                    y: currentY,
                    w: leftW,
                    h: rowH,
                    minW: Math.min(group[0].minW || 40, leftW),
                });
                result.push({
                    ...group[1],
                    x: leftW,
                    y: currentY,
                    w: rightW,
                    h: rowH,
                    minW: Math.min(group[1].minW || 40, rightW),
                });
                currentY += rowH;
            } else if (group.length === 1) {
                const rowH = getItemMinH(group[0], 68);
                result.push({
                    ...group[0],
                    x: 0,
                    y: currentY,
                    w: 240,
                    h: rowH,
                });
                currentY += rowH;
            }
        }

        return { grid: result, label };
    }

    if (presetId === "triple-stage") {
        const result: LayoutItem[] = [];
        let currentY = 0;

        for (let i = 0; i < layout.length; i += 3) {
            const rowItems = layout.slice(i, i + 3);
            const rowH = Math.max(...rowItems.map((it) => getItemMinH(it, 68)));

            if (rowItems.length === 3) {
                const ordered = [...rowItems];
                let bestCenterIdx = 1;
                let maxPreferredW = -1;
                ordered.forEach((it, idx) => {
                    const cfg = WIDGET_REGISTRY[it.type as WidgetType];
                    const prefW = (cfg?.defaultW || 120) + (cfg?.minW || 40);
                    if (prefW > maxPreferredW) {
                        maxPreferredW = prefW;
                        bestCenterIdx = idx;
                    }
                });
                if (bestCenterIdx !== 1) {
                    [ordered[1], ordered[bestCenterIdx]] = [
                        ordered[bestCenterIdx],
                        ordered[1],
                    ];
                }

                result.push({
                    ...ordered[0],
                    x: 0,
                    y: currentY,
                    w: 60,
                    h: rowH,
                    minW: Math.min(ordered[0].minW || 40, 60),
                });
                result.push({
                    ...ordered[1],
                    x: 60,
                    y: currentY,
                    w: 120,
                    h: rowH,
                });
                result.push({
                    ...ordered[2],
                    x: 180,
                    y: currentY,
                    w: 60,
                    h: rowH,
                    minW: Math.min(ordered[2].minW || 40, 60),
                });
            } else if (rowItems.length === 2) {
                result.push({
                    ...rowItems[0],
                    x: 0,
                    y: currentY,
                    w: 120,
                    h: rowH,
                });
                result.push({
                    ...rowItems[1],
                    x: 120,
                    y: currentY,
                    w: 120,
                    h: rowH,
                });
            } else if (rowItems.length === 1) {
                result.push({
                    ...rowItems[0],
                    x: 0,
                    y: currentY,
                    w: 240,
                    h: rowH,
                });
            }
            currentY += rowH;
        }
        return { grid: result, label };
    }

    if (presetId === "split-2col") {
        return {
            grid: appendUniformRows(layout, 2, 68).items,
            label,
        };
    }

    if (presetId === "grid-3col") {
        return {
            grid: appendUniformRows(layout, 3, 64).items,
            label,
        };
    }

    if (presetId === "grid-4col") {
        return {
            grid: appendUniformRows(layout, 4, 60).items,
            label,
        };
    }

    // single-col
    return {
        grid: appendUniformRows(layout, 1, 68).items,
        label,
    };
}
