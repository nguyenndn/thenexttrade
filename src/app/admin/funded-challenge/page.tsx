"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
    Users,
    DollarSign,
    Trophy,
    Search,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    MoreVertical,
    Download,
    Target,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChallengeParticipant {
    id: string;
    userName: string;
    email: string;
    tier: "Starter" | "Standard" | "Professional" | "Elite";
    accountSize: string;
    currentBalance: number;
    profitTarget: number;
    currentProfit: number;
    maxDrawdownUsed: number;
    status: "ACTIVE" | "PASSED" | "FAILED" | "PENDING_PAYMENT";
    startDate: string;
    daysTraded: number;
}

const mockParticipants: ChallengeParticipant[] = [
    { id: "1", userName: "Nguyen Van A", email: "a@gmail.com", tier: "Standard", accountSize: "$25,000", currentBalance: 26200, profitTarget: 8, currentProfit: 4.8, maxDrawdownUsed: 3.2, status: "ACTIVE", startDate: "2026-03-20", daysTraded: 14 },
    { id: "2", userName: "Tran Minh B", email: "b@gmail.com", tier: "Professional", accountSize: "$50,000", currentBalance: 54100, profitTarget: 8, currentProfit: 8.2, maxDrawdownUsed: 1.5, status: "PASSED", startDate: "2026-03-01", daysTraded: 22 },
    { id: "3", userName: "Le Hoang C", email: "c@gmail.com", tier: "Elite", accountSize: "$100,000", currentBalance: 89500, profitTarget: 8, currentProfit: -10.5, maxDrawdownUsed: 10.5, status: "FAILED", startDate: "2026-03-10", daysTraded: 18 },
    { id: "4", userName: "Pham D", email: "d@gmail.com", tier: "Starter", accountSize: "$10,000", currentBalance: 10000, profitTarget: 8, currentProfit: 0, maxDrawdownUsed: 0, status: "PENDING_PAYMENT", startDate: "2026-04-01", daysTraded: 0 },
    { id: "5", userName: "Vu E", email: "e@gmail.com", tier: "Standard", accountSize: "$25,000", currentBalance: 26800, profitTarget: 8, currentProfit: 7.2, maxDrawdownUsed: 4.1, status: "ACTIVE", startDate: "2026-03-15", daysTraded: 19 },
];

const statusConfig = {
    ACTIVE: { label: "Active", color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: TrendingUp },
    PASSED: { label: "Passed", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
    FAILED: { label: "Failed", color: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
    PENDING_PAYMENT: { label: "Pending", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock },
};

const tierColors: Record<string, string> = {
    Starter: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Standard: "bg-primary/10 text-primary",
    Professional: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Elite: "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white",
};

export default function AdminFundedChallengePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PASSED" | "FAILED" | "PENDING_PAYMENT">("ALL");

    const filtered = mockParticipants
        .filter((p) => filterStatus === "ALL" || p.status === filterStatus)
        .filter((p) => p.userName.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const activeCount = mockParticipants.filter((p) => p.status === "ACTIVE").length;
    const passedCount = mockParticipants.filter((p) => p.status === "PASSED").length;
    const totalRevenue = mockParticipants.filter((p) => p.status !== "PENDING_PAYMENT").length * 249;

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Funded Challenge Management"
                description="Track participants, monitor progress, and manage challenge accounts."
            >
                <Button variant="outline" className="flex items-center gap-2 text-sm font-bold">
                    <Download size={14} /> Export CSV
                </Button>
            </AdminPageHeader>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Participants", value: mockParticipants.length.toString(), icon: Users, color: "text-blue-500" },
                    { label: "Active Challenges", value: activeCount.toString(), icon: Target, color: "text-primary" },
                    { label: "Passed (Funded)", value: passedCount.toString(), icon: Trophy, color: "text-amber-500" },
                    { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon size={14} className={stat.color} />
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-black text-gray-700 dark:text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex gap-2 flex-wrap">
                    {(["ALL", "ACTIVE", "PASSED", "FAILED", "PENDING_PAYMENT"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${
                                filterStatus === s ? "bg-primary/10 text-primary" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                        >
                            {s === "PENDING_PAYMENT" ? "PENDING" : s}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name or email..."
                        className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">User</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">Tier</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 text-right">Balance</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 text-right">Progress</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 text-right">DD Used</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">Days</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">Status</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                            {filtered.map((p) => {
                                const sc = statusConfig[p.status];
                                const progressPct = Math.min(100, Math.max(0, (p.currentProfit / p.profitTarget) * 100));
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-bold text-sm text-gray-700 dark:text-white">{p.userName}</div>
                                            <div className="text-[11px] text-gray-400">{p.email}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${tierColors[p.tier]}`}>
                                                {p.tier}
                                            </span>
                                            <div className="text-[11px] text-gray-400 mt-0.5">{p.accountSize}</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-sm text-gray-700 dark:text-white">
                                            ${p.currentBalance.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${p.currentProfit >= 0 ? "bg-primary" : "bg-red-500"}`}
                                                        style={{ width: `${Math.max(0, progressPct)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold ${p.currentProfit >= 0 ? "text-primary" : "text-red-500"}`}>
                                                    {p.currentProfit >= 0 ? "+" : ""}{p.currentProfit.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className={`text-xs font-bold ${p.maxDrawdownUsed > 8 ? "text-red-500" : p.maxDrawdownUsed > 5 ? "text-amber-500" : "text-gray-500 dark:text-gray-400"}`}>
                                                {p.maxDrawdownUsed.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{p.daysTraded}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${sc.color}`}>
                                                <sc.icon size={11} /> {sc.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600">
                                                    <Eye size={14} />
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                                                    <MoreVertical size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
