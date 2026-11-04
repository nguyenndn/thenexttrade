"use client";

import { useState, useMemo, useTransition } from "react";
import {
    Trophy,
    Plus,
    Calendar,
    DollarSign,
    Users,
    Clock,
    Play,
    Square,
    Edit2,
    Trash2,
    CheckCircle2,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import {
    SyncFilterToolbar,
    StatusFilterOption,
} from "@/app/admin/ib/sync-requests/SyncFilterToolbar";
import { toast } from "sonner";
import { CompetitionModal } from "./CompetitionModal";
import {
    toggleCompetitionStatus,
    deleteCompetition,
} from "@/actions/admin/competitions";
import { useRouter } from "next/navigation";

interface CompetitionListClientProps {
    initialCompetitions: any[];
    stats: {
        totalCompetitions: number;
        activeCount: number;
        upcomingCount: number;
        totalPrizePool: number;
        totalParticipants: number;
    };
}

export function CompetitionListClient({
    initialCompetitions,
    stats,
}: CompetitionListClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [competitions, setCompetitions] = useState(initialCompetitions);
    const [selectedTab, setSelectedTab] = useState<string>("ALL");
    const [search, setSearch] = useState<string>("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCompetition, setEditingCompetition] = useState<any | null>(
        null
    );
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleCreateClick = () => {
        setEditingCompetition(null);
        setModalOpen(true);
    };

    const handleEditClick = (comp: any) => {
        setEditingCompetition(comp);
        setModalOpen(true);
    };

    const handleRefresh = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    const handleStatusToggle = async (id: string, newStatus: any) => {
        setProcessingId(id);
        try {
            const res = await toggleCompetitionStatus(id, newStatus);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Competition marked as ${newStatus}`);
                setCompetitions((prev) =>
                    prev.map((c) =>
                        c.id === id ? { ...c, status: newStatus } : c
                    )
                );
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        setProcessingId(id);
        try {
            const res = await deleteCompetition(id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Competition deleted successfully");
                setCompetitions((prev) => prev.filter((c) => c.id !== id));
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
        } finally {
            setProcessingId(null);
        }
    };

    const statusCounts = useMemo(() => {
        return {
            ALL: competitions.length,
            ACTIVE: competitions.filter((c) => c.status === "ACTIVE").length,
            UPCOMING: competitions.filter((c) => c.status === "UPCOMING")
                .length,
            DRAFT: competitions.filter((c) => c.status === "DRAFT").length,
            ENDED: competitions.filter((c) => c.status === "ENDED").length,
        };
    }, [competitions]);

    const statusTabs: StatusFilterOption[] = [
        {
            key: "ALL",
            label: "All Tournaments",
            count: statusCounts.ALL,
            icon: Trophy,
        },
        {
            key: "ACTIVE",
            label: "Active Sprints",
            count: statusCounts.ACTIVE,
            icon: Play,
        },
        {
            key: "UPCOMING",
            label: "Upcoming",
            count: statusCounts.UPCOMING,
            icon: Clock,
        },
        {
            key: "DRAFT",
            label: "Drafts",
            count: statusCounts.DRAFT,
            icon: FileText,
        },
        {
            key: "ENDED",
            label: "Ended",
            count: statusCounts.ENDED,
            icon: CheckCircle2,
        },
    ];

    const filteredCompetitions = useMemo(() => {
        return competitions.filter((comp) => {
            if (selectedTab !== "ALL" && comp.status !== selectedTab) {
                return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase().trim();
                const titleMatch = comp.title?.toLowerCase().includes(q);
                const slugMatch = comp.slug?.toLowerCase().includes(q);
                const brokerMatch = comp.eligibleBrokers
                    ?.toLowerCase()
                    .includes(q);
                return Boolean(titleMatch || slugMatch || brokerMatch);
            }
            return true;
        });
    }, [competitions, selectedTab, search]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                    </span>
                );
            case "UPCOMING":
                return (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 inline-flex items-center gap-1">
                        <Clock size={11} />
                        UPCOMING
                    </span>
                );
            case "ENDED":
                return (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 inline-flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        ENDED
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 inline-flex items-center gap-1">
                        <FileText size={11} />
                        DRAFT
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Standardized Admin Page Header */}
            <AdminPageHeader
                title="Trading Competitions & Sprints"
                description="Configure verified MT5 trading tournaments, live season prize pools, and automated leaderboard rules."
            >
                <Button
                    variant="primary"
                    onClick={handleCreateClick}
                    className="shadow-lg shadow-amber-500/20 font-bold"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Create Competition
                </Button>
            </AdminPageHeader>

            {/* Top Metric Cards with AnimatedStatCard (matching sync-requests & pipeline) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedStatCard
                    title="Total Tournaments"
                    value={stats.totalCompetitions}
                    icon={Trophy}
                    color="amber"
                    index={0}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Active Live Sprints"
                    value={stats.activeCount}
                    icon={Play}
                    color="emerald"
                    index={1}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Total Prize Pool"
                    value={stats.totalPrizePool}
                    prefix="$"
                    icon={DollarSign}
                    color="amber"
                    index={2}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Enrolled Traders"
                    value={stats.totalParticipants}
                    icon={Users}
                    color="amber"
                    index={3}
                    trendPercent={null}
                />
            </div>

            {/* Standardized Status Tabs & Search Toolbar Card (matching sync-requests) */}
            <SyncFilterToolbar
                search={search}
                onSearchChange={setSearch}
                onClearSearch={() => setSearch("")}
                statusTabs={statusTabs}
                activeStatus={selectedTab}
                onStatusChange={setSelectedTab}
                onRefresh={handleRefresh}
                isRefreshing={isPending}
                tabsId="admin-competitions-status-tabs"
            />

            {/* Unified Data Table Card */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                        <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3.5">
                                    Tournament &amp; Slug
                                </th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5">Dates</th>
                                <th className="px-4 py-3.5">Prize Pool</th>
                                <th className="px-4 py-3.5">Guardrails</th>
                                <th className="px-4 py-3.5">Traders</th>
                                <th className="px-4 py-3.5 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredCompetitions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-16 text-center text-gray-400 dark:text-gray-500"
                                    >
                                        <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                            No competitions found
                                        </p>
                                        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                            No trading sprints match the active
                                            filter. Click &ldquo;Create
                                            Competition&rdquo; to launch a new
                                            tournament.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCompetitions.map((comp) => {
                                    const start = new Date(
                                        comp.startDate
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                    const end = new Date(
                                        comp.endDate
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    });

                                    return (
                                        <tr
                                            key={comp.id}
                                            className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-4 py-3.5">
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">
                                                    {comp.title}
                                                </p>
                                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                    /{comp.slug}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {getStatusBadge(comp.status)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs font-mono tabular-nums font-medium text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar
                                                        size={13}
                                                        className="text-gray-400 shrink-0"
                                                    />
                                                    <span>
                                                        {start} &rarr; {end}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="font-mono tabular-nums font-black text-amber-600 dark:text-amber-400 text-sm">
                                                    $
                                                    {comp.prizePool?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs font-mono tabular-nums space-y-0.5 text-gray-600 dark:text-gray-300">
                                                <p>
                                                    &bull; Min:{" "}
                                                    <strong className="text-gray-900 dark:text-white">
                                                        {comp.minTrades}
                                                    </strong>{" "}
                                                    trades
                                                </p>
                                                <p>
                                                    &bull; Max DD:{" "}
                                                    <strong className="text-rose-600 dark:text-rose-400">
                                                        {comp.maxDrawdown}%
                                                    </strong>
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums font-bold text-gray-700 dark:text-gray-300">
                                                    <Users
                                                        size={13}
                                                        className="text-gray-400"
                                                    />
                                                    {comp._count
                                                        ?.participants ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {comp.status ===
                                                        "DRAFT" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                processingId ===
                                                                comp.id
                                                            }
                                                            onClick={() =>
                                                                handleStatusToggle(
                                                                    comp.id,
                                                                    "ACTIVE"
                                                                )
                                                            }
                                                            className="h-8 px-3 rounded-lg text-xs font-bold text-emerald-600 hover:text-emerald-700 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 gap-1"
                                                        >
                                                            <Play size={12} />
                                                            Launch
                                                        </Button>
                                                    )}
                                                    {comp.status ===
                                                        "ACTIVE" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                processingId ===
                                                                comp.id
                                                            }
                                                            onClick={() =>
                                                                handleStatusToggle(
                                                                    comp.id,
                                                                    "ENDED"
                                                                )
                                                            }
                                                            className="h-8 px-3 rounded-lg text-xs font-bold text-amber-600 hover:text-amber-700 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 gap-1"
                                                        >
                                                            <Square size={12} />
                                                            End
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleEditClick(
                                                                comp
                                                            )
                                                        }
                                                        className="h-8 w-8 min-w-8 aspect-square rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shrink-0"
                                                        aria-label="Edit competition"
                                                    >
                                                        <Edit2 size={13} />
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        disabled={
                                                            processingId ===
                                                            comp.id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                comp.id,
                                                                comp.title
                                                            )
                                                        }
                                                        className="h-8 w-8 min-w-8 aspect-square rounded-lg text-gray-400 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
                                                        aria-label="Delete competition"
                                                    >
                                                        <Trash2 size={13} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <CompetitionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                competition={editingCompetition}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}
