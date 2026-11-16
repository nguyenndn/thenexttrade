"use client";

import {
    Archive,
    CheckCircle2,
    Clock,
    Eye,
    Inbox,
    Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import type { ContactMessageRecord } from "@/actions/admin/messages";

interface MessagesTableProps {
    messages: ContactMessageRecord[];
    searchTerm: string;
    onOpenMessage: (msg: ContactMessageRecord, openReply?: boolean) => void;
}

function getStatusBadge(status: string) {
    switch (status.toLowerCase()) {
        case "new":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-gold border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    New
                </span>
            );
        case "replied":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={10} />
                    Replied
                </span>
            );
        case "archived":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-500 border border-gray-500/20">
                    <Archive size={10} />
                    Archived
                </span>
            );
        case "read":
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-amber-600 dark:text-gold border border-gold/20">
                    <Clock size={10} />
                    Read
                </span>
            );
    }
}

export function MessagesTable({
    messages,
    searchTerm,
    onOpenMessage,
}: MessagesTableProps) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-500 select-none">
                        <tr>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4">Sender</th>
                            <th className="py-3.5 px-4">Subject &amp; Message</th>
                            <th className="py-3.5 px-4">Received</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {messages.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-14 text-center text-gray-400 space-y-2"
                                >
                                    <Inbox
                                        size={32}
                                        className="mx-auto text-gray-300 dark:text-gray-600"
                                    />
                                    <div className="font-bold text-gray-600 dark:text-gray-300 text-sm">
                                        No messages found
                                    </div>
                                    <div className="text-xs">
                                        {searchTerm
                                            ? "Try searching with different keywords"
                                            : "No messages in this folder"}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            messages.map((msg) => (
                                <tr
                                    key={msg.id}
                                    className={`hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                                        msg.status === "new"
                                            ? "bg-amber-50/30 dark:bg-gold/[0.02]"
                                            : ""
                                    }`}
                                    onClick={() => onOpenMessage(msg, false)}
                                >
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        {getStatusBadge(msg.status)}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {msg.name}
                                        </div>
                                        <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                                            {msg.email}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 max-w-md">
                                        <div className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                            {msg.subject}
                                        </div>
                                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                            {msg.message}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono tabular-nums text-gray-500 dark:text-gray-400">
                                        {formatDistanceToNow(
                                            new Date(msg.createdAt),
                                            { addSuffix: true }
                                        )}
                                    </td>
                                    <td
                                        className="py-3.5 px-4 text-right whitespace-nowrap"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    onOpenMessage(msg, false)
                                                }
                                                className="border-gray-200 dark:border-white/10 text-xs font-bold gap-1 px-2.5"
                                                aria-label={`View message from ${msg.name}`}
                                            >
                                                <Eye size={13} />
                                                <span>View</span>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                onClick={() =>
                                                    onOpenMessage(msg, true)
                                                }
                                                className="!text-white text-xs font-bold gap-1 px-2.5"
                                                aria-label={`Reply via email to ${msg.email}`}
                                            >
                                                <Mail size={13} />
                                                <span>Reply</span>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
