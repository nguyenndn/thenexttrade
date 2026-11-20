"use client";

import { useEffect, useState } from "react";
import {
    fetchUserSessions,
    revokeOtherSessions,
} from "@/app/dashboard/settings/security/actions";
import {
    Loader2,
    Smartphone,
    Monitor,
    LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface UserSessionItem {
    id: string;
    device: string | null;
    ip: string | null;
    userAgent: string | null;
    lastActive: Date | string;
}

export function ActiveSessionsList() {
    const [sessions, setSessions] = useState<UserSessionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const loadSessions = async () => {
        try {
            const data = await fetchUserSessions();
            setSessions(data);
        } catch {
            toast.error("Failed to load active sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleRevokeOthers = async () => {
        setIsSigningOut(true);

        const res = await revokeOtherSessions();

        if (res.error) {
            toast.error(res.error);
            setIsSigningOut(false);
            return;
        }

        setIsConfirmOpen(false);
        setIsSigningOut(false);
        toast.success("Other devices have been signed out");
        await loadSessions();
    };

    // Helper to categorize device icon
    const getDeviceIcon = (device: string | null) => {
        const d = device?.toLowerCase() || "";
        if (
            d.includes("mobile") ||
            d.includes("iphone") ||
            d.includes("android")
        )
            return <Smartphone size={20} className="text-gray-600" />;
        return <Monitor size={20} className="text-gray-600" />;
    };

    // Helper to check if current (naive check, real check requires session ID matching which we might not have)
    // For now, we highlight the most recent one as "Current" if < 1 min? No.
    // We just show them all.
    // Ideally we match `id` with a cookie-stored session ID, but we don't store that yet.
    // We can rely on `userAgent` matching navigator.userAgent?
    const isCurrentSession = (userAgent: string) => {
        if (typeof window === "undefined") return false;
        return userAgent === window.navigator.userAgent;
    };

    const otherSessionCount = sessions.filter(
        (session) => !isCurrentSession(session.userAgent || "")
    ).length;

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Loader2 className="mx-auto animate-spin" /> Loading sessions...
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-3 sm:space-y-4">
                {sessions.length === 0 && (
                    <div className="text-center text-gray-600 py-4">
                        No active sessions found.
                    </div>
                )}

                {sessions.map((session) => {
                    const isCurrent = isCurrentSession(session.userAgent || "");

                    return (
                        <div
                            key={session.id}
                            className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-lg border transition-all ${isCurrent ? "bg-green-50/50 dark:bg-green-500/5 border-green-200 dark:border-green-500/30" : "bg-gray-50 dark:bg-white/5 border-dashboard "}`}
                        >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div
                                    className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isCurrent ? "bg-green-100 dark:bg-green-500/20" : "bg-white dark:bg-white/10"}`}
                                >
                                    {getDeviceIcon(session.device)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <p className="font-bold text-gray-700 dark:text-white text-sm truncate">
                                            {session.device || "Unknown Device"}
                                        </p>
                                        {isCurrent && (
                                            <span className="shrink-0 text-[10px] bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                                        <span className="truncate max-w-full">
                                            {session.ip || "Unknown IP"}
                                        </span>
                                        <span className="text-gray-300 dark:text-gray-600">
                                            •
                                        </span>
                                        <span className="shrink-0">
                                            Active{" "}
                                            {formatDistanceToNow(
                                                new Date(session.lastActive)
                                            )}{" "}
                                            ago
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {isCurrent && (
                                <div className="shrink-0 whitespace-nowrap text-green-500 text-xs font-bold px-2 sm:px-3">
                                    Active Now
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {otherSessionCount > 0 && (
                <div className="mt-4 flex justify-end">
                    <Button
                        variant="destructive"
                        size="smd"
                        onClick={() => setIsConfirmOpen(true)}
                    >
                        <LogOut size={16} />
                        Sign out all other devices
                    </Button>
                </div>
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Sign out other devices"
                description="Every other device signed in to your account will be signed out immediately. This device stays signed in."
                confirmText="Sign out others"
                cancelText="Cancel"
                isLoading={isSigningOut}
                onConfirm={handleRevokeOthers}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
