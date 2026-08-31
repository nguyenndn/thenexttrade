"use client";

import { useState } from "react";
import Link from "next/link";
import {
    X,
    Search,
    Users,
    Mail,
    Copy,
    Check,
    ExternalLink,
    ShieldCheck,
    Sparkles,
    Calendar,
    Activity,
    Bot,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { format } from "date-fns";

export interface ProductActiveUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    image?: string | null;
    accountNumber?: string | null;
    broker?: string | null;
    server?: string | null;
    platform?: string | null;
    status: string;
    grantedAt?: string | null;
    lastUsedAt?: string | null;
}

interface ProductUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        version: string;
        thumbnail?: string | null;
        activeUsers?: ProductActiveUser[];
    } | null;
}

export function ProductUsersModal({
    isOpen,
    onClose,
    product,
}: ProductUsersModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    if (!isOpen || !product) return null;

    const users = product.activeUsers || [];

    const filteredUsers = users.filter((u) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.accountNumber && u.accountNumber.toLowerCase().includes(q)) ||
            (u.broker && u.broker.toLowerCase().includes(q))
        );
    });

    const handleCopyEmail = (email: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        toast.success(`Copied ${email} to clipboard!`);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[#121624] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/75 dark:bg-[#181E32]/75">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 overflow-hidden">
                            {product.thumbnail ? (
                                <img
                                    src={product.thumbnail}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Bot size={20} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    Active Users & Licensees
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {product.name} v{product.version}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Showing all traders with approved access & active MT4/MT5 accounts.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="rounded-xl h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                {/* ── Search & Filter Bar ── */}
                <div className="p-4 sm:px-6 bg-white dark:bg-[#121624] border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, account #..."
                            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Total: <strong className="text-gray-900 dark:text-white">{filteredUsers.length}</strong> {filteredUsers.length === 1 ? "user" : "users"}
                        </span>
                        <Link href={`/admin/trading-systems/${product.id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                            >
                                <span>Manage Product</span>
                                <ExternalLink size={12} />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── User List Table ── */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-3">
                                <Users size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                                {searchQuery ? "No matching traders found" : "No active users yet"}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                                {searchQuery
                                    ? `No traders match "${searchQuery}". Try searching with a different name or email.`
                                    : `When traders connect their MT4/MT5 accounts and are granted access to ${product.name}, they will appear here.`}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-gray-50 dark:bg-[#181E32] sticky top-0 z-10 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                                <tr>
                                    <th className="px-6 py-3">Trader</th>
                                    <th className="px-6 py-3">Trading Account</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Granted Date</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-[#121624]">
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* User Column */}
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden font-bold text-amber-600 dark:text-amber-400 text-xs shadow-sm">
                                                    {user.image ? (
                                                        <img
                                                            src={user.image}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        user.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/admin/users/${user.userId}`}
                                                        className="font-bold text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors truncate block"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                                                        <span className="truncate max-w-[180px]">
                                                            {user.email}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) =>
                                                                handleCopyEmail(user.email, e)
                                                            }
                                                            className="hover:text-amber-500 transition-colors p-0.5"
                                                            title="Copy email"
                                                        >
                                                            {copiedEmail === user.email ? (
                                                                <Check
                                                                    size={11}
                                                                    className="text-emerald-500"
                                                                />
                                                            ) : (
                                                                <Copy size={11} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Trading Account Column */}
                                        <td className="px-6 py-3.5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                                        {user.accountNumber || "—"}
                                                    </span>
                                                    {user.platform && (
                                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                                                            {user.platform}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    {user.broker || "Default Broker"}
                                                    {user.server ? ` · ${user.server}` : ""}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status Column */}
                                        <td className="px-6 py-3.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                <ShieldCheck size={11} />
                                                <span>Active</span>
                                            </span>
                                        </td>

                                        {/* Granted Date Column */}
                                        <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400">
                                            {user.grantedAt ? (
                                                <span title={user.grantedAt}>
                                                    {format(
                                                        new Date(user.grantedAt),
                                                        "dd MMM yyyy"
                                                    )}
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>

                                        {/* Actions Column */}
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <a
                                                    href={`mailto:${user.email}`}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                    title={`Send email to ${user.email}`}
                                                >
                                                    <Mail size={14} />
                                                </a>
                                                <Link
                                                    href={`/admin/users/${user.userId}`}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                    title="View Trader Profile"
                                                >
                                                    <ExternalLink size={14} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Modal Footer ── */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#181E32]">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span>
                            All licenses are actively verified against the MetaTrader bridge.
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl h-9 px-4 text-xs font-semibold"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
