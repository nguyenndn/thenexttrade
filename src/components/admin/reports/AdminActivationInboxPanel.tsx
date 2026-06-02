"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { 
    AlertTriangle, 
    AlertCircle, 
    Info, 
    Check, 
    User, 
    Calendar, 
    Clock, 
    MessageSquare, 
    Search,
    RefreshCw,
    Send,
    UserCheck,
    EyeOff,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { 
    getAdminActivationSignals, 
    markUserContacted, 
    dismissUserSignal, 
    saveAdminSignalNote,
    AdminActivationSignalItem 
} from "@/actions/admin-activation";
import { cn } from "@/lib/utils";

// Map signalType to human-readable stages and actions
const stageConfig: Record<string, { stage: string; action: string; badgeColor: string }> = {
    NO_ACCOUNT: {
        stage: "Registered (No Account)",
        action: "Send account setup guide & welcome message.",
        badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    },
    ACCOUNT_NEVER_SYNCED: {
        stage: "Account Exists (No Sync)",
        action: "Send TNT Connect / EA setup instructions.",
        badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    },
    SYNC_STALE: {
        stage: "Sync Offline (>3 days)",
        action: "Send sync troubleshooting & connection support.",
        badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20"
    },
    NO_FIRST_TRADE: {
        stage: "Configured (No Trades)",
        action: "Nudge user to synchronize or manually log first trade.",
        badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    },
    NO_WEEKLY_REVIEW: {
        stage: "Has Trades (No Report)",
        action: "Nudge user to run their first Weekly Coach review.",
        badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20"
    },
    NO_LESSON_STARTED: {
        stage: "Inactive Academy Learner",
        action: "Recommend standard Level 1 consistency lessons.",
        badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    }
};

