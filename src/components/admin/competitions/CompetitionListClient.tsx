"use client";

import { useState } from "react";
import {
    Trophy,
    Plus,
    Calendar,
    DollarSign,
    Users,
    ShieldAlert,
    Clock,
    MoreVertical,
    Play,
    Square,
    Edit2,
    Trash2,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
    const [competitions, setCompetitions] = useState(initialCompetitions);
    const [selectedTab, setSelectedTab] = useState<string>("ALL");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCompetition, setEditingCompetition] = useState<any | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleCreateClick = () => {
        setEditingCompetition(null);
        setModalOpen(true);
    };

    const handleEditClick = (comp: any) => {
        setEditingCompetition(comp);
        setModalOpen(true);
    };

    const handleStatusToggle = async (id: string, newStatus: any) => {
        setProcessingId(id);
        try {
            const res = await toggleCompetitionStatus(id, newStatus);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Competition marked as ${newStatus}`);
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

    const filteredCompetitions = competitions.filter((comp) => {
        if (selectedTab === "ALL") return true;
        return comp.status === selectedTab;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                    </span>
                );
            case "UPCOMING":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock size={11} /> UPCOMING
                    </span>
                );
            case "ENDED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
                        <CheckCircle size={11} /> ENDED
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                        DRAFT
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
                        <Trophy className="text-amber-500" size={26} />
                        Trading Competitions &amp; Sprints
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Configure verified MT5 trading tournaments, live season prize pools, and automated leaderboard rules.
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={handleCreateClick}
                    className="flex items-center gap-2 shrink-0 font-bold"
                >
                    <Plus size={16} /> Create Competition
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-dashboard bg-white dark:bg-[#151925] p-4 space-y-1 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Tournaments</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalCompetitions}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] p-4 space-y-1 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Live Sprints</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.activeCount}</p>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.03] p-4 space-y-1 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Total Prize Pool</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">${stats.totalPrizePool.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-dashboard bg-white dark:bg-[#151925] p-4 space-y-1 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Enrolled Traders</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalParticipants}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div role="tablist" aria-label="Competition Status Filter" className="flex items-center gap-1.5 border-b border-dashboard pb-3 overflow-x-auto">
                {["ALL", "ACTIVE", "UPCOMING", "DRAFT", "ENDED"].map((tab) => (
                    <Button
                        key={tab}
                        type="button"
                        variant="ghost"
                        role="tab"
                        aria-selected={selectedTab === tab}
                        onClick={() => setSelectedTab(tab)}
                        className={cn(
                            "h-auto px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                            selectedTab === tab
                                ? "bg-amber-500 text-white shadow-xs hover:bg-amber-500 hover:text-white"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                        )}
                    >
                        {tab}
                    </Button>
                ))}
            </div>

            {/* Competitions Table */}
            <div className="rounded-xl border border-dashboard bg-white dark:bg-[#151925] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-dashboard bg-gray-50 dark:bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-5 py-3.5">Tournament &amp; Slug</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5">Dates</th>
                                <th className="px-4 py-3.5">Prize Pool</th>
                                <th className="px-4 py-3.5">Guardrails</th>
                                <th className="px-4 py-3.5">Traders</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dashboard">
                            {filteredCompetitions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                                        No competitions found in this category. Click &quot;Create Competition&quot; to launch a sprint.
                                    </td>
                                </tr>
                            ) : (
                                filteredCompetitions.map((comp) => {
                                    const start = new Date(comp.startDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                    const end = new Date(comp.endDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    });

                                    return (
                                        <tr key={comp.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-gray-900 dark:text-white">{comp.title}</p>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">/{comp.slug}</p>
                                            </td>
                                            <td className="px-4 py-4">{getStatusBadge(comp.status)}</td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-gray-400" />
                                                    <span>{start} &rarr; {end}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-black text-amber-600 dark:text-amber-400 text-base">
                                                    ${comp.prizePool?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-xs space-y-0.5 text-gray-600 dark:text-gray-300">
                                                <p>&bull; Min: <strong>{comp.minTrades}</strong> trades</p>
                                                <p>&bull; Max DD: <strong className="text-red-500">{comp.maxDrawdown}%</strong></p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    <Users size={14} className="text-gray-400" />
                                                    {comp._count?.participants ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right space-x-2">
                                                {/* Status switch shortcut */}
                                                {comp.status === "DRAFT" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={processingId === comp.id}
                                                        onClick={() => handleStatusToggle(comp.id, "ACTIVE")}
                                                        className="text-xs h-8 text-emerald-600 hover:text-emerald-700"
                                                    >
                                                        <Play size={12} className="mr-1" /> Launch
                                                    </Button>
                                                )}
                                                {comp.status === "ACTIVE" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={processingId === comp.id}
                                                        onClick={() => handleStatusToggle(comp.id, "ENDED")}
                                                        className="text-xs h-8 text-amber-600"
                                                    >
                                                        <Square size={12} className="mr-1" /> End
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleEditClick(comp)}
                                                    className="h-8 w-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                    aria-label="Edit competition"
                                                >
                                                    <Edit2 size={13} />
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    disabled={processingId === comp.id}
                                                    onClick={() => handleDelete(comp.id, comp.title)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    aria-label="Delete competition"
                                                >
                                                    <Trash2 size={13} />
                                                </Button>
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
