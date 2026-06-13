"use client";

import { useState, useTransition } from "react";
import {
 Crown,
 Clock,
 CheckCircle2,
 XCircle,
 ShieldOff,
 Timer,
 Eye,
 ChevronDown,
 Trash2,
 Search,
 Users,
 AlertTriangle,
 X,
 Loader2,
 Send,
 Image as ImageIcon,
 MoreHorizontal,
} from "lucide-react";
import {
 approveVipRequest,
 rejectVipRequest,
 deleteVipRequest,
 grantGracePeriod,
 revokeProAccess,
} from "@/actions/vip-request";
import { Button } from "@/components/ui/Button";
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { toast } from "sonner";

interface VipRequest {
 id: string;
 userId: string;
 tradingAccountId: string | null;
 broker: string;
 accountNumber: string;
 balance: string;
 email: string;
 telegramId: string;
 fullName: string | null;
 country: string | null;
 screenshotUrl: string | null;
 status: string;
 rejectReason: string | null;
 reviewedBy: string | null;
 reviewedAt: string | null;
 createdAt: string;
 user: {
 name: string | null;
 email: string | null;
 image: string | null;
 };
}

interface Props {
 requests: VipRequest[];
 total: number;
 stats: { total: number; pending: number; approved: number; rejected: number } | null;
}

