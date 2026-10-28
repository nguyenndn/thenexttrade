"use client";

import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import {
    ResponsiveGridLayout,
    verticalCompactor,
    type Compactor,
    type Layout,
    type LayoutItem as RglLayoutItem,
} from "react-grid-layout";
import { WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ResponsiveGrid = WidthProvider(ResponsiveGridLayout);

// Conversion factors between persisted 240-col / 5px-row coordinates and 12-col / 20px-row magnetic grid
const COL_UNIT = 20; // 240 / 12 = 20 units per column
const ROW_UNIT = 4; // 4 * 5px = 20px per row step

export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    type?: string;
}

interface WidgetGridProps {
    layout: LayoutItem[];
    onLayoutChange: (layout: LayoutItem[]) => void;
    isEditable?: boolean;
    children: React.ReactNode;
}

function toGridLayout(items: LayoutItem[], isEditable: boolean): LayoutItem[] {
    return items.map((item) => {
        const minW = Math.max(
            2,
            Math.min(12, Math.round((item.minW || 40) / COL_UNIT))
        );
        const minH = Math.max(6, Math.round((item.minH || 30) / ROW_UNIT));
        const w = Math.max(minW, Math.min(12, Math.round(item.w / COL_UNIT)));
        const rawX = Math.max(0, Math.round(item.x / COL_UNIT));
        const x = Math.min(12 - w, rawX);
        const h = Math.max(minH, Math.round(item.h / ROW_UNIT));
        const y =
            item.y === Infinity || !Number.isFinite(item.y)
                ? Infinity
                : Math.max(0, Math.round(item.y / ROW_UNIT));

        return {
            ...item,
            x,
            y,
            w,
            h,
            minW,
            minH,
            isDraggable: isEditable,
            isResizable: isEditable,
        };
    });
}

function toMobileStackLayout(items: LayoutItem[]): LayoutItem[] {
    let currentY = 0;
    return items.map((item) => {
        const minH = Math.max(6, Math.round((item.minH || 30) / ROW_UNIT));
        const h = Math.max(minH, Math.round(item.h / ROW_UNIT));
        const y = currentY;
        currentY += h;
        return {
            ...item,
            x: 0,
            y,
            w: 1,
            h,
            minW: 1,
            minH,
        };
    });
}

function fromGridLayout(gridItems: readonly RglLayoutItem[]): LayoutItem[] {
    return gridItems.map((item) => ({
        ...item,
        x: Math.max(0, Math.min(240, item.x * COL_UNIT)),
        y: Math.max(0, item.y * ROW_UNIT),
        w: Math.max(40, Math.min(240, item.w * COL_UNIT)),
        h: Math.max(24, item.h * ROW_UNIT),
    }));
}

/**
 * Reflows horizontal neighbors on the active resize item's row before vertical compaction:
 * 1. Restores non-active items to their initial resize-start snapshot so dragging out and back has zero hysteresis.
 * 2. Slides right neighbors into available empty columns on the same row.
 * 3. Elastically squeezes neighbors (down to their minW) like a split-pane when two cards share a row.
 * 4. Wraps overflowing neighbors cleanly to x = 0 on the next row only when remaining columns < minW.
 */
