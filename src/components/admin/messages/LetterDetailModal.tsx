"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    Mail,
    User,
    Trash2,
    CheckCircle2,
    Archive,
    MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MessageAdminNotesSection } from "./MessageAdminNotesSection";
import { MessageReplyComposer } from "./MessageReplyComposer";
import type {
    ContactMessageRecord,
    MessageStatus,
} from "@/actions/admin/messages";

interface LetterDetailModalProps {
    message: ContactMessageRecord | null;
    isOpen: boolean;
    initialReplyOpen?: boolean;
    onClose: () => void;
    onStatusChange: (
        id: string,
        newStatus: MessageStatus,
        notes?: string
    ) => Promise<void>;
    onSaveNotes: (id: string, notes: string) => Promise<void>;
    onSendReply: (
        id: string,
        subject: string,
        replyMessage: string
    ) => Promise<boolean>;
    onDelete: (id: string) => Promise<void>;
}

export function LetterDetailModal({
    message,
    isOpen,
    initialReplyOpen = false,
    onClose,
    onStatusChange,
    onSaveNotes,
    onSendReply,
    onDelete,
}: LetterDetailModalProps) {
    const [notes, setNotes] = useState("");
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (message && isOpen) {
            setNotes(message.notes || "");
            setIsReplyOpen(initialReplyOpen);
        }
    }, [message, isOpen, initialReplyOpen]);

    if (!message) return null;

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            await onSaveNotes(message.id, notes);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleQuickStatus = async (newStatus: MessageStatus) => {
        setIsUpdatingStatus(true);
        try {
            await onStatusChange(message.id, newStatus);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSendReply = async (subject: string, replyBody: string) => {
        setIsSendingReply(true);
        try {
            const ok = await onSendReply(message.id, subject, replyBody);
            if (ok) {
                setIsReplyOpen(false);
            }
            return ok;
        } finally {
            setIsSendingReply(false);
        }
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(message.id);
            setIsDeleteConfirmOpen(false);
            onClose();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl w-full p-0 overflow-hidden bg-white dark:bg-[#1E2028] border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
                    <div className="h-1.5 bg-gradient-to-r from-amber-500 via-gold to-amber-600 shrink-0" />

                    <div className="p-6 space-y-5 overflow-y-auto">
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center justify-between gap-4 pr-6">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-gold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                    Message Detail
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono tabular-nums">
                                    {formatDistanceToNow(
                                        new Date(message.createdAt),
                                        { addSuffix: true }
                                    )}
                                </span>
                            </div>
                            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight pt-1">
                                {message.subject}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-white/10 text-xs overflow-hidden">
                            <div className="px-4 py-3 min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-0.5">
                                    <User size={12} className="text-amber-500" />
                                    Sender Name
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm block truncate">
                                    {message.name}
                                </span>
                            </div>
                            <div className="px-4 py-3 min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-0.5">
                                    <Mail size={12} className="text-amber-500" />
                                    Sender Email
                                </span>
                                <span className="font-mono font-bold text-amber-600 dark:text-gold text-sm block truncate">
                                    {message.email}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <MessageSquare
                                    size={12}
                                    className="text-amber-500"
                                />
                                <span>Message Body</span>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                                {message.message}
                            </div>
                        </div>

                        {isReplyOpen && (
                            <MessageReplyComposer
                                message={message}
                                isSending={isSendingReply}
                                onSend={handleSendReply}
                                onCancel={() => setIsReplyOpen(false)}
                            />
                        )}

                        <MessageAdminNotesSection
                            notes={notes}
                            savedNotes={message.notes || ""}
                            isSaving={isSavingNotes}
                            onChange={setNotes}
                            onSave={handleSaveNotes}
                        />

                        <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="smd"
                                onClick={() => setIsDeleteConfirmOpen(true)}
                                disabled={isDeleting}
                                className="border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                aria-label="Delete message permanently"
                            >
                                <Trash2 size={14} />
                                <span>Delete</span>
                            </Button>

                            <div className="flex flex-wrap items-center gap-2 justify-end">
                                {message.status !== "replied" && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="smd"
                                        onClick={() =>
                                            handleQuickStatus("replied")
                                        }
                                        isLoading={isUpdatingStatus}
                                        className="border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                    >
                                        <CheckCircle2 size={14} />
                                        <span>Mark Replied</span>
                                    </Button>
                                )}

                                {message.status !== "archived" && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="smd"
                                        onClick={() =>
                                            handleQuickStatus("archived")
                                        }
                                        isLoading={isUpdatingStatus}
                                        className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                                    >
                                        <Archive size={14} />
                                        <span>Archive</span>
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    variant={isReplyOpen ? "outline" : "primary"}
                                    size="smd"
                                    onClick={() =>
                                        setIsReplyOpen((prev) => !prev)
                                    }
                                    className={
                                        isReplyOpen
                                            ? "border-gold/40 text-amber-700 dark:text-gold"
                                            : "!text-white"
                                    }
                                >
                                    <Mail size={14} />
                                    <span>
                                        {isReplyOpen
                                            ? "Hide Reply Composer"
                                            : "Reply via Email"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                title="Delete Message"
                description="Are you sure you want to permanently delete this message? This action cannot be undone."
                confirmText="Delete Message"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </>
    );
}
