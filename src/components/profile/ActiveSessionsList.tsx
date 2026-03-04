"use client";

import { useEffect, useState } from "react";
import { fetchUserSessions, deleteSession } from "@/app/dashboard/settings/account/actions";
import { Loader2, Smartphone, Monitor, Globe, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";

export function ActiveSessionsList() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const loadSessions = async () => {
        try {
            const data = await fetchUserSessions();
            setSessions(data);
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleRevoke = async (id: string) => {
        // Confirmation
        if (!confirm("Are you sure you want to revoke this session? The user will be logged out.")) return;

        setRevokingId(id);
        const res = await deleteSession(id);
        setRevokingId(null);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Session revoked successfully");
            setSessions(prev => prev.filter(s => s.id !== id));
        }
    };

    // Helper to categorize device icon
    const getDeviceIcon = (device: string) => {
        const d = device?.toLowerCase() || "";
        if (d.includes("mobile") || d.includes("iphone") || d.includes("android")) return <Smartphone size={20} className="text-gray-500" />;
        return <Monitor size={20} className="text-gray-500" />;
    };

    // Helper to check if current (naive check, real check requires session ID matching which we might not have)
    // For now, we highlight the most recent one as "Current" if < 1 min? No.
    // We just show them all.
    // Ideally we match `id` with a cookie-stored session ID, but we don't store that yet.
    // We can rely on `userAgent` matching navigator.userAgent?
    const isCurrentSession = (userAgent: string) => {
        if (typeof window === 'undefined') return false;
        return userAgent === window.navigator.userAgent;
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400"><Loader2 className="mx-auto animate-spin" /> Loading sessions...</div>;
    }

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
            <div className="space-y-4">
                {sessions.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No active sessions found.</div>
                )}

                {sessions.map((session) => {
                    const isCurrent = isCurrentSession(session.userAgent || "");

                    return (
                        <div key={session.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCurrent ? 'bg-green-50/50 dark:bg-green-500/5 border-green-200 dark:border-green-500/30' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrent ? 'bg-green-100 dark:bg-green-500/20' : 'bg-white dark:bg-white/10'}`}>
                                    {getDeviceIcon(session.device)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                                            {session.device || "Unknown Device"}
                                        </p>
                                        {isCurrent && (
                                            <span className="text-[10px] bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
                                        <span>{session.ip || "Unknown IP"}</span>
                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                        <span>Active {formatDistanceToNow(new Date(session.lastActive))} ago</span>
                                    </p>
                                </div>
                            </div>

                            {!isCurrent && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRevoke(session.id)}
                                    isLoading={revokingId === session.id}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                    title="Revoke Session"
                                >
                                    {revokingId !== session.id && <LogOut size={18} />}
                                </Button>
                            )}

                            {isCurrent && (
                                <div className="text-green-500 text-xs font-bold px-3">Active Now</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
