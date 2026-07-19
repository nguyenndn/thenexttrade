"use client";

import { useEffect, useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { SyncHealthSummaryCard } from "./SyncHealthSummaryCard";
import { SyncHealthAccountRow } from "./SyncHealthAccountRow";
import { RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SyncHealthCenterProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onActionTrigger?: (action: string) => void;
}

export function SyncHealthCenter({
    isOpen,
    onOpenChange,
    onActionTrigger,
}: SyncHealthCenterProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/sync/health");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error("Failed to fetch sync health:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHealth();
        }
    }, [isOpen]);

    const handleRefresh = () => {
        startTransition(async () => {
            await fetchHealth();
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-6 bg-white dark:bg-[#11141d] border-dashboard dark:border-white/[0.08] overflow-hidden rounded-2xl">
                <DialogHeader className="border-b border-dashboard/80 dark:border-white/[0.08] pb-4 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-gray-800 dark:text-white">
                            <Activity
                                className="text-primary animate-pulse"
                                size={20}
                            />
                            Sync Health Center
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Monitor and troubleshoot your MetaTrader 5 account
                            data feeds.
                        </DialogDescription>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loading || isPending}
                        className="flex items-center gap-1.5 h-8 border-gray-300 dark:border-white/10 text-xs text-gray-700 dark:text-gray-200"
                    >
                        <RefreshCw
                            size={12}
                            className={
                                loading || isPending ? "animate-spin" : ""
                            }
                        />
                        Refresh
                    </Button>
                </DialogHeader>

                <div className="max-h-[65vh] overflow-y-auto mt-4 space-y-6 pr-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <RefreshCw
                                size={32}
                                className="animate-spin text-primary"
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                                Loading sync diagnostics...
                            </p>
                        </div>
                    ) : !data || data.accounts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                No accounts found. Add a trading account to
                                track sync health.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Dashboard */}
                            <SyncHealthSummaryCard summary={data.summary} />

                            {/* Accounts List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Account Connection Details
                                </h3>
                                <div className="space-y-3">
                                    {data.accounts.map((account: any) => (
                                        <SyncHealthAccountRow
                                            key={account.accountId}
                                            account={account}
                                            onActionTrigger={(action) => {
                                                onOpenChange(false);
                                                if (onActionTrigger) {
                                                    onActionTrigger(action);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