export function VipPipelineClient({ requests: initialRequests, total, stats }: Props) {
 const [requests, setRequests] = useState(initialRequests);
 const [isPending, startTransition] = useTransition();
 const [filter, setFilter] = useState<string>("ALL");
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedRequest, setSelectedRequest] = useState<VipRequest | null>(null);
 const [rejectModalId, setRejectModalId] = useState<string | null>(null);
 const [rejectReason, setRejectReason] = useState("");
 const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

 const filtered = requests.filter((r) => {
 const matchStatus = filter === "ALL" || r.status === filter;
 const searchLower = searchQuery.toLowerCase();
 const matchSearch =
 searchQuery === "" ||
 r.telegramId.toLowerCase().includes(searchLower) ||
 r.email.toLowerCase().includes(searchLower) ||
 (r.fullName && r.fullName.toLowerCase().includes(searchLower)) ||
 (r.user.name && r.user.name.toLowerCase().includes(searchLower)) ||
 r.accountNumber.includes(searchQuery);
 return matchStatus && matchSearch;
 });

 const handleApprove = (id: string) => {
 startTransition(async () => {
 const result = await approveVipRequest(id);
 if (result.success) {
 setRequests((prev) =>
 prev.map((r) =>
 r.id === id
 ? { ...r, status: "APPROVED", reviewedAt: new Date().toISOString() }
 : r
 )
 );
 setSelectedRequest(null);
 toast.success("VIP request approved & Pro access granted");
 } else {
 toast.error(result.error || "Failed to approve request. Check server logs.");
 }
 });
 };

 const handleReject = (id: string) => {
 if (!rejectReason.trim()) return;
 startTransition(async () => {
 const result = await rejectVipRequest(id, rejectReason);
 if (result.success) {
 setRequests((prev) =>
 prev.map((r) =>
 r.id === id
 ? { ...r, status: "REJECTED", rejectReason, reviewedAt: new Date().toISOString() }
 : r
 )
 );
 setRejectModalId(null);
 setRejectReason("");
 setSelectedRequest(null);
 toast.success("Request rejected");
 }
 });
 };

 const handleGrace = (userId: string, tradingAccountId?: string | null) => {
 startTransition(async () => {
 const result = await grantGracePeriod(userId, 14, tradingAccountId || undefined);
 if (result.success) toast.success("14-day grace period granted");
 });
 };

 const handleRevoke = (userId: string, tradingAccountId?: string | null) => {
 startTransition(async () => {
 const result = await revokeProAccess(userId, undefined, tradingAccountId || undefined);
 if (result.success) toast.success("Pro access revoked");
 });
 };

 const handleDelete = () => {
 if (!deleteModalId) return;
 startTransition(async () => {
 const result = await deleteVipRequest(deleteModalId);
 if (result.success) {
 setRequests((prev) => prev.filter((r) => r.id !== deleteModalId));
 if (selectedRequest?.id === deleteModalId) setSelectedRequest(null);
 toast.success("Request deleted");
 setDeleteModalId(null);
 } else {
 toast.error(result.error || "Failed to delete");
 }
 });
 };

 const statusBadge = (status: string) => {
 switch (status) {
 case "PENDING":
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">
 <Clock size={10} /> Pending
 </span>
 );
 case "APPROVED":
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20">
 <CheckCircle2 size={10} /> Approved
 </span>
 );
 case "REJECTED":
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20">
 <XCircle size={10} /> Rejected
 </span>
 );
 }
 };

 return (
 <div className="space-y-6 pb-10">
 {/* Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-dashboard pb-8">
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-8 bg-primary rounded-full" />
 <h1 className="text-xl font-black text-gray-700 dark:text-white tracking-tighter">
 VIP Pipeline
 </h1>
 </div>
 <p className="text-base text-gray-600 dark:text-gray-300 font-medium pl-4.5">
 Review and manage VIP verification requests
 </p>
 </div>
 </div>

 {/* Stats Cards */}
 {stats && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <AnimatedStatCard title="Total Requests" value={stats.total} icon={Users} color="blue" index={0} trendPercent={null} />
 <AnimatedStatCard title="Pending" value={stats.pending} icon={Clock} color="amber" index={1} trendPercent={null} />
 <AnimatedStatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="green" index={2} trendPercent={null} />
 <AnimatedStatCard title="Rejected" value={stats.rejected} icon={XCircle} color="cyan" index={3} trendPercent={null} />
 </div>
 )}

 {/* Toolbar */}
 <div className="bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl p-4 shadow-sm flex items-center gap-4">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="md"
 className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0 justify-between"
 >
 <span>
 Status:{" "}
 <span className="text-primary">
 {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
 </span>
 </span>
 <ChevronDown size={14} />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-40 rounded-xl border-dashboard">
 {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
 <DropdownMenuItem
 key={f}
 onClick={() => setFilter(f)}
 className="font-medium cursor-pointer rounded-lg mx-1 my-0.5"
 >
 {f === "ALL" ? `All (${total})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${stats?.[f.toLowerCase() as keyof typeof stats] || 0})`}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <div className="flex-1 w-full sm:max-w-sm">
 <PremiumInput
 icon={Search}
 placeholder="Search Telegram, email, account..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>

 <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
 Showing {filtered.length} request{filtered.length !== 1 ? "s" : ""}
 </div>
 </div>

 {/* Table */}
 <div className="bg-white dark:bg-[#151925] border border-dashboard rounded-xl overflow-hidden shadow-sm">
 {filtered.length === 0 ? (
 <div className="text-center py-16">
 <AlertTriangle size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
 <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No requests found</p>
 </div>
 ) : (
 <div className="overflow-x-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-dashboard text-xs uppercase text-gray-600 dark:text-gray-400 font-bold tracking-wider">
 <th className="px-6 py-4">User</th>
 <th className="px-6 py-4">Broker</th>
 <th className="px-6 py-4">Account</th>
 <th className="px-6 py-4">Balance</th>
 <th className="px-6 py-4">Telegram</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4">Date</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-dashboard">
 {filtered.map((req) => (
 <tr key={req.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
 <td className="px-6 py-4">
 <div>
 <p className="font-bold text-sm text-gray-700 dark:text-white truncate max-w-[160px]">
 {req.user.name || req.fullName || "-"}
 </p>
 <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{req.email}</p>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">{req.broker}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{req.accountNumber}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">${req.balance}</span>
 </td>
 <td className="px-6 py-4">
 <a
 href={`https://t.me/${req.telegramId.replace("@", "")}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-[#2AABEE] hover:underline font-medium"
 >
 {req.telegramId}
 </a>
 </td>
 <td className="px-6 py-4">{statusBadge(req.status)}</td>
 <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
 {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-end">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" aria-label="Actions" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors border-none bg-transparent hover:bg-gray-100 dark:hover:bg-white/10">
 <MoreHorizontal size={18} />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48 rounded-xl border-dashboard bg-white dark:bg-[#0B0E14] shadow-lg">
 <DropdownMenuItem onClick={() => setSelectedRequest(req)} className="font-medium cursor-pointer rounded-lg mx-1 my-1 outline-none focus:bg-gray-100 dark:focus:bg-white/10">
 <Eye size={14} className="mr-2 text-gray-500" /> View Details
 </DropdownMenuItem>
 {req.status === "PENDING" && (
 <>
 <DropdownMenuItem onClick={() => handleApprove(req.id)} disabled={isPending} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-500/10 font-medium cursor-pointer rounded-lg mx-1 my-1 outline-none">
 <CheckCircle2 size={14} className="mr-2" /> Approve & Grant Pro
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleGrace(req.userId, req.tradingAccountId)} disabled={isPending} className="text-purple-600 focus:text-purple-700 focus:bg-purple-50 dark:focus:bg-purple-500/10 font-medium cursor-pointer rounded-lg mx-1 my-1 outline-none">
 <Timer size={14} className="mr-2" /> Grant 14d Grace
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setRejectModalId(req.id)} disabled={isPending} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 dark:focus:bg-amber-500/10 font-medium cursor-pointer rounded-lg mx-1 my-1 outline-none">
 <XCircle size={14} className="mr-2" /> Reject
 </DropdownMenuItem>
 </>
 )}
 {req.status === "APPROVED" && (
 <DropdownMenuItem onClick={() => handleRevoke(req.userId, req.tradingAccountId)} disabled={isPending} className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 font-medium cursor-pointer rounded-lg mx-1 my-1 outline-none">
 <ShieldOff size={14} className="mr-2" /> Revoke Pro
 </DropdownMenuItem>
 )}
 <DropdownMenuItem onClick={() => setDeleteModalId(req.id)} disabled={isPending} className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 font-medium cursor-pointer rounded-lg mx-1 my-1 outline-none">
 <Trash2 size={14} className="mr-2" /> Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Detail Modal */}
 {selectedRequest && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <div className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-dashboard shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
 <div className="flex items-center justify-between p-4 border-b border-dashboard">
 <h3 className="text-sm font-bold text-gray-800 dark:text-white">Request Details</h3>
 <button onClick={() => setSelectedRequest(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" aria-label="Close modal">
 <X size={16} />
 </button>
 </div>
 <div className="p-4 space-y-3">
 {[
 { label: "User", value: selectedRequest.user.name || "-" },
 { label: "Email", value: selectedRequest.email },
 { label: "Broker", value: selectedRequest.broker },
 { label: "Account #", value: selectedRequest.accountNumber },
 { label: "Balance", value: `$${selectedRequest.balance} USD` },
 { label: "Telegram", value: selectedRequest.telegramId },
 ...(selectedRequest.fullName ? [{ label: "Full Name", value: selectedRequest.fullName }] : []),
 ...(selectedRequest.country ? [{ label: "Country", value: selectedRequest.country }] : []),
 ].map((row) => (
 <div key={row.label} className="flex items-center justify-between">
 <span className="text-xs text-gray-500 dark:text-gray-400">{row.label}</span>
 <span className="text-sm font-medium text-gray-800 dark:text-white">{row.value}</span>
 </div>
 ))}

 {selectedRequest.screenshotUrl && (
 <div className="pt-2">
 <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Screenshot</p>
 <a href={selectedRequest.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
 <ImageIcon size={12} /> View Screenshot
 </a>
 </div>
 )}

 {selectedRequest.rejectReason && (
 <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-xs text-red-700 dark:text-red-300">
 <strong>Reject Reason:</strong> {selectedRequest.rejectReason}
 </div>
 )}

 <div className="flex items-center justify-between pt-2">
 <div>{statusBadge(selectedRequest.status)}</div>
 {selectedRequest.status === "PENDING" && (
 <div className="flex items-center gap-2">
 <Button onClick={() => handleApprove(selectedRequest.id)} disabled={isPending} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
 {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
 </Button>
 <Button onClick={() => handleGrace(selectedRequest.userId, selectedRequest.tradingAccountId)} disabled={isPending} variant="outline" className="text-xs px-3 py-1.5 rounded-lg font-bold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20">
 <Timer size={12} /> Grace
 </Button>
 <Button onClick={() => { setRejectModalId(selectedRequest.id); setSelectedRequest(null); }} variant="outline" className="text-xs px-3 py-1.5 rounded-lg font-bold text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20">
 <XCircle size={12} /> Reject
 </Button>
 </div>
 )}
 </div>

 <a
 href={`https://t.me/${selectedRequest.telegramId.replace("@", "")}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold rounded-xl text-white transition-all hover:opacity-90"
 style={{ backgroundColor: "#2AABEE" }}
 >
 <Send size={14} /> Message on Telegram
 </a>
 </div>
 </div>
 </div>
 )}

 {/* Reject Modal */}
 {rejectModalId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <div className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-dashboard shadow-2xl w-full max-w-sm">
 <div className="flex items-center justify-between p-4 border-b border-dashboard">
 <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Reject Request</h3>
 <button onClick={() => { setRejectModalId(null); setRejectReason(""); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" aria-label="Close">
 <X size={16} />
 </button>
 </div>
 <div className="p-4 space-y-3">
 <textarea
 value={rejectReason}
 onChange={(e) => setRejectReason(e.target.value)}
 placeholder="Enter rejection reason..."
 rows={3}
 className="w-full px-3 py-2.5 text-sm rounded-xl border border-dashboard bg-white dark:bg-[#151925] text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none"
 />
 <div className="flex items-center gap-2 justify-end">
 <Button onClick={() => { setRejectModalId(null); setRejectReason(""); }} variant="outline" className="text-xs px-3 py-1.5 rounded-lg font-bold">
 Cancel
 </Button>
 <Button onClick={() => handleReject(rejectModalId)} disabled={isPending || !rejectReason.trim()} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50">
 {isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
 </Button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Delete Confirm */}
 <ConfirmDialog
 isOpen={!!deleteModalId}
 title="Delete VIP Request"
 description="Are you sure you want to delete this VIP request? This action cannot be undone."
 confirmText="Delete"
 cancelText="Cancel"
 isLoading={isPending}
 onConfirm={handleDelete}
 onCancel={() => setDeleteModalId(null)}
 variant="danger"
 />
 </div>
 );
}
