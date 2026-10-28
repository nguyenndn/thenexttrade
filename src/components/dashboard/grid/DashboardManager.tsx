"use client";

import React, {
    useState,
    useEffect,
    useTransition,
    useRef,
    useMemo,
    useCallback,
} from "react";
import {
    LayoutDashboard,
    Plus,
    Edit3,
    Trash2,
    ChevronDown,
    Pin,
    LayoutGrid,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WidgetGrid, LayoutItem } from "./WidgetGrid";
import { WidgetWrapper } from "./WidgetWrapper";
import { WidgetCatalogueModal } from "./WidgetCatalogueModal";
import { WIDGET_REGISTRY, WidgetType } from "./WidgetRegistry";
import {
    GridPresetsMenu,
    GridPresetId,
    buildPresetLayout,
} from "./GridPresetsMenu";
import {
    saveDashboardLayout,
    createDashboard,
    deleteDashboard,
} from "@/actions/dashboard";
import {
    DashboardHero,
    HeroWidgetType,
} from "@/components/dashboard/DashboardHero";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardFilter } from "../DashboardFilter";

const DEFAULT_HERO_WIDGETS: HeroWidgetType[] = [
    "TOTAL_BALANCE",
    "PERIOD_PNL",
    "WIN_RATE",
    "TRADE_SCORE",
];

function migrateLegacyLayout(grid: any[]): any[] {
    if (!grid || grid.length === 0) return [];

    // V1 Legacy layout check: If all items have coordinates fitting 4-column system limits
    const isV1Legacy = grid.every((item: any) => item.w <= 4 && item.h <= 10);
    if (isV1Legacy) {
        return grid.map((item: any) => ({
            ...item,
            x: item.x * 60,
            w: item.w * 60,
            h: Math.round(item.h * 22),
        }));
    }

    // V2 Legacy layout check: If all items have coordinates fitting 24-column system limits
    const isV2Legacy = grid.every((item: any) => item.w <= 24);
    if (isV2Legacy) {
        return grid.map((item: any) => ({
            ...item,
            x: item.x * 10,
            w: item.w * 10,
        }));
    }

    return grid;
}

function parseDashboardLayout(rawLayout: unknown): {
    grid: LayoutItem[];
    hero: HeroWidgetType[];
} {
    if (!rawLayout) {
        return { grid: [], hero: [...DEFAULT_HERO_WIDGETS] };
    }

    let parsed: any = rawLayout;
    if (typeof rawLayout === "string") {
        try {
            parsed = JSON.parse(rawLayout);
        } catch {
            return { grid: [], hero: [...DEFAULT_HERO_WIDGETS] };
        }
    }

    const rawGrid =
        parsed && !Array.isArray(parsed) && Array.isArray(parsed.grid)
            ? parsed.grid
            : Array.isArray(parsed)
              ? parsed
              : [];

    const hero: HeroWidgetType[] =
        parsed && !Array.isArray(parsed) && Array.isArray(parsed.hero)
            ? parsed.hero
            : [...DEFAULT_HERO_WIDGETS];

    const migratedGrid = migrateLegacyLayout(rawGrid);
    const validLayout: LayoutItem[] = migratedGrid
        .filter((item: any) => WIDGET_REGISTRY[item.type as WidgetType])
        .map((item: any) => {
            const config = WIDGET_REGISTRY[item.type as WidgetType];
            const minW = config.minW;
            const minH = config.minH;
            const snappedW = Math.max(
                minW,
                Math.min(240, Math.round((item.w || config.defaultW) / 20) * 20)
            );
            const snappedX = Math.max(
                0,
                Math.min(240 - snappedW, Math.round((item.x || 0) / 20) * 20)
            );
            const snappedH = Math.max(
                minH,
                Math.round((item.h || config.defaultH) / 4) * 4
            );
            const snappedY = Math.max(0, Math.round((item.y || 0) / 4) * 4);

            return {
                ...item,
                x: snappedX,
                y: snappedY,
                w: snappedW,
                h: snappedH,
                minW,
                minH,
            };
        });

    return { grid: validLayout, hero };
}

