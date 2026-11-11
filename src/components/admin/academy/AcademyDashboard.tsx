"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, SearchX, RotateCcw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreateLevelModal } from "./CreateLevelModal";
import { EditLevelModal } from "./EditLevelModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
    deleteLevel,
    toggleAcademyFeature,
} from "@/app/admin/academy/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    AdminLevel,
    AccessFilter,
    SortOption,
    ViewMode,
} from "./types";
import { AcademyStatsGrid } from "./AcademyStatsGrid";
import { AcademyToolbar } from "./AcademyToolbar";
import { AcademyLevelCard } from "./AcademyLevelCard";
import { AcademyLevelTable } from "./AcademyLevelTable";
import { AcademyLevelTree } from "./AcademyLevelTree";

interface AcademyDashboardProps {
    initialLevels: AdminLevel[];
    initialAcademyEnabled?: boolean;
}

export function AcademyDashboard({
    initialLevels,
    initialAcademyEnabled = false,
}: AcademyDashboardProps) {
    const router = useRouter();

    const [academyEnabled, setAcademyEnabled] = useState<boolean>(
        initialAcademyEnabled
    );
    const [isTogglingFeature, setIsTogglingFeature] = useState(false);

    useEffect(() => {
        setAcademyEnabled(initialAcademyEnabled);
    }, [initialAcademyEnabled]);

    // Toolbar and View states
    const [searchQuery, setSearchQuery] = useState("");
    const [accessFilter, setAccessFilter] = useState<AccessFilter>("ALL");
    const [sortOption, setSortOption] = useState<SortOption>("ORDER_ASC");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<AdminLevel | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [levelToDelete, setLevelToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter and sort computation
    const filteredLevels = useMemo(() => {
        let list = [...initialLevels];

        // 1. Access filter
        if (accessFilter === "PUBLIC") {
            list = list.filter(
                (l) => (l.accessLevel || "PUBLIC").toUpperCase() === "PUBLIC"
            );
        } else if (accessFilter === "MEMBER") {
            list = list.filter(
                (l) => (l.accessLevel || "PUBLIC").toUpperCase() !== "PUBLIC"
            );
        }

        // 2. Multi-field search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter((level) => {
                const matchTitle = level.title.toLowerCase().includes(query);
                const matchDesc = (level.description || "")
                    .toLowerCase()
                    .includes(query);
                const matchModule = level.modules?.some((mod) =>
                    mod.title.toLowerCase().includes(query)
                );
                const matchLesson = level.modules?.some((mod) =>
                    mod.lessons?.some(
                        (les) =>
                            les.title.toLowerCase().includes(query) ||
                            les.slug.toLowerCase().includes(query)
                    )
                );
                return matchTitle || matchDesc || matchModule || matchLesson;
            });
        }

        // 3. Sorting
        list.sort((a, b) => {
            switch (sortOption) {
                case "ORDER_ASC":
                    return a.order - b.order;
                case "ORDER_DESC":
                    return b.order - a.order;
                case "LESSONS_DESC": {
                    const countA = (a.modules || []).reduce(
                        (acc, m) =>
                            acc + (m._count?.lessons || m.lessons?.length || 0),
                        0
                    );
                    const countB = (b.modules || []).reduce(
                        (acc, m) =>
                            acc + (m._count?.lessons || m.lessons?.length || 0),
                        0
                    );
                    return countB - countA;
                }
                case "MODULES_DESC": {
                    const countA = a._count?.modules || a.modules?.length || 0;
                    const countB = b._count?.modules || b.modules?.length || 0;
                    return countB - countA;
                }
                case "TITLE_ASC":
                    return a.title.localeCompare(b.title);
                default:
                    return a.order - b.order;
            }
        });

        return list;
    }, [initialLevels, accessFilter, searchQuery, sortOption]);

    const confirmDelete = (levelId: string) => {
        setLevelToDelete(levelId);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!levelToDelete) return;

        setIsDeleting(true);
        const toastId = toast.loading("Deleting level...");
        try {
            const res = await deleteLevel(levelToDelete);
            if (res.success) {
                toast.success("Level deleted successfully", { id: toastId });
                setIsConfirmOpen(false);
                setLevelToDelete(null);
                router.refresh();
            } else {
                toast.error(`Delete failed: ${res.error}`, { id: toastId });
                setIsConfirmOpen(false);
            }
        } catch {
            toast.error("An error occurred", { id: toastId });
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const resetFilters = () => {
        setSearchQuery("");
        setAccessFilter("ALL");
        setSortOption("ORDER_ASC");
    };

    const handleToggleAcademyFeature = async () => {
        const nextState = !academyEnabled;
        setIsTogglingFeature(true);
        try {
            const res = await toggleAcademyFeature(nextState);
            if (!res.success) {
                toast.error(res.error || "Failed to toggle Academy feature");
                return;
            }
            setAcademyEnabled(nextState);
            window.dispatchEvent(new CustomEvent("feature-flags-updated"));
            toast.success(
                nextState
                    ? "Academy is now ON (Visible in Menu, Search & Routes)"
                    : "Academy is now OFF (Hidden from regular users)"
            );
            router.refresh();
        } catch {
            toast.error("Failed to toggle Academy feature");
        } finally {
            setIsTogglingFeature(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <AdminPageHeader
                title="Academy Curriculum"
                description="Manage course levels, modules, structured lessons, and quizzes."
            >
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        type="button"
                        variant="outline"
                        isLoading={isTogglingFeature}
                        onClick={handleToggleAcademyFeature}
                        className="bg-white dark:bg-[#1E2028] shadow-xs"
                    >
                        {!isTogglingFeature && (
                            <span
                                className={cn(
                                    "h-2 w-2 rounded-full shrink-0",
                                    academyEnabled
                                        ? "bg-emerald-500 animate-pulse"
                                        : "bg-rose-500"
                                )}
                            />
                        )}
                        <span>Academy:</span>
                        <span
                            className={cn(
                                "font-extrabold",
                                academyEnabled
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                            )}
                        >
                            {academyEnabled ? "ON" : "OFF"}
                        </span>
                    </Button>
                </div>
            </AdminPageHeader>

            {/* Top KPI Metrics Cards */}
            <AcademyStatsGrid levels={initialLevels} />

            {/* Search, Filter, Sort & View Mode Toolbar */}
            <AcademyToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                accessFilter={accessFilter}
                onAccessFilterChange={setAccessFilter}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                totalCount={initialLevels.length}
                filteredCount={filteredLevels.length}
                onAddNew={() => setIsCreateModalOpen(true)}
            />

            {/* Content Display (Grid, Table, Tree, or Empty State) */}
            {filteredLevels.length === 0 ? (
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold mb-4">
                        <SearchX size={26} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        No course levels found
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        No levels matched your current query or filter criteria.
                        Try refining your search or resetting filters.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                            className="gap-2 font-bold rounded-lg"
                        >
                            <RotateCcw size={14} />
                            <span>Reset Filters</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="gap-2 font-bold rounded-lg"
                        >
                            <Plus size={14} />
                            <span>Add New Level</span>
                        </Button>
                    </div>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLevels.map((level) => (
                        <AcademyLevelCard
                            key={level.id}
                            level={level}
                            onEdit={setEditingLevel}
                            onDelete={confirmDelete}
                        />
                    ))}
                </div>
            ) : viewMode === "table" ? (
                <AcademyLevelTable
                    levels={filteredLevels}
                    onEdit={setEditingLevel}
                    onDelete={confirmDelete}
                />
            ) : (
                <AcademyLevelTree
                    levels={filteredLevels}
                    onEdit={setEditingLevel}
                    onDelete={confirmDelete}
                />
            )}

            {/* Modals */}
            <CreateLevelModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {editingLevel && (
                <EditLevelModal
                    isOpen={!!editingLevel}
                    onClose={() => setEditingLevel(null)}
                    level={{
                        id: editingLevel.id,
                        title: editingLevel.title,
                        description: editingLevel.description || "",
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Course Level"
                description="Are you sure you want to delete this course level? All modules and lessons inside will be deleted. This action cannot be undone."
                confirmText="Delete Level"
                onConfirm={handleDelete}
                onCancel={() => {
                    if (!isDeleting) setIsConfirmOpen(false);
                }}
                isLoading={isDeleting}
            />
        </div>
    );
}
