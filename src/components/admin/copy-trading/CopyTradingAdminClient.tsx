"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import {
 Users,
 Clock,
 DollarSign,
 Wifi,
 Search,
 Eye,
 CheckCircle2,
 XCircle,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Registration {
 id: string;
 fullName: string;
 email: string;
 telegramHandle: string | null;
 brokerName: string;
 customBrokerName: string | null;
 mt5Server: string | null;
 customServer: string | null;
 mt5AccountNumber: string;
 tradingCapital: number;
 status: "PENDING" | "APPROVED" | "REJECTED";
 message: string | null;
 createdAt: string;
 user: { name: string | null; email: string | null; image: string | null };
}

interface Props {
 initialRegistrations: Registration[];
 pagination: { currentPage: number; totalPages: number; total: number };
 pendingCount: number;
 stats: {
 totalRegistrations: number;
 approvedCount: number;
 totalCapital: number;
 };
}

const statusConfig = {
 PENDING: { label: "Pending", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20", icon: Clock },
 APPROVED: { label: "Approved", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle2 },
 REJECTED: { label: "Rejected", color: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20", icon: XCircle },
};

export function CopyTradingAdminClient({ initialRegistrations, pagination, pendingCount, stats }: Props) {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();

 const [actionLoading, setActionLoading] = useState<string | null>(null);
 const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

 const handleSearch = useDebouncedCallback((term: string) => {
 const params = new URLSearchParams(searchParams.toString());
 if (term) params.set("q", term); else params.delete("q");
 params.set("page", "1");
 router.replace(`${pathname}?${params.toString()}`);
 }, 300);

 const handleFilterStatus = useCallback((status: string) => {
 const params = new URLSearchParams(searchParams.toString());
 if (status) params.set("status", status); else params.delete("status");
 params.set("page", "1");
 router.replace(`${pathname}?${params.toString()}`);
 }, [searchParams, router, pathname]);

 const handlePageChange = useCallback((newPage: number) => {
 const params = new URLSearchParams(searchParams.toString());
 params.set("page", newPage.toString());
 router.push(`${pathname}?${params.toString()}`);
 }, [searchParams, router, pathname]);

 const handleAction = async (id: string, action: "approve" | "reject") => {
 setActionLoading(id);
 try {
 const res = await fetch(`/api/admin/copy-trading/${id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ action }),
 });

 if (!res.ok) {
 const data = await res.json();
 toast.error(data.error || "Action failed");
 return;
 }

 toast.success(action === "approve" ? "Registration approved!" : "Registration rejected.");
 router.refresh();
 } catch {
 toast.error("Network error");
 } finally {
 setActionLoading(null);
 setConfirmAction(null);
 }
 };

 const brokerDisplay = (reg: Registration) =>
 reg.brokerName === "Any Broker" ? reg.customBrokerName || "Custom" : reg.brokerName;

 const serverDisplay = (reg: Registration) =>
 reg.brokerName === "Any Broker" ? reg.customServer || "—" : reg.mt5Server || "—";

 return (
 <div className="space-y-4">
 {/* Stats */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: "Total Registrations", value: stats.totalRegistrations.toString(), icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/15" },
 { label: "Pending Approval", value: pendingCount.toString(), icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/15" },
 { label: "Approved Accounts", value: stats.approvedCount.toString(), icon: Wifi, color: "text-primary", bg: "bg-primary/10" },
 { label: "Total Capital", value: `$${stats.totalCapital.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
 ].map((stat) => (
 <div key={stat.label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
 <stat.icon size={16} aria-hidden="true" />
 </div>
 <div>
 <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums leading-none">
 {stat.value}
 </p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Toolbar */}
 <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-4">
 <div className="flex flex-1 gap-4 flex-col lg:flex-row justify-between w-full lg:items-center">
 <div className="flex flex-1 gap-2 flex-col sm:flex-row w-full lg:max-w-xl">
 <div className="flex-1 w-full sm:max-w-md">
 <PremiumInput
 icon={Search}
 placeholder="Search name, email, broker..."
 defaultValue={searchParams.get("q")?.toString()}
 onChange={(e) => handleSearch(e.target.value)}
 />
 </div>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="md" className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto shrink-0 justify-between sm:justify-center">
 <span>Status: <span className="text-primary">{searchParams.get("status") || "All"}</span></span>
 <ChevronDown size={14} aria-hidden="true" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-200 dark:border-white/10">
 <DropdownMenuItem onClick={() => handleFilterStatus("")}>All Status</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleFilterStatus("PENDING")}>Pending</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleFilterStatus("APPROVED")}>Approved</DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleFilterStatus("REJECTED")}>Rejected</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </div>

 {/* Table */}
 <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
 <div className="overflow-x-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-xs uppercase text-gray-600 font-bold tracking-wider">
 <th className="px-6 py-5">User</th>
 <th className="px-6 py-5">Telegram</th>
 <th className="px-6 py-5">Broker / MT5</th>
 <th className="px-6 py-5">Capital</th>
 <th className="px-6 py-5">Status</th>
 <th className="px-6 py-5">Date</th>
 <th className="px-6 py-5 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200 dark:divide-white/10">
 {initialRegistrations.length === 0 && (
 <tr>
 <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">
 No registrations found.
 </td>
 </tr>
 )}
 {initialRegistrations.map((reg) => {
 const sc = statusConfig[reg.status];
 const isLoading = actionLoading === reg.id;
 return (
 <tr key={reg.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
 <td className="px-6 py-5">
 <div className="font-bold text-sm text-gray-700 dark:text-white">{reg.fullName}</div>
 <div className="text-xs text-gray-500 dark:text-gray-400">{reg.email}</div>
 </td>
 <td className="px-6 py-5 text-sm text-blue-500 font-medium">{reg.telegramHandle || "—"}</td>
 <td className="px-6 py-5">
 <div className="text-sm font-bold text-gray-700 dark:text-white">{brokerDisplay(reg)}</div>
 <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{reg.mt5AccountNumber}</div>
 <div className="text-[10px] text-gray-400">{serverDisplay(reg)}</div>
 </td>
 <td className="px-6 py-5 text-sm font-bold text-gray-700 dark:text-white">${reg.tradingCapital.toLocaleString()}</td>
 <td className="px-6 py-5">
 <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${sc.color}`}>
 <sc.icon size={12} /> {sc.label}
 </span>
 </td>
 <td className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300">
 {new Date(reg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
 </td>
 <td className="px-6 py-5 text-right">
 <div className="flex items-center justify-end gap-1">
 <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors" title="View Details">
 <Eye size={14} />
 </button>
 {reg.status === "PENDING" && (
 <>
 <button
 onClick={() => handleAction(reg.id, "approve")}
 disabled={isLoading}
 className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500 transition-colors disabled:opacity-50"
 title="Approve"
 >
 {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
 </button>
 <button
 onClick={() => setConfirmAction({ id: reg.id, action: "reject" })}
 disabled={isLoading}
 className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
 title="Reject"
 >
 <XCircle size={14} />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Footer / Pagination */}
 <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
 <div className="text-xs text-gray-600">
 Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
 </div>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="icon"
 onClick={() => handlePageChange(pagination.currentPage - 1)}
 disabled={pagination.currentPage <= 1}
 className="p-2 h-auto w-auto bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50"
 >
 <ChevronLeft size={16} />
 </Button>
 <Button
 variant="outline"
 size="icon"
 onClick={() => handlePageChange(pagination.currentPage + 1)}
 disabled={pagination.currentPage >= pagination.totalPages}
 className="p-2 h-auto w-auto bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50"
 >
 <ChevronRight size={16} />
 </Button>
 </div>
 </div>
 </div>

 {/* Reject Confirmation */}
 <ConfirmDialog
 isOpen={!!confirmAction}
 title="Reject Registration"
 description="Are you sure you want to reject this copy trading registration? The user will be notified."
 confirmText="Reject"
 cancelText="Cancel"
 isLoading={!!actionLoading}
 onConfirm={() => confirmAction && handleAction(confirmAction.id, "reject")}
 onCancel={() => setConfirmAction(null)}
 variant="danger"
 />
 </div>
 );
}
