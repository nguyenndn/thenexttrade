"use client";

import { useState } from "react";
import { Pencil, Bell, X, Send, Loader2, KeyRound } from "lucide-react";
import { resetUserPassword, sendUserNotification } from "./actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChangeRoleModal } from "@/components/admin/users/ChangeRoleModal";
import { toast } from "sonner";

interface QuickActionsProps {
    userId: string;
    userEmail: string;
    userName: string;
    currentRole: string;
}

export function QuickActions({ userId, userEmail, userName, currentRole }: QuickActionsProps) {
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [notifyTitle, setNotifyTitle] = useState("");
    const [notifyMessage, setNotifyMessage] = useState("");
    const [loading, setLoading] = useState<string | null>(null);

    const handleResetPassword = async () => {
        setLoading("reset");
        const result = await resetUserPassword(userId);
        setLoading(null);
        setShowResetConfirm(false);
        if (result.success) {
            toast.success("Password reset email sent!");
        } else {
            toast.error(result.error || "Failed to send reset email");
        }
    };

    const handleSendNotification = async () => {
        if (!notifyTitle.trim() || !notifyMessage.trim()) return;
        setLoading("notify");
        const result = await sendUserNotification(userId, notifyTitle, notifyMessage);
        setLoading(null);
        if (result.success) {
            toast.success("Notification sent!");
            setNotifyTitle("");
            setNotifyMessage("");
            setShowNotifyModal(false);
        } else {
            toast.error(result.error || "Failed to send notification");
        }
    };

    return (
        <>
            <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-2">
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRoleModal(true)}
                        className="flex-1 h-9 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
                    >
                        <Pencil size={13} className="mr-1.5" /> Edit Role
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResetConfirm(true)}
                        className="flex-1 h-9 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
                    >
                        <KeyRound size={13} className="mr-1.5" /> Reset PW
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotifyModal(true)}
                        className="flex-1 h-9 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
                    >
                        <Bell size={13} className="mr-1.5" /> Notify
                    </Button>
                </div>
            </div>

            {/* Reset Password Confirm Dialog */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                title="Reset Password"
                description={`Send a password reset email to ${userEmail}? The user will receive a link to create a new password.`}
                confirmText="Send Reset Email"
                cancelText="Cancel"
                isLoading={loading === "reset"}
                onConfirm={handleResetPassword}
                onCancel={() => setShowResetConfirm(false)}
                variant="info"
            />

            {/* Change Role Modal */}
            <ChangeRoleModal
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                userId={userId}
                userName={userName}
                currentRole={currentRole}
            />

            {/* Notify Modal */}
            {showNotifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNotifyModal(false)}>
                    <div className="bg-white dark:bg-[#1E2028] rounded-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <Bell size={18} className="text-primary" /> Send Notification
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNotifyModal(false)}
                                className="h-8 w-8 rounded-xl"
                                aria-label="Close notification modal"
                            >
                                <X size={18} className="text-gray-500" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={notifyTitle}
                                    onChange={e => setNotifyTitle(e.target.value)}
                                    placeholder="Notification title..."
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Message</label>
                                <textarea
                                    value={notifyMessage}
                                    onChange={e => setNotifyMessage(e.target.value)}
                                    placeholder="Write your message..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowNotifyModal(false)}
                                className="flex-1 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSendNotification}
                                disabled={!notifyTitle.trim() || !notifyMessage.trim() || loading === "notify"}
                                className="flex-1 rounded-xl"
                            >
                                {loading === "notify" ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