function reflowRowDuringResize(
    currentLayout: Layout,
    cols: number,
    activeId: string,
    origMap: Map<string, RglLayoutItem>
): Layout {
    const activeCurrent = currentLayout.find((it) => it.i === activeId);
    const activeOrig = origMap.get(activeId);
    if (!activeCurrent || !activeOrig) {
        return currentLayout;
    }

    const cloned: RglLayoutItem[] = currentLayout.map((it) => {
        if (it.i === activeId) {
            return {
                ...it,
                y: activeOrig.y,
            };
        }
        const orig = origMap.get(it.i);
        return orig ? { ...it, x: orig.x, y: orig.y, w: orig.w, h: orig.h } : { ...it };
    });

    const active = cloned.find((it) => it.i === activeId)!;

    // Find items that started on the same row as activeOrig
    const sameRowSiblings = cloned.filter((it) => {
        if (it.i === activeId) return false;
        const orig = origMap.get(it.i);
        if (!orig) return false;
        return (
            orig.y < activeOrig.y + activeOrig.h &&
            orig.y + orig.h > activeOrig.y
        );
    });

    const leftSiblings = sameRowSiblings
        .filter((it) => (origMap.get(it.i)?.x ?? it.x) < activeOrig.x)
        .sort((a, b) => a.x - b.x);

    const rightSiblings = sameRowSiblings
        .filter((it) => (origMap.get(it.i)?.x ?? it.x) > activeOrig.x)
        .sort((a, b) => a.x - b.x);

    // Handle left neighbor squeeze when resizing from West / South-West handles
    if (leftSiblings.length > 0 && active.x < activeOrig.x) {
        const rightmostLeft = leftSiblings[leftSiblings.length - 1];
        if (rightmostLeft.x + rightmostLeft.w > active.x) {
            const availW = active.x - rightmostLeft.x;
            const minW = rightmostLeft.minW ?? 2;
            if (availW >= minW) {
                rightmostLeft.w = availW;
                rightmostLeft.y = activeOrig.y;
            } else {
                const orig = origMap.get(rightmostLeft.i);
                if (orig) rightmostLeft.w = orig.w;
                active.y = rightmostLeft.y + rightmostLeft.h;
            }
        }
    }

    // Handle right neighbor slide & elastic split-pane squeeze when resizing from East / South-East handles
    if (rightSiblings.length > 0) {
        let cursorX = active.x + active.w;
        let wrappedY = active.y + active.h;

        for (let idx = 0; idx < rightSiblings.length; idx++) {
            const sibling = rightSiblings[idx];
            if (sibling.x >= cursorX) {
                cursorX = sibling.x + sibling.w;
                continue;
            }

            const remainingSiblingsMinW = rightSiblings
                .slice(idx + 1)
                .reduce((sum, s) => sum + (s.minW ?? 2), 0);
            const minW = sibling.minW ?? 2;

            if (cursorX + sibling.w + remainingSiblingsMinW <= cols) {
                // Slide right without changing width
                sibling.x = cursorX;
                cursorX = sibling.x + sibling.w;
            } else if (cols - cursorX - remainingSiblingsMinW >= minW) {
                // Elastic split-pane squeeze on the same row
                sibling.x = cursorX;
                sibling.w = cols - cursorX - remainingSiblingsMinW;
                cursorX = sibling.x + sibling.w;
            } else {
                // Wrap remaining siblings on this row cleanly to the next row starting at x = 0
                let wrapCursorX = 0;
                for (let wIdx = idx; wIdx < rightSiblings.length; wIdx++) {
                    const wrapItem = rightSiblings[wIdx];
                    const orig = origMap.get(wrapItem.i);
                    const restoredW = orig ? orig.w : wrapItem.w;
                    if (wrapCursorX + restoredW > cols) {
                        wrapCursorX = 0;
                        wrappedY += wrapItem.h;
                    }
                    wrapItem.x = wrapCursorX;
                    wrapItem.y = wrappedY;
                    wrapItem.w = restoredW;
                    wrapCursorX += restoredW;
                }
                break;
            }
        }
    }

    return cloned;
}

