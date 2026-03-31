"use client";

import { useState } from "react";
import { Pencil, RotateCcw, Bell, X, Send, Loader2 } from "lucide-react";
import { resetUserPassword, sendUserNotification } from "./actions";
import Link from "next/link";

interface QuickActionsProps {
    userId: string;
    userEmail: string;
}

export function QuickActions({ userId, userEmail }: QuickActionsProps) {
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyTitle, setNotifyTitle] = useState("");
    const [notifyMessage, setNotifyMessage] = useState("");
    const [loading, setLoading] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleResetPassword = async () => {
        if (!confirm(`Send password reset email to ${userEmail}?`)) return;
        setLoading("reset");
        setFeedback(null);
        const result = await resetUserPassword(userId);
        setLoading(null);
        setFeedback(result.success
            ? { type: "success", message: "Password reset email sent!" }
            : { type: "error", message: result.error || "Failed to send" }
        );
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleSendNotification = async () => {
        if (!notifyTitle.trim() || !notifyMessage.trim()) return;
        setLoading("notify");
        const result = await sendUserNotification(userId, notifyTitle, notifyMessage);
        setLoading(null);
        if (result.success) {
            setFeedback({ type: "success", message: "Notification sent!" });
            setNotifyTitle("");
            setNotifyMessage("");
            setShowNotifyModal(false);
        } else {
            setFeedback({ type: "error", message: result.error || "Failed to send" });
        }
        setTimeout(() => setFeedback(null), 3000);
    };

    return (
        <>
            <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-2">
                {feedback && (
                    <div className={`text-xs font-bold text-center py-1.5 rounded-lg ${feedback.type === "success"
                        ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                        : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        }`}>
                        {feedback.message}
                    </div>
                )}
                <div className="flex gap-2">
                    <Link
                        href={`/admin/users/${userId}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Pencil size={13} /> Edit
                    </Link>
                    <button
                        onClick={handleResetPassword}
                        disabled={loading === "reset"}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === "reset" ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Reset PW
                    </button>
                    <button
                        onClick={() => setShowNotifyModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Bell size={13} /> Notify
                    </button>
                </div>
            </div>

            {/* Notify Modal */}
            {showNotifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNotifyModal(false)}>
                    <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Bell size={18} className="text-primary" /> Send Notification
                            </h3>
                            <button onClick={() => setShowNotifyModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={notifyTitle}
                                    onChange={e => setNotifyTitle(e.target.value)}
                                    placeholder="Notification title..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                                <textarea
                                    value={notifyMessage}
                                    onChange={e => setNotifyMessage(e.target.value)}
                                    placeholder="Write your message..."
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setShowNotifyModal(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendNotification}
                                disabled={!notifyTitle.trim() || !notifyMessage.trim() || loading === "notify"}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading === "notify" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
