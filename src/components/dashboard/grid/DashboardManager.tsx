"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { LayoutDashboard, Settings, Plus, Save, X, Edit3, Trash2, ChevronDown, Pin, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WidgetGrid, LayoutItem } from "./WidgetGrid";
import { WidgetWrapper } from "./WidgetWrapper";
import { WidgetCatalogueModal } from "./WidgetCatalogueModal";
import { WIDGET_REGISTRY, WidgetType } from "./WidgetRegistry";
import { getUserDashboards, saveDashboardLayout, createDashboard, deleteDashboard } from "@/actions/dashboard";
import { DashboardHero, HeroWidgetType } from "@/components/dashboard/DashboardHero";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardFilter } from "../DashboardFilter";

function migrateLegacyLayout(grid: any[]): any[] {
  if (!grid || grid.length === 0) return [];

  // V1 Legacy layout check: If all items have coordinates fitting 4-column system limits
  const isV1Legacy = grid.every((item: any) => item.w <= 4 && item.h <= 10);
  if (isV1Legacy) {
    return grid.map((item: any) => ({
      ...item,
      x: item.x * 60,
      w: item.w * 60,
      h: Math.round(item.h * 22), // Scale up height for 5px rowHeight with 0px vertical margin (approx 22x multiplier)
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

export interface DashboardManagerProps {
  data: any; // DashboardPageData from server
  initialDashboards: any[];
  onTradeClick?: (id: string) => void;
  onAddTrade?: () => void;
  currentAccountId?: string;
}

export function DashboardManager({ data, initialDashboards, onTradeClick, onAddTrade, currentAccountId }: DashboardManagerProps) {
  const [dashboards, setDashboards] = useState<any[]>(initialDashboards);
  const [activeId, setActiveId] = useState<string>(initialDashboards[0]?.id || "");
  const [isEditable, setIsEditable] = useState(false);
  const [editName, setEditName] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [heroWidgets, setHeroWidgets] = useState<HeroWidgetType[]>(["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"]);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Grid presets & Free Style backup
  const [freeStyleBackup, setFreeStyleBackup] = useState<LayoutItem[] | null>(null);
  const [isCustomGridOpen, setIsCustomGridOpen] = useState(false);
  const [customCols, setCustomCols] = useState("3");
  const [customRows, setCustomRows] = useState("3");

  // Keep a ref of current layout to prevent stale closure state on rapid clicks
  const layoutRef = useRef<LayoutItem[]>([]);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const activeDashboard = dashboards.find(d => d.id === activeId);

  // Sync dashboards state with initialDashboards prop when it changes
  useEffect(() => {
    setDashboards(initialDashboards);
  }, [initialDashboards]);

  // Sync layout state when active dashboard changes
  useEffect(() => {
    if (activeDashboard && activeDashboard.layout) {
      // Clean up layout from string or obj
      const parsed = typeof activeDashboard.layout === 'string'
        ? JSON.parse(activeDashboard.layout)
        : activeDashboard.layout;

      if (parsed && !Array.isArray(parsed) && parsed.grid) {
        const migratedGrid = migrateLegacyLayout(parsed.grid);
        // Ensure all items have valid type before rendering and override minW/minH with current registry values
        const validLayout = migratedGrid
          .filter((item: any) => WIDGET_REGISTRY[item.type as WidgetType])
          .map((item: any) => {
            const config = WIDGET_REGISTRY[item.type as WidgetType];
            return {
              ...item,
              minW: config.minW,
              minH: config.minH,
            };
          });
        setLayout(validLayout);
        setHeroWidgets(parsed.hero || ["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"]);
      } else {
        const gridToMigrate = Array.isArray(parsed) ? parsed : [];
        const migratedGrid = migrateLegacyLayout(gridToMigrate);
        const validLayout = migratedGrid
          .filter(item => WIDGET_REGISTRY[item.type as WidgetType])
          .map((item: any) => {
            const config = WIDGET_REGISTRY[item.type as WidgetType];
            return {
              ...item,
              minW: config.minW,
              minH: config.minH,
            };
          });
        setLayout(validLayout);
        setHeroWidgets(["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"]);
      }
    }
  }, [activeId, activeDashboard?.layout]);

  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    // Prevent react-grid-layout from wiping items by mapping over prevLayout (our source of truth)
    // and only updating coordinates of matching items from newLayout.
    setLayout(prevLayout => {
      return prevLayout.map(existingItem => {
        const newItem = newLayout.find(l => l.i === existingItem.i);
        if (newItem) {
          return {
            ...existingItem,
            x: newItem.x,
            y: newItem.y,
            w: newItem.w,
            h: newItem.h,
          };
        }
        return existingItem;
      });
    });
  };

  const handleSave = () => {
    if (!editName.trim()) {
      toast.error("Dashboard name cannot be empty");
      return;
    }
    startTransition(async () => {
      try {
        const layoutPayload = {
          grid: layout,
          hero: heroWidgets
        };
        await saveDashboardLayout(activeId, layoutPayload, editName.trim());
        setDashboards(prev => prev.map(d => d.id === activeId ? { ...d, layout: layoutPayload, name: editName.trim() } : d));
        setIsEditable(false);
        setFreeStyleBackup(null);
        toast.success("Dashboard saved successfully");
      } catch (err) {
        toast.error("Failed to save dashboard");
      }
    });
  };

  const applyGridPreset = (cols: number, rows: number) => {
    if (layout.length === 0) return;

    // Back up the current layout if we haven't already backed one up during this edit session
    if (!freeStyleBackup) {
      setFreeStyleBackup(layout);
    }

    const C = cols;
    const R = rows;
    const colWidth = Math.floor(240 / C);
    const rowHeight = Math.max(30, Math.floor(180 / R));

    const newGrid = layout.map((item, idx) => {
      const colIdx = idx % C;
      const rowIdx = Math.floor(idx / C);
      return {
        ...item,
        x: colIdx * colWidth,
        y: rowIdx * rowHeight,
        w: colWidth,
        h: rowHeight,
      };
    });

    setLayout(newGrid);
    toast.success(`Applied ${cols}x${rows} grid preset`);
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

  const applySpecialLayout = (type: "focus-left" | "focus-right" | "split" | "single-col" | "4-cols") => {
    if (layout.length === 0) return;

    if (!freeStyleBackup) {
      setFreeStyleBackup(layout);
    }

    let newGrid: LayoutItem[] = [];
    if (type === "focus-left") {
      let leftY = 0;
      let rightY = 0;
      newGrid = layout.map((item, idx) => {
        if (idx % 3 === 0) {
          const y = leftY;
          leftY += 80;
          return { ...item, x: 0, y, w: 160, h: 80 };
        } else {
          const y = rightY;
          rightY += 40;
          return { ...item, x: 160, y, w: 80, h: 40 };
        }
      });
      toast.success("Applied Focus Left layout (2/3 : 1/3)");
    } else if (type === "focus-right") {
      let leftY = 0;
      let rightY = 0;
      newGrid = layout.map((item, idx) => {
        if (idx % 3 === 0) {
          const y = rightY;
          rightY += 80;
          return { ...item, x: 80, y, w: 160, h: 80 };
        } else {
          const y = leftY;
          leftY += 40;
          return { ...item, x: 0, y, w: 80, h: 40 };
        }
      });
      toast.success("Applied Focus Right layout (1/3 : 2/3)");
    } else if (type === "split") {
      newGrid = layout.map((item, idx) => {
        const colIdx = idx % 2;
        const rowIdx = Math.floor(idx / 2);
        return {
          ...item,
          x: colIdx * 120,
          y: rowIdx * 60,
          w: 120,
          h: 60,
        };
      });
      toast.success("Applied Split Screen layout (50:50)");
    } else if (type === "single-col") {
      newGrid = layout.map((item, idx) => {
        return {
          ...item,
          x: 0,
          y: idx * 60,
          w: 240,
          h: 60,
        };
      });
      toast.success("Applied Single Column Full-Width layout");
    } else if (type === "4-cols") {
      newGrid = layout.map((item, idx) => {
        const colIdx = idx % 4;
        const rowIdx = Math.floor(idx / 4);
        return {
          ...item,
          x: colIdx * 60,
          y: rowIdx * 50,
          w: 60,
          h: 50,
        };
      });
      toast.success("Applied 4 Columns Grid layout");
    }

    setLayout(newGrid);
  };

  const handleAddWidget = (widget: any) => {
    const newId = `widget_${Date.now()}`;
    const newItem = {
      i: newId,
      x: 0,
      y: Infinity, // puts it at the bottom
      w: widget.defaultW,
      h: widget.defaultH,
      minW: widget.minW,
      minH: widget.minH,
      type: widget.type,
    };

    const updatedLayout = [...layoutRef.current, newItem];
    layoutRef.current = updatedLayout; // Sync ref immediately to allow rapid successive clicks
    setLayout(updatedLayout);
    toast.success(`Added ${widget.title} widget`);
  };

  const handleRemoveWidget = (id: string) => {
    setLayout(prev => prev.filter(item => item.i !== id));
  };

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
          hero: ["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"]
        };
        const newDb = await createDashboard(newDashboardName.trim(), defaultPayload);
        setDashboards([...dashboards, newDb]);
        setActiveId(newDb.id);
        setIsEditable(true);
        setIsCreateModalOpen(false);
        toast.success("New dashboard created");
      } catch (err) {
        toast.error("Failed to create dashboard");
      }
    });
  };

  const handleDeleteDashboard = async (id: string) => {
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
        const nextDbs = dashboards.filter(d => d.id !== activeId);
        setDashboards(nextDbs);
        if (activeId === activeId) {
          setActiveId(nextDbs[0].id);
        }
        setIsEditable(false);
        toast.success("Dashboard deleted");
      } catch (err) {
        toast.error("Failed to delete dashboard");
      }
    });
  };

  if (!activeDashboard) return null;

  const controls = (
    <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-xl px-2 h-10 shadow-sm w-full 2xl:w-auto max-w-full overflow-x-auto scrollbar-none">
      {isEditable ? (
        <>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-amber-500 text-sm font-semibold px-1 h-7 rounded-none w-36 outline-none transition-all text-gray-900 dark:text-gray-100 shrink-0"
            placeholder="Dashboard Name"
            autoFocus
          />
          <button
            onClick={() => handleDeleteDashboard(activeId)}
            disabled={dashboards.length <= 1 || isPending}
            className="w-7 h-7 flex items-center justify-center text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-1 shrink-0"
            title="Delete Dashboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCatalogueOpen(true)}
            className="flex items-center justify-center gap-1.5 px-2.5 h-7 min-w-[110px] text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 border border-dashed border-amber-500/30 hover:bg-amber-500/10 rounded-lg transition-colors mx-1 whitespace-nowrap shrink-0"
            title="Add Widget"
          >
            <Plus className="w-3.5 h-3.5" /> Widget
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center gap-1.5 px-2.5 h-7 min-w-[120px] text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mx-1 outline-none whitespace-nowrap shrink-0"
                title="Grid Presets"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid Presets
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] max-h-[380px] overflow-y-auto scrollbar-thin">
              <DropdownMenuItem
                onClick={restoreFreeStyle}
                disabled={!freeStyleBackup}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50"
              >
                Free Style (Restore)
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asymmetric Layouts</div>
              <DropdownMenuItem
                onClick={() => applySpecialLayout("focus-left")}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Focus Left (2/3 : 1/3)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applySpecialLayout("focus-right")}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Focus Right (1/3 : 2/3)
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Symmetric Layouts</div>
              <DropdownMenuItem
                onClick={() => applySpecialLayout("split")}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Split Screen (50:50)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applySpecialLayout("single-col")}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Full Width Stack (1 Col)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applySpecialLayout("4-cols")}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                4 Columns Grid
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regular Grids</div>
              <DropdownMenuItem
                onClick={() => applyGridPreset(3, 3)}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                3 x 3 Grid
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyGridPreset(3, 4)}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                3 x 4 Grid
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyGridPreset(2, 3)}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                2 x 3 Grid
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => applyGridPreset(2, 4)}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                2 x 4 Grid
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
              <DropdownMenuItem
                onClick={() => setIsCustomGridOpen(true)}
                className="cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Custom Grid...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => {
              setIsEditable(false);
              setFreeStyleBackup(null);
              // revert layout
              const parsed = typeof activeDashboard.layout === 'string' ? JSON.parse(activeDashboard.layout) : activeDashboard.layout;
              if (parsed && !Array.isArray(parsed) && parsed.grid) {
                setLayout(parsed.grid);
                setHeroWidgets(parsed.hero || ["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"]);
              } else {
                setLayout(Array.isArray(parsed) ? parsed : []);
                setHeroWidgets(["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"]);
              }
            }}
            className="px-2.5 h-7 flex items-center justify-center min-w-[110px] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg transition-colors bg-transparent whitespace-nowrap shrink-0 mx-0.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-3.5 h-7 flex items-center justify-center min-w-[110px] text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] ml-1.5 whitespace-nowrap shrink-0"
          >
            Save
          </button>
        </>
      ) : (
        <>
          <LayoutGrid className="w-4 h-4 text-slate-500 dark:text-slate-400 ml-1.5 mr-1 shrink-0" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-between gap-2 px-4 h-7 min-w-[120px] text-[13px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg shadow-sm outline-none transition-colors whitespace-nowrap shrink-0">
                <span className="max-w-[120px] truncate">{activeDashboard?.name || "Dashboard"}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D]">
              {dashboards.map((db) => (
                <DropdownMenuItem
                  key={db.id}
                  className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 my-0.5 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
                  onClick={() => setActiveId(db.id)}
                >
                  <span className="truncate pr-2">{db.name}</span>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Pin className={cn("w-4 h-4", activeId === db.id && "text-amber-500 fill-amber-500 dark:fill-amber-400")} />
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

          <button
            onClick={handleCreateDashboard}
            disabled={isPending}
            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Create New Dashboard"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1" />

          <button
            onClick={() => {
              setEditName(activeDashboard.name);
              setIsEditable(true);
            }}
            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Edit Dashboard"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-4 w-full">
        <div className="w-full 2xl:w-auto">
          {controls}
        </div>
        <div className="flex items-center gap-3 w-full 2xl:w-auto">
          <div className="hidden 2xl:block w-px h-6 bg-gray-200 dark:bg-[#382F1D]" />
          <DashboardFilter currentAccountId={currentAccountId} className="w-full 2xl:w-auto" />
        </div>
      </div>

      {/* Hero Stats Bar (4 columns) - Now customizable! */}
      <DashboardHero
        data={data}
        isEditable={isEditable}
        heroWidgets={heroWidgets}
        onHeroWidgetChange={(index, newType) => {
          setHeroWidgets(prev => {
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
      <div className={cn("min-h-[500px] transition-[background-color,border-color] duration-200", isEditable && "bg-gray-50 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-0")}>
        {layout.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <LayoutDashboard className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-700" />
            <p>This dashboard is empty.</p>
            {isEditable ? (
              <button onClick={() => setIsCatalogueOpen(true)} className="mt-4 text-primary font-medium hover:underline">
                Add your first widget
              </button>
            ) : (
              <button onClick={() => setIsEditable(true)} className="mt-4 text-primary font-medium hover:underline">
                Edit to add widgets
              </button>
            )}
          </div>
        ) : (
          <WidgetGrid
            layout={layout.map((item: any) => {
              const widgetConfig = WIDGET_REGISTRY[item.type as WidgetType];
              return {
                ...item,
                minW: widgetConfig?.minW || 1,
                minH: widgetConfig?.minH || 1,
              };
            })}
            onLayoutChange={handleLayoutChange}
            isEditable={isEditable}
          >
            {layout.map((item: any) => {
              const widgetConfig = WIDGET_REGISTRY[item.type as WidgetType];
              if (!widgetConfig) return <div key={item.i}>Invalid Widget</div>;

              const WidgetComponent = widgetConfig.component;

              return (
                <div key={item.i} className="p-2">
                  <WidgetWrapper id={item.i} isEditable={isEditable} onRemove={handleRemoveWidget}>
                    {/* Render the dynamically imported component and pass data */}
                    <div className="w-full h-full overflow-hidden">
                      <WidgetComponent
                        data={data}
                        // Depending on the widget, we might need to pass specific props 
                        // extracted from `data` here. Since components already accept what 
                        // DashboardClient passes, we can pass the entire `data` root or specific parts.
                        // However, to keep it simple and robust, we might need to adapt the widget components
                        // or map props here. Let's map props based on type!
                        {...getWidgetProps(item.type, data, onTradeClick, onAddTrade)}
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
        addedWidgetTypes={layout.map(item => item.type).filter((t): t is string => !!t)}
      />

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              placeholder="Enter dashboard name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitCreateDashboard();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={submitCreateDashboard} disabled={isPending || !newDashboardName.trim()}>
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dashboard</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the dashboard "{activeDashboard?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteDashboard} disabled={isPending}>
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Columns</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={customCols}
                  onChange={(e) => setCustomCols(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rows</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={customRows}
                  onChange={(e) => setCustomRows(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomGridOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const cols = parseInt(customCols, 10);
                const rows = parseInt(customRows, 10);
                if (isNaN(cols) || cols < 1 || isNaN(rows) || rows < 1) {
                  toast.error("Please enter valid numbers");
                  return;
                }
                applyGridPreset(cols, rows);
                setIsCustomGridOpen(false);
              }}
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
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
function getWidgetProps(type: WidgetType, data: any, onTradeClick?: (id: string) => void, onAddTrade?: () => void) {
  switch (type) {
    case 'BALANCE_GROWTH': return { data: data.chartData };
    case 'DAILY_WIN_RATE': return { data: data.dailyWinRates, dates: data.selectedDates };
    case 'PROFIT_DIST': return { data: data.symbolPerformance };
    case 'LOT_DIST': return { data: data.lotDistribution };
    case 'MONTHLY_ANALYTICS': return { data: data.monthlyAnalytics };
    case 'TOP_TRADES': return { bestTrades: data.bestTrades, worstTrades: data.worstTrades };
    case 'SYMBOL_PERF': return { data: data.symbolAnalytics };
    case 'RECENT_TRADES': return { trades: data.recentTrades, onTradeClick, onAddTrade };
    case 'TRADING_SESSIONS': return { data: data.sessionPerformance };
    case 'DAY_OF_WEEK': return { data: data.dayOfWeekPerformance };
    case 'TRADING_CALENDAR': return { data: data.dailyPerformance || [], selectedDates: data.selectedDates };
    case 'WIN_LOSS_COMPARISON': return { avgWin: data.dashboardData?.avgWin || 0, avgLoss: data.dashboardData?.avgLoss || 0 };
    case 'PL_HEATMAP': return { data: data.dailyPerformance || [], selectedDates: data.selectedDates };
    default: return {};
  }
}