export function WidgetGrid({
    layout,
    onLayoutChange,
    isEditable = false,
    children,
}: WidgetGridProps) {
    const [mounted, setMounted] = useState(false);
    const [currentCols, setCurrentCols] = useState<number>(12);
    const [isInteracting, setIsInteracting] = useState(false);

    const isResizingRef = useRef(false);
    const activeResizeIdRef = useRef<string | null>(null);
    const resizeStartLayoutRef = useRef<Map<string, RglLayoutItem> | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const desktopGridLayout = useMemo(
        () => toGridLayout(layout, isEditable),
        [layout, isEditable]
    );
    const mobileGridLayout = useMemo(
        () => toMobileStackLayout(layout),
        [layout]
    );

    const layouts = useMemo(
        () => ({
            lg: desktopGridLayout,
            md: desktopGridLayout,
            sm: desktopGridLayout,
            xs: mobileGridLayout,
            xxs: mobileGridLayout,
        }),
        [desktopGridLayout, mobileGridLayout]
    );

    const smartCompactor = useMemo<Compactor>(
        () => ({
            type: "vertical",
            allowOverlap: false,
            preventCollision: false,
            compact(items: Layout, cols: number): Layout {
                if (
                    isResizingRef.current &&
                    activeResizeIdRef.current &&
                    resizeStartLayoutRef.current &&
                    cols > 1
                ) {
                    const reflowed = reflowRowDuringResize(
                        items,
                        cols,
                        activeResizeIdRef.current,
                        resizeStartLayoutRef.current
                    );
                    return verticalCompactor.compact(reflowed, cols);
                }
                return verticalCompactor.compact(items, cols);
            },
        }),
        []
    );

    const commitInteraction = useCallback(
        (currentLayout: Layout) => {
            isResizingRef.current = false;
            activeResizeIdRef.current = null;
            resizeStartLayoutRef.current = null;
            setIsInteracting(false);

            if (!isEditable || currentCols <= 1) {
                return;
            }
            onLayoutChange(fromGridLayout(currentLayout));
        },
        [isEditable, currentCols, onLayoutChange]
    );

    const handleDragStart = useCallback(() => {
        if (isEditable) {
            setIsInteracting(true);
        }
    }, [isEditable]);

    const handleResizeStart = useCallback(
        (currentLayout: Layout, _oldItem: RglLayoutItem | null, newItem: RglLayoutItem | null) => {
            if (!isEditable) return;
            setIsInteracting(true);
            isResizingRef.current = true;
            activeResizeIdRef.current = newItem?.i ?? null;
            resizeStartLayoutRef.current = new Map(
                currentLayout.map((it) => [it.i, { ...it }])
            );
        },
        [isEditable]
    );

    const handleGridLayoutChange = useCallback(
        (currentLayout: Layout) => {
            if (!isEditable || isInteracting || isResizingRef.current || currentCols <= 1) {
                return;
            }
            onLayoutChange(fromGridLayout(currentLayout));
        },
        [isEditable, isInteracting, currentCols, onLayoutChange]
    );

    const dragConfig = useMemo(
        () => ({
            enabled: isEditable,
            cancel: ".no-drag",
            threshold: 3,
        }),
        [isEditable]
    );

    const resizeConfig = useMemo(
        () => ({
            enabled: isEditable,
            handles: isEditable
                ? (["se", "sw", "e", "w", "s"] as const)
                : ([] as const),
        }),
        [isEditable]
    );

    if (!mounted) {
        return (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse min-h-[500px]">
                <div className="h-[340px] rounded-xl bg-gray-100 dark:bg-white/[0.03] border border-dashboard" />
                <div className="h-[340px] rounded-xl bg-gray-100 dark:bg-white/[0.03] border border-dashboard" />
                <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-white/[0.03] border border-dashboard" />
                <div className="h-[300px] rounded-xl bg-gray-100 dark:bg-white/[0.03] border border-dashboard" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
        >
            {/* Subtle 12-Column Magnetic Snap Track Guides in Edit Mode */}
            {isEditable && currentCols === 12 && (
                <div
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute inset-0 grid grid-cols-12 gap-4 px-2 py-2 z-0 transition-opacity duration-200",
                        isInteracting ? "opacity-100" : "opacity-45"
                    )}
                >
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="h-full rounded-lg border border-dashed border-amber-500/20 dark:border-amber-400/15 bg-amber-500/[0.015] dark:bg-amber-400/[0.01]"
                        />
                    ))}
                </div>
            )}

            <ResponsiveGrid
                className={cn(
                    "layout relative z-10",
                    isEditable ? "is-editing-grid" : "is-locked-grid"
                )}
                layouts={layouts}
                breakpoints={{ lg: 1100, md: 768, sm: 600, xs: 420, xxs: 0 }}
                cols={{ lg: 12, md: 12, sm: 12, xs: 1, xxs: 1 }}
                rowHeight={20}
                margin={[0, 0]}
                containerPadding={[0, 0]}
                compactor={smartCompactor}
                dragConfig={dragConfig}
                resizeConfig={resizeConfig}
                onBreakpointChange={(_bp: string, cols: number) =>
                    setCurrentCols(cols)
                }
                onWidthChange={(
                    _width: number,
                    _margin: readonly [number, number],
                    cols: number
                ) => setCurrentCols(cols)}
                onLayoutChange={handleGridLayoutChange}
                onDragStart={handleDragStart}
                onDragStop={commitInteraction}
                onResizeStart={handleResizeStart}
                onResizeStop={commitInteraction}
            >
                {children}
            </ResponsiveGrid>
        </motion.div>
    );
}

