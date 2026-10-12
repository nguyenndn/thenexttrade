"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Mail,
  Search,
  CheckCircle2,
  ExternalLink,
  Eye,
  Inbox,
  Clock,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { MessagesStatsGrid } from "./MessagesStatsGrid";
import { LetterDetailModal } from "./LetterDetailModal";
import {
  fetchAdminMessagesData,
  updateContactMessageStatus,
  deleteContactMessage,
  type ContactMessageRecord,
  type AdminMessagesStats,
  type MessageStatus,
} from "@/actions/admin/messages";

interface AdminMessagesClientProps {
  initialMessages: ContactMessageRecord[];
  initialStats: AdminMessagesStats;
  initialTotal: number;
}

type TabType = "all" | "new" | "read" | "replied" | "archived";

export function AdminMessagesClient({
  initialMessages,
  initialStats,
  initialTotal: _initialTotal,
}: AdminMessagesClientProps) {
  const [messages, setMessages] = useState<ContactMessageRecord[]>(initialMessages);
  const [stats, setStats] = useState<AdminMessagesStats>(initialStats);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadData = async (tab = activeTab, search = searchTerm) => {
    const res = await fetchAdminMessagesData({
      status: tab === "all" ? undefined : tab,
      search: search || undefined,
    });
    if (res.success && res.data) {
      setMessages(res.data.messages);
      setStats(res.data.stats);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    startTransition(async () => {
      await reloadData(tab, searchTerm);
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await reloadData(activeTab, searchTerm);
    });
  };

  const handleStatusChange = async (
    id: string,
    newStatus: MessageStatus,
    notes?: string
  ) => {
    const res = await updateContactMessageStatus(id, newStatus, notes);
    if (res.success) {
      toast.success(`Message marked as ${newStatus}`);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus, notes: notes ?? m.notes } : m))
      );
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) =>
          prev ? { ...prev, status: newStatus, notes: notes ?? prev.notes } : null
        );
      }
      startTransition(async () => {
        await reloadData();
      });
    } else {
      toast.error(res.error || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteContactMessage(id);
    if (res.success) {
      toast.success("Inquiry deleted successfully");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      startTransition(async () => {
        await reloadData();
      });
    } else {
      toast.error(res.error || "Failed to delete message");
    }
  };

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    const term = searchTerm.toLowerCase();
    return messages.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.subject.toLowerCase().includes(term) ||
        m.message.toLowerCase().includes(term)
    );
  }, [messages, searchTerm]);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "All Inquiries", count: stats.total },
    { key: "new", label: "New", count: stats.newCount },
    { key: "read", label: "Read", count: stats.readCount },
    { key: "replied", label: "Replied", count: stats.repliedCount },
    { key: "archived", label: "Archived", count: stats.archivedCount },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-gold border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            New
          </span>
        );
      case "replied":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={10} />
            Replied
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-500 border border-gray-500/20">
            <Archive size={10} />
            Archived
          </span>
        );
      case "read":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock size={10} />
            Read
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <MessagesStatsGrid stats={stats} />

      {/* Control Bar: Filter Tabs + Search */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161922] p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                variant={isActive ? "primary" : "outline"}
                size="sm"
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-lg text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? "bg-gold hover:bg-amber-600 text-white border-transparent"
                    : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] md:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search inquiries..."
            aria-label="Search inquiries"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-gray-50/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </form>
      </div>

      {/* Messages Table Container */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161922] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400 select-none">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Subject & Correspondence</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 space-y-2">
                    <Inbox size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                    <div className="font-bold text-gray-600 dark:text-gray-300 text-sm">
                      No correspondence found
                    </div>
                    <div className="text-xs">
                      {searchTerm ? "Try searching with different keywords" : "No messages in this folder"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                      msg.status === "new" ? "bg-amber-50/30 dark:bg-gold/[0.02]" : ""
                    }`}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (msg.status === "new") {
                        handleStatusChange(msg.id, "read");
                      }
                    }}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(msg.status)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {msg.name}
                      </div>
                      <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                        {msg.email}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      <div className="font-bold text-gray-900 dark:text-gray-100 truncate">
                        {msg.subject}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {msg.message}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </td>

                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (msg.status === "new") {
                              handleStatusChange(msg.id, "read");
                            }
                          }}
                          className="rounded-lg border-gray-200 dark:border-white/10 text-xs font-bold gap-1 px-2.5"
                          aria-label={`View inquiry from ${msg.name}`}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </Button>

                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-lg bg-gold hover:bg-amber-600 text-white font-bold text-xs gap-1 px-2.5"
                            aria-label={`Reply to ${msg.email}`}
                          >
                            <Mail size={12} />
                            <span>Reply</span>
                            <ExternalLink size={10} className="opacity-70" />
                          </Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Letter Inspection Modal */}
      <LetterDetailModal
        message={selectedMessage}
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