export interface DashboardManagerProps {
    data: any; // DashboardPageData from server
    initialDashboards: any[];
    onTradeClick?: (id: string) => void;
    onAddTrade?: () => void;
    currentAccountId?: string;
}

export function DashboardManager({
    data,
    initialDashboards,
    onTradeClick,
    onAddTrade,
    currentAccountId,
}: DashboardManagerProps) {
    const [dashboards, setDashboards] = useState<any[]>(initialDashboards);
    const [activeId, setActiveId] = useState<string>(
        initialDashboards[0]?.id || ""
    );
    const [isEditable, setIsEditable] = useState(false);
    const [editName, setEditName] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newDashboardName, setNewDashboardName] = useState("");
    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [heroWidgets, setHeroWidgets] = useState<HeroWidgetType[]>([
        ...DEFAULT_HERO_WIDGETS,
    ]);
    const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Grid presets & Free Style backup
    const [freeStyleBackup, setFreeStyleBackup] = useState<LayoutItem[] | null>(
        null
    );
    const [isCustomGridOpen, setIsCustomGridOpen] = useState(false);
    const [customCols, setCustomCols] = useState("3");
    const [customRows, setCustomRows] = useState("3");

    // Keep a ref of current layout to prevent stale closure state on rapid clicks
    const layoutRef = useRef<LayoutItem[]>([]);
    useEffect(() => {
        layoutRef.current = layout;
    }, [layout]);

    const activeDashboard = dashboards.find((d) => d.id === activeId);

    // Sync dashboards state with initialDashboards prop when it changes
    useEffect(() => {
        setDashboards(initialDashboards);
    }, [initialDashboards]);

    // Sync layout state when active dashboard changes
    useEffect(() => {
        if (activeDashboard && activeDashboard.layout) {
            const { grid, hero } = parseDashboardLayout(activeDashboard.layout);
            setLayout(grid);
            setHeroWidgets(hero);
        }
    }, [activeId, activeDashboard]);

    const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
        // Prevent react-grid-layout from wiping metadata by mapping over prevLayout
        // and only updating coordinates of matching items from newLayout.
        setLayout((prevLayout) => {
            let changed = false;
            const nextLayout = prevLayout.map((existingItem) => {
                const newItem = newLayout.find((l) => l.i === existingItem.i);
                if (newItem) {
                    if (
                        existingItem.x !== newItem.x ||
                        existingItem.y !== newItem.y ||
                        existingItem.w !== newItem.w ||
                        existingItem.h !== newItem.h
                    ) {
                        changed = true;
                        return {
                            ...existingItem,
                            x: newItem.x,
                            y: newItem.y,
                            w: newItem.w,
                            h: newItem.h,
                        };
                    }
                }
                return existingItem;
            });
            return changed ? nextLayout : prevLayout;
        });
    }, []);

    const handleWidgetWidthChange = useCallback(
        (id: string, newWidth: number) => {
            setLayout((prevLayout) => {
                const target = prevLayout.find((item) => item.i === id);
                if (!target) return prevLayout;

                const config = WIDGET_REGISTRY[target.type as WidgetType];
                const minW = config?.minW || target.minW || 40;
                const clampedW = Math.max(
                    minW,
                    Math.min(240, Math.round(newWidth / 20) * 20)
                );

                const cloned = prevLayout.map((it) => ({ ...it }));
                const active = cloned.find((it) => it.i === id)!;
                const oldW = active.w;

                const sameRowSiblings = cloned
                    .filter(
                        (it) =>
                            it.i !== id &&
                            it.y < active.y + active.h &&
                            it.y + it.h > active.y
                    )
                    .sort((a, b) => a.x - b.x);

                // Case 1: Standalone item on its row shrinking -> check if it can pack into open space on the row immediately above
                if (sameRowSiblings.length === 0 && clampedW < oldW && active.y > 0) {
                    const itemsAbove = cloned.filter(
                        (it) => it.i !== id && it.y + it.h <= active.y
                    );
                    if (itemsAbove.length > 0) {
                        const maxTopY = Math.max(...itemsAbove.map((it) => it.y));
                        const prevRowItems = itemsAbove
                            .filter(
                                (it) =>
                                    it.y <= maxTopY &&
                                    it.y + it.h > maxTopY
                            )
                            .sort((a, b) => a.x - b.x);
                        const prevRightEdge = prevRowItems.reduce(
                            (max, it) => Math.max(max, it.x + it.w),
                            0
                        );
                        if (prevRightEdge + clampedW <= 240) {
                            active.x = prevRightEdge;
                            active.y = maxTopY;
                            active.w = clampedW;
                            return cloned;
                        }
                    }
                }

                // Case 2: Item shares a row with siblings
                if (sameRowSiblings.length > 0) {
                    const leftSiblings = sameRowSiblings.filter(
                        (it) => it.x < active.x
                    );
                    const rightSiblings = sameRowSiblings.filter(
                        (it) => it.x >= active.x
                    );

                    const leftEdge =
                        leftSiblings.length > 0
                            ? Math.max(
                                  ...leftSiblings.map((it) => it.x + it.w)
                              )
                            : 0;

                    if (leftEdge + clampedW <= 240) {
                        active.x = leftEdge;
                        active.w = clampedW;
                    } else {
                        // Squeeze left sibling if possible
                        active.w = clampedW;
                        active.x = 240 - clampedW;
                        if (leftSiblings.length === 1) {
                            const leftIt = leftSiblings[0];
                            const leftCfg =
                                WIDGET_REGISTRY[leftIt.type as WidgetType];
                            const leftMinW =
                                leftCfg?.minW || leftIt.minW || 40;
                            if (active.x - leftIt.x >= leftMinW) {
                                leftIt.w = active.x - leftIt.x;
                            } else {
                                active.x = 0;
                                active.y = leftIt.y + leftIt.h;
                            }
                        } else {
                            active.x = 0;
                            active.y =
                                Math.max(
                                    ...leftSiblings.map((it) => it.y + it.h)
                                );
                        }
                    }

                    // Reflow right siblings
                    let cursorX = active.x + active.w;
                    let wrapY = active.y + active.h;
                    for (let idx = 0; idx < rightSiblings.length; idx++) {
                        const sib = rightSiblings[idx];
                        const sibCfg = WIDGET_REGISTRY[sib.type as WidgetType];
                        const sibMinW = sibCfg?.minW || sib.minW || 40;
                        const minAfter = rightSiblings
                            .slice(idx + 1)
                            .reduce((s, r) => {
                                const c =
                                    WIDGET_REGISTRY[r.type as WidgetType];
                                return s + (c?.minW || r.minW || 40);
                            }, 0);

                        if (cursorX + sib.w + minAfter <= 240) {
                            sib.x = cursorX;
                            cursorX = sib.x + sib.w;
                        } else if (240 - cursorX - minAfter >= sibMinW) {
                            sib.x = cursorX;
                            sib.w =
                                Math.floor((240 - cursorX - minAfter) / 20) *
                                20;
                            cursorX = sib.x + sib.w;
                        } else {
                            // Wrap remaining right siblings to next row starting at x = 0
                            let wrapX = 0;
                            for (
                                let wIdx = idx;
                                wIdx < rightSiblings.length;
                                wIdx++
                            ) {
                                const wItem = rightSiblings[wIdx];
                                if (wrapX + wItem.w > 240) {
                                    wrapX = 0;
                                    wrapY += wItem.h;
                                }
                                wItem.x = wrapX;
                                wItem.y = wrapY;
                                wrapX += wItem.w;
                            }
                            break;
                        }
                    }

                    return cloned;
                }

                // Default fallback for standalone item
                active.w = clampedW;
                active.x = Math.max(0, Math.min(active.x, 240 - clampedW));
                return cloned;
            });
        },
        []
    );

    const handleSave = () => {
        if (!editName.trim()) {
            toast.error("Dashboard name cannot be empty");
            return;
        }
        startTransition(async () => {
            try {
                const layoutPayload = {
                    grid: layout,
                    hero: heroWidgets,
                };
                await saveDashboardLayout(
                    activeId,
                    layoutPayload,
                    editName.trim()
                );
                setDashboards((prev) =>
                    prev.map((d) =>
                        d.id === activeId
                            ? {
                                  ...d,
                                  layout: layoutPayload,
                                  name: editName.trim(),
                              }
                            : d
                    )
                );
                setIsEditable(false);
                setFreeStyleBackup(null);
                toast.success("Dashboard saved successfully");
            } catch {
                toast.error("Failed to save dashboard");
            }
        });
    };

    const applyGridPreset = (cols: number, rows: number) => {
        if (layout.length === 0) return;

        if (!freeStyleBackup) {
            setFreeStyleBackup(layout);
        }

        // Snap column count to clean 12-col divisors (1, 2, 3, 4, 6)
        const clampedCols = Math.max(1, Math.min(6, cols));
        const colSpan = Math.max(2, Math.floor(12 / clampedCols));
        const baseColWidth = colSpan * 20;
        const effectiveCols = Math.floor(240 / baseColWidth);
        const standardRowH = 64; // 320px comfortable card height

        const newGrid: LayoutItem[] = [];
        let currentY = 0;

        for (let i = 0; i < layout.length; i += effectiveCols) {
            const rowItems = layout.slice(i, i + effectiveCols);
            const count = rowItems.length;
            const rawColW = Math.floor(240 / count);
            const snappedColW = Math.max(40, Math.floor(rawColW / 20) * 20);
            const rowH = Math.max(
                ...rowItems.map((it) => {
                    const cfg = WIDGET_REGISTRY[it.type as WidgetType];
                    return Math.max(
                        standardRowH,
                        Math.ceil((cfg?.minH || it.minH || 30) / 4) * 4
                    );
                })
            );

            rowItems.forEach((item, colIdx) => {
                const w =
                    colIdx === count - 1
                        ? 240 - colIdx * snappedColW
                        : snappedColW;
                newGrid.push({
                    ...item,
                    x: colIdx * snappedColW,
                    y: currentY,
                    w,
                    h: rowH,
                    minW: Math.min(item.minW || 40, w),
                });
            });
            currentY += rowH;
        }

        setLayout(newGrid);
        toast.success(`Applied ${effectiveCols}×${rows} grid preset`);
    };

    const restoreFreeStyle = () => {
        if (freeStyleBackup) {
            setLayout(freeStyleBackup);
            setFreeStyleBackup(null);
            toast.success("Restored free style layout");
        } else {
            toast.error("No backup free style layout available");
        }
    };

    const handleApplyPreset = (presetId: GridPresetId) => {
        if (layout.length === 0) return;

        if (!freeStyleBackup) {
            setFreeStyleBackup(layout);
        }

        const { grid, label } = buildPresetLayout(layout, presetId);
        setLayout(grid);
        toast.success(`Applied ${label} preset`);
    };

    const handleAddWidget = (widget: any) => {
        const newId = `widget_${Date.now()}`;
        const currentItems = layoutRef.current;
        const w = Math.max(
            widget.minW || 40,
            Math.min(240, Math.round((widget.defaultW || 120) / 20) * 20)
        );
        const h = Math.max(
            widget.minH || 30,
            Math.round((widget.defaultH || 68) / 4) * 4
        );

        let nextX = 0;
        let nextY = 0;

        if (currentItems.length > 0) {
            const finiteItems = currentItems.filter((it) =>
                Number.isFinite(it.y)
            );
            if (finiteItems.length > 0) {
                const maxTopY = Math.max(...finiteItems.map((it) => it.y));
                const bottomRowItems = finiteItems.filter(
                    (it) => it.y === maxTopY
                );
                const rightEdge = bottomRowItems.reduce(
                    (max, it) => Math.max(max, it.x + it.w),
                    0
                );
                const maxBottomY = finiteItems.reduce(
                    (max, it) => Math.max(max, it.y + it.h),
                    0
                );

                if (rightEdge + w <= 240) {
                    nextX = rightEdge;
                    nextY = maxTopY;
                } else {
                    nextX = 0;
                    nextY = maxBottomY;
                }
            }
        }

        const newItem: LayoutItem = {
            i: newId,
            x: nextX,
            y: nextY,
            w,
            h,
            minW: widget.minW,
            minH: widget.minH,
            type: widget.type,
        };

        const updatedLayout = [...currentItems, newItem];
        layoutRef.current = updatedLayout;
        setLayout(updatedLayout);
        toast.success(`Added ${widget.title} widget`);
    };

    const handleRemoveWidget = useCallback((id: string) => {
        setLayout((prev) => prev.filter((item) => item.i !== id));
    }, []);

    const handleCreateDashboard = () => {
        setNewDashboardName("");
        setIsCreateModalOpen(true);
    };

    const submitCreateDashboard = async () => {
        if (!newDashboardName.trim()) return;

        startTransition(async () => {
            try {
                const defaultPayload = {
                    grid: [],
                    hero: [...DEFAULT_HERO_WIDGETS],
                };
                const newDb = await createDashboard(
                    newDashboardName.trim(),
                    defaultPayload
                );
                setDashboards([...dashboards, newDb]);
                setActiveId(newDb.id);
                setEditName(newDb.name);
                setIsEditable(true);
                setIsCreateModalOpen(false);
                toast.success("New dashboard created");
            } catch {
                toast.error("Failed to create dashboard");
            }
        });
    };

    const handleDeleteDashboard = async () => {
        if (dashboards.length <= 1) {
            toast.error("Cannot delete the only dashboard");
            return;
        }
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteDashboard = async () => {
        setIsDeleteModalOpen(false);
        startTransition(async () => {
            try {
                await deleteDashboard(activeId);
                const nextDbs = dashboards.filter((d) => d.id !== activeId);
                setDashboards(nextDbs);
                if (nextDbs.length > 0) {
                    setActiveId(nextDbs[0].id);
                }
                setIsEditable(false);
                toast.success("Dashboard deleted");
            } catch {
                toast.error("Failed to delete dashboard");
            }
        });
    };

    const normalizedLayout = useMemo(
        () =>
            layout.map((item) => {
                const widgetConfig = WIDGET_REGISTRY[item.type as WidgetType];
                return {
                    ...item,
                    minW: item.minW ?? widgetConfig?.minW ?? 40,
                    minH: item.minH ?? widgetConfig?.minH ?? 30,
                };
            }),
        [layout]
    );

    if (!activeDashboard) return null;

    const controls = (
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-lg px-2 h-10 shadow-sm w-full 2xl:w-auto max-w-full overflow-x-auto scrollbar-none">
            {isEditable ? (
                <>
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label="Dashboard Name"
                        className="bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-amber-500 text-sm font-semibold px-1 h-7 rounded-none w-36 outline-none transition-all text-gray-900 dark:text-gray-100 shrink-0"
                        autoFocus
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeleteDashboard}
                        disabled={dashboards.length <= 1 || isPending}
                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-1 shrink-0"
                        aria-label="Delete Dashboard"
                        title="Delete Dashboard"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCatalogueOpen(true)}
                        className="flex items-center justify-center gap-1.5 px-2.5 h-7 min-w-[110px] text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 border border-dashed border-amber-500/30 hover:bg-amber-500/10 rounded-lg transition-colors mx-1 whitespace-nowrap shrink-0"
                        title="Add Widget"
                    >
                        <Plus className="w-3.5 h-3.5" /> Widget
                    </Button>

                    <GridPresetsMenu
                        hasBackup={!!freeStyleBackup}
                        onRestoreFreeStyle={restoreFreeStyle}
                        onApplyPreset={handleApplyPreset}
                        onOpenCustomGrid={() => setIsCustomGridOpen(true)}
                    />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setIsEditable(false);
                            setFreeStyleBackup(null);
                            setEditName(activeDashboard.name);
                            const { grid, hero } = parseDashboardLayout(
                                activeDashboard.layout
                            );
                            setLayout(grid);
                            setHeroWidgets(hero);
                        }}
                        className="px-2.5 h-7 flex items-center justify-center min-w-[90px] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg transition-colors bg-transparent whitespace-nowrap shrink-0 mx-0.5"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-3.5 h-7 flex items-center justify-center min-w-[90px] text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] ml-1 whitespace-nowrap shrink-0"
                    >
                        Save
                    </Button>
                </>
            ) : (
                <>
                    <LayoutGrid className="w-4 h-4 text-slate-500 dark:text-slate-400 ml-1.5 mr-1 shrink-0" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center justify-between gap-2 px-4 h-7 min-w-[120px] text-[13px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg shadow-sm outline-none transition-colors whitespace-nowrap shrink-0"
                            >
                                <span className="max-w-[120px] truncate">
                                    {activeDashboard?.name || "Dashboard"}
                                </span>
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="w-56 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D]"
                        >
                            {dashboards.map((db) => (
                                <DropdownMenuItem
                                    key={db.id}
                                    className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
                                    onClick={() => setActiveId(db.id)}
                                >
                                    <span className="truncate pr-2">
                                        {db.name}
                                    </span>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Pin
                                            className={cn(
                                                "w-4 h-4",
                                                activeId === db.id &&
                                                    "text-amber-500 fill-amber-500 dark:fill-amber-400"
                                            )}
                                        />
                                        <div
                                            className="p-1 hover:text-amber-500 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveId(db.id);
                                                setEditName(db.name);
                                                setIsEditable(true);
                                            }}
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                            <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer font-bold text-amber-500 dark:text-amber-400 rounded-lg px-3 py-2 hover:bg-amber-500/10"
                                onClick={handleCreateDashboard}
                                disabled={isPending}
                            >
                                <Plus className="w-4 h-4" /> New dashboard
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCreateDashboard}
                        disabled={isPending}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Create New Dashboard"
                        title="Create New Dashboard"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setEditName(activeDashboard.name);
                            setIsEditable(true);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Edit Dashboard"
                        title="Edit Dashboard"
                    >
                        <Edit3 className="w-4 h-4" />
                    </Button>
                </>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-4 w-full">
                <div className="w-full 2xl:w-auto">{controls}</div>
                <div className="flex items-center gap-3 w-full 2xl:w-auto">
                    <div className="hidden 2xl:block w-px h-6 bg-gray-200 dark:bg-[#382F1D]" />
                    <DashboardFilter
                        currentAccountId={currentAccountId}
                        className="w-full 2xl:w-auto"
                    />
                </div>
            </div>

            {/* Hero Stats Bar (4 columns) */}
            <DashboardHero
                data={data}
                isEditable={isEditable}
                heroWidgets={heroWidgets}
                onHeroWidgetChange={(index, newType) => {
                    setHeroWidgets((prev) => {
                        const next = [...prev];
                        next[index] = newType;
                        return next;
                    });
                }}
                onHeroWidgetsReorder={(newWidgets) => {
                    setHeroWidgets(newWidgets);
                }}
            />

            {/* Grid Area */}
            <div
                className={cn(
                    "min-h-[500px] transition-[background-color,border-color] duration-200 -mx-2",
                    isEditable &&
                        "bg-gray-50/70 dark:bg-gray-800/20 rounded-xl border-2 border-dashed border-amber-500/30 dark:border-amber-400/25 p-0"
                )}
            >
                {layout.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                        <LayoutDashboard className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-700" />
                        <p>This dashboard is empty.</p>
                        {isEditable ? (
                            <Button
                                variant="ghost"
                                onClick={() => setIsCatalogueOpen(true)}
                                className="mt-4 text-amber-500 hover:text-amber-600 font-medium hover:underline p-0 h-auto"
                            >
                                Add your first widget
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setEditName(activeDashboard.name);
                                    setIsEditable(true);
                                }}
                                className="mt-4 text-amber-500 hover:text-amber-600 font-medium hover:underline p-0 h-auto"
                            >
                                Edit to add widgets
                            </Button>
                        )}
                    </div>
                ) : (
                    <WidgetGrid
                        layout={normalizedLayout}
                        onLayoutChange={handleLayoutChange}
                        isEditable={isEditable}
                    >
                        {normalizedLayout.map((item) => {
                            const widgetConfig =
                                WIDGET_REGISTRY[item.type as WidgetType];
                            if (!widgetConfig)
                                return <div key={item.i}>Invalid Widget</div>;

                            const WidgetComponent = widgetConfig.component;

                            return (
                                <div key={item.i} className="p-2">
                                    <WidgetWrapper
                                        id={item.i}
                                        isEditable={isEditable}
                                        currentWidth={item.w}
                                        currentHeight={item.h}
                                        minWidth={
                                            item.minW || widgetConfig.minW
                                        }
                                        onWidthChange={handleWidgetWidthChange}
                                        onRemove={handleRemoveWidget}
                                    >
                                        <div className="w-full h-full overflow-hidden">
                                            <WidgetComponent
                                                data={data}
                                                {...getWidgetProps(
                                                    item.type as WidgetType,
                                                    data,
                                                    onTradeClick,
                                                    onAddTrade
                                                )}
                                            />
                                        </div>
                                    </WidgetWrapper>
                                </div>
                            );
                        })}
                    </WidgetGrid>
                )}
            </div>

            <WidgetCatalogueModal
                isOpen={isCatalogueOpen}
                onClose={() => setIsCatalogueOpen(false)}
                onAddWidget={handleAddWidget}
                addedWidgetTypes={layout
                    .map((item) => item.type)
                    .filter((t): t is string => !!t)}
            />

            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Dashboard</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newDashboardName}
                            onChange={(e) =>
                                setNewDashboardName(e.target.value)
                            }
                            aria-label="Dashboard name"
                            autoFocus
                            className="focus:ring-2 focus:ring-gold/50 focus:border-gold"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    submitCreateDashboard();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="smd"
                            onClick={submitCreateDashboard}
                            disabled={isPending || !newDashboardName.trim()}
                        >
                            Create Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Dashboard</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete the dashboard &quot;
                            {activeDashboard?.name}&quot;? This action cannot be
                            undone.
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="smd"
                            onClick={confirmDeleteDashboard}
                            disabled={isPending}
                        >
                            Delete Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCustomGridOpen} onOpenChange={setIsCustomGridOpen}>
                <DialogContent className="max-w-xs sm:max-w-sm border border-gray-200 dark:border-[#382F1D] bg-white dark:bg-[#1C1E24] rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>Custom Grid Layout</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Columns (1–6)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={6}
                                    value={customCols}
                                    onChange={(e) =>
                                        setCustomCols(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Rows
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={customRows}
                                    onChange={(e) =>
                                        setCustomRows(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={() => setIsCustomGridOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="smd"
                            onClick={() => {
                                const cols = parseInt(customCols, 10);
                                const rows = parseInt(customRows, 10);
                                if (
                                    isNaN(cols) ||
                                    cols < 1 ||
                                    isNaN(rows) ||
                                    rows < 1
                                ) {
                                    toast.error("Please enter valid numbers");
                                    return;
                                }
                                applyGridPreset(cols, rows);
                                setIsCustomGridOpen(false);
                            }}
                            disabled={isPending}
                            className="h-10 px-4 text-[13px] font-medium bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            Apply Grid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper to map DashboardPageData to specific widget props
function getWidgetProps(
    type: WidgetType,
    data: any,
    onTradeClick?: (id: string) => void,
    onAddTrade?: () => void
) {
    switch (type) {
        case "BALANCE_GROWTH":
            return { data: data.chartData };
        case "DAILY_WIN_RATE":
            return {
                data: data.dailyWinRates,
                selectedDates: data.selectedDates,
            };
        case "PROFIT_DIST":
            return { data: data.symbolPerformance };
        case "LOT_DIST":
            return { data: data.lotDistribution };
        case "MONTHLY_ANALYTICS":
            return { data: data.monthlyAnalytics };
        case "TOP_TRADES":
            return {
                bestTrades: data.bestTrades,
                worstTrades: data.worstTrades,
            };
        case "SYMBOL_PERF":
            return { data: data.symbolAnalytics };
        case "RECENT_TRADES":
            return { trades: data.recentTrades, onTradeClick, onAddTrade };
        case "TRADING_SESSIONS":
            return { data: data.sessionPerformance };
        case "DAY_OF_WEEK":
            return { data: data.dayOfWeekPerformance };
        case "TRADING_CALENDAR":
            return {
                data: data.dailyPerformance || [],
                selectedDates: data.selectedDates,
            };
        case "WIN_LOSS_COMPARISON":
            return {
                avgWin: data.dashboardData?.avgWin || 0,
                avgLoss: data.dashboardData?.avgLoss || 0,
            };
        case "PL_HEATMAP":
            return {
                data: data.dailyPerformance || [],
                selectedDates: data.selectedDates,
            };
        default:
            return {};
    }
}

