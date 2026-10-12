"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  User,
  Clock,
  Trash2,
  CheckCircle2,
  Archive,
  ExternalLink,
  Save,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ContactMessageRecord, MessageStatus } from "@/actions/admin/messages";

interface LetterDetailModalProps {
  message: ContactMessageRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: MessageStatus, notes?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LetterDetailModal({
  message,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}: LetterDetailModalProps) {
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (message) {
      setNotes(message.notes || "");
    }
  }, [message]);

  if (!message) return null;

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      await onStatusChange(message.id, message.status as MessageStatus, notes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStatus = async (newStatus: MessageStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(message.id, newStatus, notes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this inquiry?")) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(message.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden bg-white dark:bg-[#161922] border-gray-200 dark:border-white/10 rounded-xl shadow-2xl">
        {/* Top Gold Airmail Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-gold to-amber-600" />

        <div className="p-6 space-y-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                Dispatch Inward Record
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </span>
            </div>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight pt-1">
              {message.subject}
            </DialogTitle>
          </DialogHeader>

          {/* 2x2 Sender Memorandum Card */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-white/10 text-xs">
            <div className="p-3.5 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <User size={12} className="text-amber-500" />
                <span>Sender Name</span>
              </div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {message.name}
              </div>
            </div>

            <div className="p-3.5 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Mail size={12} className="text-amber-500" />
                <span>Sender Email</span>
              </div>
              <a
                href={`mailto:${message.email}`}
                className="font-mono font-bold text-gold hover:underline truncate block"
              >
                {message.email}
              </a>
            </div>
          </div>

          {/* Message Content Paper Sheet */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <MessageSquare size={12} className="text-amber-500" />
              <span>Correspondence Body</span>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.01] text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto font-normal">
              {message.message}
            </div>
          </div>

          {/* Admin Internal Memo Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span>Internal Admin Notes</span>
              <span className="text-[9px] text-gray-400 lowercase">(visible to team only)</span>
            </div>
            <div className="flex items-center gap-2">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-colors resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveNotes}
                isLoading={isUpdating}
                className="rounded-lg border-gray-200 dark:border-white/10 text-xs font-bold shrink-0 gap-1.5 self-stretch"
                aria-label="Save internal notes"
              >
                <Save size={13} />
                <span>Save</span>
              </Button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="rounded-lg border-red-200 dark:border-red-500/20 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold gap-1.5"
              aria-label="Delete inquiry permanently"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </Button>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {message.status !== "replied" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickStatus("replied")}
                  isLoading={isUpdating}
                  className="rounded-lg border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 text-xs font-bold gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>Mark Replied</span>
                </Button>
              )}

              {message.status !== "archived" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickStatus("archived")}
                  isLoading={isUpdating}
                  className="rounded-lg border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold gap-1"
                >
                  <Archive size={13} />
                  <span>Archive</span>
                </Button>
              )}

              <a
                href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-lg bg-gold hover:bg-amber-600 text-white font-black text-xs gap-1.5"
                >
                  <Mail size={13} />
                  <span>Reply via Email</span>
                  <ExternalLink size={11} className="opacity-70" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
