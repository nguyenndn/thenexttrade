"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    SPRING_SOFT,
    backdropVariants,
    panelVariants,
} from "@/lib/animations";
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

export function QuickActions({
    userId,
    userEmail,
    userName,
    currentRole,
}: QuickActionsProps) {
    const [showNotifyModal, setShowNotifyModal] = useState(false);

    // Body scroll lock: lock while the notify modal is open, release after the
    // exit animation completes (in onExitComplete) so the scrollbar doesn't flash.
    useEffect(() => {
        if (showNotifyModal) {
            document.body.style.overflow = "hidden";
        }
    }, [showNotifyModal]);

    const releaseNotifyLock = () => {
        if (!showNotifyModal) {
            document.body.style.overflow = "unset";
        }
    };
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
        const result = await sendUserNotification(
            userId,
            notifyTitle,
            notifyMessage
        );
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
            <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50/80 p-4 border-gray-200 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRoleModal(true)}
                        className="h-10 min-w-0 justify-center whitespace-nowrap rounded-xl border border-gray-200 dark:border-white/10 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        <Pencil size={14} className="mr-1.5 shrink-0" />
                        <span className="whitespace-nowrap">Edit Role</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResetConfirm(true)}
                        className="h-10 min-w-0 justify-center whitespace-nowrap rounded-xl border border-gray-200 dark:border-white/10 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        <KeyRound size={14} className="mr-1.5 shrink-0" />
                        <span className="whitespace-nowrap">
                            Reset Password
                        </span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotifyModal(true)}
                        className="h-10 min-w-0 justify-center whitespace-nowrap rounded-xl border border-gray-200 dark:border-white/10 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        <Bell size={14} className="mr-1.5 shrink-0" />
                        <span className="whitespace-nowrap">Notify</span>
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
            <AnimatePresence onExitComplete={releaseNotifyLock}>
            {showNotifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowNotifyModal(false)}
                    />
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className="relative bg-white dark:bg-[#1E2028] rounded-xl w-full max-w-md mx-4 border border-gray-200 dark:border-white/10 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <Bell size={18} className="text-primary" /> Send
                                Notification
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
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={notifyTitle}
                                    onChange={(e) =>
                                        setNotifyTitle(e.target.value)
                                    }
                                    placeholder="Notification title..."
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B0E14] text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    value={notifyMessage}
                                    onChange={(e) =>
                                        setNotifyMessage(e.target.value)
                                    }
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
                                disabled={
                                    !notifyTitle.trim() ||
                                    !notifyMessage.trim() ||
                                    loading === "notify"
                                }
                                className="flex-1 rounded-xl"
                            >
                                {loading === "notify" ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin mr-2"
                                    />
                                ) : (
                                    <Send size={14} className="mr-2" />
                                )}
                                Send
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>
        </>
    );
}