const severityConfig: Record<string, { icon: any; color: string; border: string; bg: string }> = {
    HIGH: { icon: AlertTriangle, color: "text-red-500", border: "border-red-500/20", bg: "bg-red-500/5" },
    MEDIUM: { icon: AlertCircle, color: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/5" },
    INFO: { icon: Info, color: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/5" },
    LOW: { icon: CheckCircle2, color: "text-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-500/5" }
};

export function AdminActivationInboxPanel() {
    const [signals, setSignals] = useState<AdminActivationSignalItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStage, setSelectedStage] = useState<string>("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
    const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
    const [isPending, startTransition] = useTransition();

    // Fetch inbox signals
    const loadInbox = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getAdminActivationSignals();
            if (res.success && res.data) {
                setSignals(res.data);
                // Initialize notes state
                const notesMap: Record<string, string> = {};
                res.data.forEach(sig => {
                    notesMap[sig.id] = sig.metadata.adminNotes || "";
                });
                setActiveNotes(notesMap);
            } else {
                setError(res.error || "Failed to load activation inbox");
            }
        } catch (err) {
            setError("Failed to fetch inbox records.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInbox();
    }, []);

    // Action handlers
    const handleMarkContacted = async (sigId: string) => {
        startTransition(async () => {
            const res = await markUserContacted(sigId);
            if (res.success) {
                // Optimistic state update
                setSignals(prev => 
                    prev.map(s => 
                        s.id === sigId 
                            ? { ...s, metadata: { ...s.metadata, adminContactedAt: new Date().toISOString() } } 
                            : s
                    )
                );
            }
        });
    };

    const handleDismiss = async (sigId: string) => {
        startTransition(async () => {
            const res = await dismissUserSignal(sigId, 7); // Dismiss for 7 days
            if (res.success) {
                // Remove from list
                setSignals(prev => prev.filter(s => s.id !== sigId));
            }
        });
    };

    const handleSaveNote = async (sigId: string) => {
        const note = activeNotes[sigId] || "";
        setSavingNotes(prev => ({ ...prev, [sigId]: true }));
        try {
            const res = await saveAdminSignalNote(sigId, note);
            if (res.success) {
                setSignals(prev =>
                    prev.map(s =>
                        s.id === sigId
                            ? { ...s, metadata: { ...s.metadata, adminNotes: note } }
                            : s
                    )
                );
            }
        } catch (err) {
            console.error("Failed to save note", err);
        } finally {
            setSavingNotes(prev => ({ ...prev, [sigId]: false }));
        }
    };

    // Filters
    const filteredSignals = signals.filter(sig => {
        const matchesSearch = 
            sig.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sig.user.email && sig.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            sig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sig.summary.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesStage = selectedStage === "ALL" || sig.signalType === selectedStage;
        
        return matchesSearch && matchesStage;
    });

    const uniqueSignalTypes = [
        "NO_ACCOUNT",
        "ACCOUNT_NEVER_SYNCED",
        "SYNC_STALE",
        "NO_FIRST_TRADE",
        "NO_WEEKLY_REVIEW",
        "NO_LESSON_STARTED"
    ];

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 rounded-2xl backdrop-blur-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search trader username, name, or signal content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/40 text-slate-800 dark:text-white"
                    />
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="px-3.5 py-2 text-sm bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none text-slate-800 dark:text-white"
                    >
                        <option value="ALL">All Stuck Stages</option>
                        {uniqueSignalTypes.map(type => (
                            <option key={type} value={type}>
                                {stageConfig[type]?.stage || type}
                            </option>
                        ))}
                    </select>

                    <Button
                        onClick={loadInbox}
                        variant="outline"
                        size="sm"
                        className="rounded-xl shrink-0 p-2.5 h-auto text-slate-600 border-gray-200 dark:text-gray-400 dark:border-white/5"
                    >
                        <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <RefreshCw className="animate-spin text-amber-500" size={28} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Auditing stuck user signals...</p>
                </div>
            ) : error ? (
                <div className="p-6 text-center border border-red-500/10 bg-red-500/5 rounded-2xl">
                    <p className="text-sm text-red-500 font-bold">{error}</p>
                    <Button onClick={loadInbox} className="mt-3 text-xs bg-red-500 hover:bg-red-600 text-white rounded-xl">Retry</Button>
                </div>
            ) : filteredSignals.length === 0 ? (
                <div className="text-center py-16 bg-white/70 dark:bg-white/[0.01] border border-gray-200/80 dark:border-white/5 rounded-2xl">
                    <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-3 animate-pulse" />
                    <h3 className="text-base font-black text-slate-800 dark:text-white">Inbox Completely Clear!</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        No active users are currently stuck in onboarding or activation pipelines. Keep up the high activation rates!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSignals.map(sig => {
                        const stage = stageConfig[sig.signalType] || { stage: sig.signalType, action: "Send support nudge.", badgeColor: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
                        const severity = severityConfig[sig.severity] || severityConfig.INFO;
                        const SeverityIcon = severity.icon;

                        return (
                            <div 
                                key={sig.id}
                                className={cn(
                                    "p-5 rounded-2xl border bg-white dark:bg-[#11131c]/90 relative overflow-hidden transition-all hover:shadow-lg hover:shadow-amber-500/[0.02]",
                                    sig.metadata.adminContactedAt ? "border-emerald-500/20 dark:border-emerald-500/10 opacity-80" : "border-amber-900/10 dark:border-white/5"
                                )}
                            >
                                {/* Active amber/gold corner accent */}
                                {!sig.metadata.adminContactedAt && (
                                    <div className="absolute top-0 right-0 h-4 w-4 bg-gradient-to-bl from-amber-500 to-transparent" />
                                )}

                                <div className="flex flex-col md:flex-row gap-5">
                                    {/* User Card info */}
                                    <div className="flex items-start gap-3 w-full md:w-1/4 shrink-0 min-w-0">
                                        <Avatar className="h-10 w-10 border border-amber-500/10 shadow-sm shrink-0">
                                            {sig.user.image ? (
                                                <AvatarImage src={sig.user.image} alt={sig.user.name} />
                                            ) : null}
                                            <AvatarFallback className="font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-500/10">
                                                {sig.user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white truncate">{sig.user.name}</h4>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{sig.user.email || "No Email"}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[9px] font-black tracking-wider uppercase text-amber-600 dark:text-amber-400">LV {sig.user.level}</span>
                                                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500">Joined {format(new Date(sig.user.createdAt), "MMM d, yyyy")}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stuck Signal Detail */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider", stage.badgeColor)}>
                                                {stage.stage}
                                            </span>
                                            
                                            <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border", severity.bg, severity.border)}>
                                                <SeverityIcon size={10} className={severity.color} />
                                                <span className={severity.color}>{sig.severity}</span>
                                            </div>

                                            {sig.metadata.adminContactedAt && (
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <UserCheck size={10} />
                                                    <span>Contacted</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{sig.title}</h5>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{sig.summary}</p>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-white/[0.03]">
                                            <span className="flex items-center gap-1"><Calendar size={11} /> First seen: {format(new Date(sig.firstSeenAt), "MMM d HH:mm")}</span>
                                            <span className="flex items-center gap-1"><Clock size={11} /> Last sync: {format(new Date(sig.lastSeenAt), "MMM d HH:mm")}</span>
                                        </div>
                                    </div>

                                    {/* Action items and notes */}
                                    <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-3 justify-between">
                                        <div className="p-3 bg-amber-500/[0.02] dark:bg-white/[0.01] border border-amber-900/[0.04] dark:border-white/5 rounded-xl space-y-1">
                                            <span className="text-[9px] font-black tracking-wider uppercase text-amber-700 dark:text-amber-400/80">Recommended Admin Action:</span>
                                            <p className="text-xs text-slate-600 dark:text-gray-300 font-medium leading-relaxed">{stage.action}</p>
                                        </div>

                                        {/* Inline admin notes box */}
                                        <div>
                                            <textarea
                                                placeholder="Add notes for this user's activation (e.g. Sent discord link...)"
                                                value={activeNotes[sig.id] || ""}
                                                onChange={(e) => setActiveNotes(prev => ({ ...prev, [sig.id]: e.target.value }))}
                                                className="w-full text-[11px] p-2 bg-slate-50 dark:bg-[#07090f] border border-gray-200 dark:border-white/5 rounded-xl h-14 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/40 text-slate-800 dark:text-white resize-none"
                                            />
                                        </div>

                                        {/* Row Quick Action Buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleMarkContacted(sig.id)}
                                                disabled={isPending || !!sig.metadata.adminContactedAt}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 rounded-xl text-[11px] font-bold bg-white dark:bg-transparent border-gray-200 dark:border-white/10 dark:text-gray-300 hover:border-emerald-500/30 hover:text-emerald-500 dark:hover:text-emerald-400 gap-1.5 h-8 shrink-0 shadow-sm"
                                            >
                                                {sig.metadata.adminContactedAt ? (
                                                    <UserCheck size={11} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <Send size={11} className="shrink-0" />
                                                )}
                                                {sig.metadata.adminContactedAt ? "Contacted" : "Mark Contacted"}
                                            </Button>

                                            <Button
                                                onClick={() => handleSaveNote(sig.id)}
                                                disabled={savingNotes[sig.id] || activeNotes[sig.id] === sig.metadata.adminNotes}
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "rounded-xl text-[11px] font-bold h-8 px-3 shrink-0 shadow-sm transition-all border-gray-200 dark:border-white/10 gap-1 flex items-center justify-center",
                                                    activeNotes[sig.id] !== sig.metadata.adminNotes
                                                        ? "bg-amber-500 hover:bg-amber-600 text-white border-transparent cursor-pointer"
                                                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed bg-slate-50/50 dark:bg-white/[0.01]"
                                                )}
                                            >
                                                <Check size={11} className="shrink-0" />
                                                <span>{savingNotes[sig.id] ? "..." : "Save"}</span>
                                            </Button>

                                            <Button
                                                onClick={() => handleDismiss(sig.id)}
                                                disabled={isPending}
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl text-[11px] font-bold border-gray-200 dark:border-white/10 text-gray-500 hover:bg-rose-500/5 hover:border-rose-500/30 hover:text-rose-500 gap-1 h-8 px-2.5 shrink-0 shadow-sm"
                                                title="Snooze for 7 days"
                                            >
                                                <EyeOff size={11} />
                                                <span>Snooze</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
