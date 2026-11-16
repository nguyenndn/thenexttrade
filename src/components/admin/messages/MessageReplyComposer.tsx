"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ContactMessageRecord } from "@/actions/admin/messages";

interface MessageReplyComposerProps {
    message: ContactMessageRecord;
    isSending: boolean;
    onSend: (subject: string, replyBody: string) => Promise<boolean>;
    onCancel: () => void;
}

function buildDefaultReplySubject(subject: string): string {
    const trimmed = subject.trim();
    return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export function MessageReplyComposer({
    message,
    isSending,
    onSend,
    onCancel,
}: MessageReplyComposerProps) {
    const [subject, setSubject] = useState(() =>
        buildDefaultReplySubject(message.subject)
    );
    const [replyBody, setReplyBody] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setSubject(buildDefaultReplySubject(message.subject));
        setReplyBody("");
    }, [message.id, message.subject]);

    useEffect(() => {
        const timer = setTimeout(() => {
            textareaRef.current?.focus();
        }, 80);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !replyBody.trim() || isSending) return;
        const ok = await onSend(subject.trim(), replyBody.trim());
        if (ok) {
            setReplyBody("");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gold/30 bg-amber-50/40 dark:bg-[#151925] p-4 space-y-3.5"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-200/60 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                    <Mail size={13} />
                    <span>Reply via Mail Server</span>
                </div>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate max-w-full">
                    To: <strong className="font-sans">{message.name}</strong>{" "}
                    &lt;{message.email}&gt;
                </span>
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor="reply-email-subject"
                    className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                    Subject
                </label>
                <input
                    id="reply-email-subject"
                    type="text"
                    required
                    maxLength={255}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-[38px] px-3 py-2 rounded-lg bg-white dark:bg-[#0F1117] border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all"
                />
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor="reply-email-body"
                    className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                    Reply Message
                </label>
                <textarea
                    ref={textareaRef}
                    id="reply-email-body"
                    rows={5}
                    required
                    maxLength={10000}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white dark:bg-[#0F1117] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white leading-relaxed outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all resize-y"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Dispatched directly via TheNextTrade SMTP server and
                    automatically marks this message as Replied.
                </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    size="smd"
                    onClick={onCancel}
                    disabled={isSending}
                    className="border-gray-200 dark:border-white/10 bg-white dark:bg-transparent"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="smd"
                    isLoading={isSending}
                    disabled={!subject.trim() || !replyBody.trim() || isSending}
                    className="!text-white"
                >
                    <Send size={14} />
                    <span>Send Email</span>
                </Button>
            </div>
        </form>
    );
}
