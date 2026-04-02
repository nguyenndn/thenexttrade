"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Bug, Lightbulb, Search, Clock, Loader2, CheckCircle2, AlertCircle, ChevronDown, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load data");
    return res.json();
};

interface Feedback {
    id: string;
    type: string;
    message: string;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    };
}

const statusOptions = [
    { value: "OPEN", label: "Open", color: "text-blue-500 bg-blue-500/10", icon: Clock },
    { value: "IN_PROGRESS", label: "In Progress", color: "text-amber-500 bg-amber-500/10", icon: Loader2 },
    { value: "RESOLVED", label: "Resolved", color: "text-primary bg-primary/10", icon: CheckCircle2 },
    { value: "CLOSED", label: "Closed", color: "text-gray-600 bg-gray-500/10", icon: AlertCircle },
];

type FilterType = "ALL" | "BUG" | "FEATURE";
type FilterStatus = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export default function AdminFeedbackPage() {
    const { data, error, isLoading, mutate } = useSWR("/api/admin/feedback", fetcher, {
        onError: (err) => {
            toast.error(err.message || "Error fetching feedback");
        },
    });

    const feedbacks: Feedback[] = data?.feedbacks || [];
    const stats = data?.stats || { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };

    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<FilterType>("ALL");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return feedbacks.filter((fb) => {
            const matchesSearch = !searchQuery ||
                fb.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fb.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fb.user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === "ALL" || fb.type === filterType;
            const matchesStatus = filterStatus === "ALL" || fb.status === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [feedbacks, searchQuery, filterType, filterStatus]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch("/api/admin/feedback", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                toast.success("Status updated");
                mutate();
            } else {
                toast.error("Failed to update status");
            }
        } catch {
            toast.error("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const totalCount = feedbacks.length;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Feedback & Support"
                description="Review bug reports and feature requests from users."
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatedStatCard
                    title="Open"
                    value={stats.OPEN}
                    icon={Clock}
                    color="blue"
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="In Progress"
                    value={stats.IN_PROGRESS}
                    icon={Loader2}
                    color="amber"
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Resolved"
                    value={stats.RESOLVED}
                    icon={CheckCircle2}
                    color="emerald"
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Total"
                    value={totalCount}
                    icon={MessageSquare}
                    color="cyan"
                    trendPercent={null}
                />
            </div>

            {/* Unified Toolbar: Search + Filters */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                <div className="flex flex-1 gap-4 flex-col lg:flex-row justify-between w-full lg:items-center">
                    <div className="flex flex-1 gap-2 flex-col sm:flex-row w-full lg:max-w-xl">
                        <div className="flex-1 w-full sm:max-w-md">
                            <PremiumInput
                                icon={Search}
                                placeholder="Search feedback..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Type Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto shrink-0 justify-between sm:justify-center">
                                    <span>Type: <span className="text-primary">{filterType === "ALL" ? "All" : filterType === "BUG" ? "Bug" : "Feature"}</span></span>
                                    <ChevronDown size={14} aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl border-gray-200 dark:border-white/10">
                                <DropdownMenuItem onClick={() => setFilterType("ALL")}>All Types</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType("BUG")}>Bug Reports</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterType("FEATURE")}>Feature Requests</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto shrink-0 justify-between sm:justify-center">
                                    <span>Status: <span className="text-primary">{filterStatus === "ALL" ? "All" : statusOptions.find(s => s.value === filterStatus)?.label}</span></span>
                                    <ChevronDown size={14} aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl border-gray-200 dark:border-white/10">
                                <DropdownMenuItem onClick={() => setFilterStatus("ALL")}>All Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus("OPEN")}>Open</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus("IN_PROGRESS")}>In Progress</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus("RESOLVED")}>Resolved</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus("CLOSED")}>Closed</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-6 text-center text-red-600 dark:text-red-400">
                    <AlertCircle className="mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium">Failed to load feedback</p>
                </div>
            )}

            {/* Empty */}
            {!isLoading && !error && filtered.length === 0 && (
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm text-center py-20">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">No feedback found</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {searchQuery || filterType !== "ALL" || filterStatus !== "ALL"
                            ? "Try adjusting your filters."
                            : "No feedback has been submitted yet."}
                    </p>
                </div>
            )}

            {/* List */}
            {!isLoading && !error && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map((fb) => {
                        const isBug = fb.type === "BUG";
                        const currentStatus = statusOptions.find((s) => s.value === fb.status) || statusOptions[0];
                        const StatusIcon = currentStatus.icon;

                        return (
                            <div
                                key={fb.id}
                                className={cn(
                                    "bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm",
                                    "border-l-4",
                                    isBug ? "border-l-red-500" : "border-l-amber-500"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Type + User */}
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <div className={cn(
                                                "p-1.5 rounded-lg",
                                                isBug ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                            )}>
                                                {isBug ? <Bug size={16} /> : <Lightbulb size={16} />}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                                {isBug ? "Bug Report" : "Feature Request"}
                                            </span>
                                            <span className="text-[11px] text-gray-400">·</span>
                                            <div className="flex items-center gap-1.5">
                                                {fb.user.image && (
                                                    <img src={fb.user.image} alt="" className="w-4 h-4 rounded-full" />
                                                )}
                                                <span className="text-xs text-gray-600 font-medium truncate">
                                                    {fb.user.name || fb.user.email || "Unknown"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Message */}
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {fb.message}
                                        </p>

                                        {/* Time */}
                                        <p className="text-[11px] text-gray-400 mt-2">
                                            {formatDistanceToNow(new Date(fb.createdAt))} ago
                                        </p>
                                    </div>

                                    {/* Status Dropdown */}
                                    <div className="shrink-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className={cn(
                                                    "flex items-center gap-2 h-8 text-xs font-bold px-3",
                                                    currentStatus.color,
                                                    updatingId === fb.id && "opacity-50"
                                                )}>
                                                    <StatusIcon size={12} />
                                                    {currentStatus.label}
                                                    <ChevronDown size={12} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-200 dark:border-white/10">
                                                {statusOptions.map((opt) => (
                                                    <DropdownMenuItem
                                                        key={opt.value}
                                                        onClick={() => handleStatusChange(fb.id, opt.value)}
                                                        className="text-xs font-medium"
                                                    >
                                                        {opt.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
