"use client";

import {
    ShieldAlert,
    CheckCircle2,
    Clock,
    HelpCircle,
    Monitor,
    Cable,
} from "lucide-react";
import { SyncRecoveryAction } from "./SyncRecoveryAction";
import { getSyncSourceLabel } from "@/lib/sync/sync-source";

interface SyncHealthAccountRowProps {
    account: {
        accountId: string;
        accountNumber: string | null;
        broker: string | null;
        name: string;
        source: "TNT_CONNECT" | "EA_SYNC" | "MANUAL" | "UNKNOWN";
        health: {
            status: string;
            label: string;
            description: string;
            lastHeartbeatAt: string | null;
            lastSyncAt: string | null;
        };
        nextAction?: {
            label: string;
            href?: string;
            action?:
                | "open_sync_setup"
                | "sync_first_trades"
                | "reconnect"
                | "contact_support";
        };
    };
    onActionTrigger?: (action: string) => void;
}

export function SyncHealthAccountRow({
    account,
    onActionTrigger,
}: SyncHealthAccountRowProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
                return <CheckCircle2 className="text-emerald-500" size={16} />;
            case "stale":
                return <Clock className="text-amber-500" size={16} />;
            case "disconnected":
            case "sync_error":
                return <ShieldAlert className="text-red-500" size={16} />;
            default:
                return <HelpCircle className="text-blue-500" size={16} />;
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case "healthy":
                return "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25";
            case "stale":
                return "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25";
            case "disconnected":
            case "sync_error":
                return "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25";
            default:
                return "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25";
        }
    };

    const formattedDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        try {
            const date = new Date(dateStr);
            return date.toLocaleString();
        } catch {
            return "Invalid date";
        }
    };

    const sourceLabel = getSyncSourceLabel(account.source as any);

    return (
        <div
            className={`p-4 rounded-xl border transition-all ${getStatusBgColor(account.health.status)}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                        {getStatusIcon(account.health.status)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate">
                                {account.name}
                            </h4>
                            {account.accountNumber && (
                                <span className="text-[10px] font-mono bg-white/50 dark:bg-black/20 border border-dashboard px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                    #{account.accountNumber}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/40 dark:bg-black/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                                {account.source === "TNT_CONNECT" ? (
                                    <Monitor size={9} />
                                ) : (
                                    <Cable size={9} />
                                )}
                                {sourceLabel}
                            </span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {account.health.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            {account.broker && (
                                <div>
                                    Broker:{" "}
                                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                                        {account.broker}
                                    </span>
                                </div>
                            )}
                            {account.source !== "MANUAL" && (
                                <>
                                    <div>
                                        Last Heartbeat:{" "}
                                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                                            {formattedDate(
                                                account.health.lastHeartbeatAt
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        Last Sync:{" "}
                                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                                            {formattedDate(
                                                account.health.lastSyncAt
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="shrink-0 flex items-center">
                    <SyncRecoveryAction
                        action={account.nextAction}
                        onActionTrigger={onActionTrigger}
                    />
                </div>
            </div>
        </div>
    );
}
