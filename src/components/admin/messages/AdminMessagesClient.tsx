"use client";

import { useState, useTransition, useMemo } from "react";
import {
    Archive,
    CheckCircle2,
    Clock,
    Inbox,
    Mail,
    Search,
    X,
    type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import { MessagesStatsGrid } from "./MessagesStatsGrid";
import { MessagesTable } from "./MessagesTable";
import { LetterDetailModal } from "./LetterDetailModal";
import {
    fetchAdminMessagesData,
    updateContactMessageStatus,
    saveContactMessageNotes,
    replyToContactMessage,
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
    const [messages, setMessages] =
        useState<ContactMessageRecord[]>(initialMessages);
    const [stats, setStats] = useState<AdminMessagesStats>(initialStats);
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMessage, setSelectedMessage] =
        useState<ContactMessageRecord | null>(null);
    const [openInReplyMode, setOpenInReplyMode] = useState(false);
    const [, startTransition] = useTransition();

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

    const handleTabChange = (nextTabValue: string) => {
        const tab = nextTabValue as TabType;
        setActiveTab(tab);
        startTransition(async () => {
            await reloadData(tab, searchTerm);
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            await reloadData(activeTab, searchTerm);
        });
    };

    const handleOpenMessage = (
        msg: ContactMessageRecord,
        openReply = false
    ) => {
        setOpenInReplyMode(openReply);
        setSelectedMessage(msg);
        if (msg.status === "new") {
            void handleStatusChange(msg.id, "read", undefined, true);
        }
    };

    const handleStatusChange = async (
        id: string,
        newStatus: MessageStatus,
        notes?: string,
        silent = false
    ) => {
        const res = await updateContactMessageStatus(id, newStatus, notes);
        if (res.success) {
            if (!silent) {
                toast.success(`Message marked as ${newStatus}`);
            }
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === id
                        ? { ...m, status: newStatus, notes: notes ?? m.notes }
                        : m
                )
            );
            setSelectedMessage((prev) =>
                prev && prev.id === id
                    ? { ...prev, status: newStatus, notes: notes ?? prev.notes }
                    : prev
            );
            startTransition(async () => {
                await reloadData();
            });
        } else {
            toast.error(res.error || "Failed to update status");
        }
    };

    const handleSaveNotes = async (id: string, notes: string) => {
        const res = await saveContactMessageNotes(id, notes);
        if (res.success) {
            toast.success("Admin notes saved");
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, notes } : m))
            );
            setSelectedMessage((prev) =>
                prev && prev.id === id ? { ...prev, notes } : prev
            );
        } else {
            toast.error(res.error || "Failed to save admin notes");
        }
    };

    const handleSendReply = async (
        id: string,
        subject: string,
        replyMessage: string
    ): Promise<boolean> => {
        const res = await replyToContactMessage({ id, subject, replyMessage });
        if (res.success) {
            toast.success("Email reply sent via mail server");
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, status: "replied" } : m))
            );
            setSelectedMessage((prev) =>
                prev && prev.id === id ? { ...prev, status: "replied" } : prev
            );
            startTransition(async () => {
                await reloadData();
            });
            return true;
        }
        toast.error(res.error || "Failed to send email reply");
        return false;
    };

    const handleDelete = async (id: string) => {
        const res = await deleteContactMessage(id);
        if (res.success) {
            toast.success("Message deleted successfully");
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

    const tabs: {
        key: TabType;
        label: string;
        count: number;
        icon: LucideIcon;
    }[] = [
        { key: "all", label: "All Messages", count: stats.total, icon: Inbox },
        { key: "new", label: "New", count: stats.newCount, icon: Mail },
        { key: "read", label: "Read", count: stats.readCount, icon: Clock },
        {
            key: "replied",
            label: "Replied",
            count: stats.repliedCount,
            icon: CheckCircle2,
        },
        {
            key: "archived",
            label: "Archived",
            count: stats.archivedCount,
            icon: Archive,
        },
    ];

    return (
        <div className="space-y-6">
            <MessagesStatsGrid stats={stats} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    tabsId="admin-messages-tabs"
                    className="w-full lg:w-auto"
                >
                    <div className="overflow-x-auto scrollbar-hide flex">
                        <TabsList className="shrink-0">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;
                                return (
                                    <TabsTrigger
                                        key={tab.key}
                                        value={tab.key}
                                        className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                                        activeIndicatorClassName="!bg-gold shadow-sm shadow-amber-500/20 border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <Icon
                                            size={15}
                                            className={cn(
                                                isActive
                                                    ? "text-white"
                                                    : "text-gray-400 dark:text-gray-500"
                                            )}
                                        />
                                        <span className="whitespace-nowrap">
                                            {tab.label}
                                        </span>
                                        <span
                                            className={cn(
                                                "text-[11px] px-2 py-0.5 rounded-lg font-mono font-bold tabular-nums transition-colors",
                                                isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                            )}
                                        >
                                            {tab.count}
                                        </span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>
                </Tabs>

                <form
                    onSubmit={handleSearchSubmit}
                    className="w-full lg:w-80 shrink-0"
                >
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#1E2028] rounded-lg border border-gray-200 dark:border-white/10 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 transition-all w-full h-[38px] shadow-sm">
                        <Search
                            size={15}
                            className="text-gray-400 shrink-0"
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search messages"
                            className="bg-transparent text-xs font-medium focus:outline-none w-full text-gray-900 dark:text-white"
                        />
                        {searchTerm && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSearchTerm("");
                                    startTransition(async () => {
                                        await reloadData(activeTab, "");
                                    });
                                }}
                                aria-label="Clear search"
                                className="h-auto w-auto p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={14} />
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            <MessagesTable
                messages={filteredMessages}
                searchTerm={searchTerm}
                onOpenMessage={handleOpenMessage}
            />

            <LetterDetailModal
                message={selectedMessage}
                isOpen={!!selectedMessage}
                initialReplyOpen={openInReplyMode}
                onClose={() => {
                    setSelectedMessage(null);
                    setOpenInReplyMode(false);
                }}
                onStatusChange={handleStatusChange}
                onSaveNotes={handleSaveNotes}
                onSendReply={handleSendReply}
                onDelete={handleDelete}
            />
        </div>
    );
}
