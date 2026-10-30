"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { X, CheckCircle2, AlertTriangle, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AdminMt5CloudRow } from "./actions";

interface Mt5CloudActivityModalProps {
    row: AdminMt5CloudRow | null;
    onClose: () => void;
}

export function Mt5CloudActivityModal({
    row,
    onClose,
}: Mt5CloudActivityModalProps) {
    if (!row) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                            Cloud Activity Log • #{row.accountNumber}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {row.userName} ({row.server})
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Close activity modal"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X size={15} />
                    </Button>
                </div>

                {/* 2x2 Matrix Specs */}
                <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-white/5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925]">
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">
                            Account #
                        </div>
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                            {row.accountNumber}
                        </div>
                    </div>
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">
                            Broker Server
                        </div>
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                            {row.server}
                        </div>
                    </div>
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">
                            Live Equity
                        </div>
                        <div className="text-xs font-extrabold text-emerald-400">
                            ${row.equity.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="p-2.5">
                        <div className="text-[10px] font-bold uppercase text-gray-400">
                            Open Positions
                        </div>
                        <div className="text-xs font-extrabold text-amber-400">
                            {row.openPositionsCount} open • {row.totalLots.toFixed(2)} lots
                        </div>
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5">
                    {row.recentActivity.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-500">
                            No remote executions recorded yet for this account.
                        </div>
                    ) : (
                        row.recentActivity.map((item) => {
                            const isErr = item.status === "ERROR";
                            const isRule = item.source === "RULE_24_5";
                            return (
                                <div
                                    key={item.id}
                                    className="p-3.5 flex items-start justify-between gap-3"
                                >
                                    <div className="flex items-start gap-2.5">
                                        {isErr ? (
                                            <AlertTriangle
                                                size={15}
                                                className="text-red-400 mt-0.5"
                                            />
                                        ) : isRule ? (
                                            <Shield
                                                size={15}
                                                className="text-amber-400 mt-0.5"
                                            />
                                        ) : (
                                            <CheckCircle2
                                                size={15}
                                                className="text-emerald-400 mt-0.5"
                                            />
                                        )}
                                        <div>
                                            <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                                                {item.title}
                                            </div>
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                {item.detail}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
                                        <Clock size={10} />
                                        {formatDistanceToNow(
                                            new Date(item.timestamp),
                                            { addSuffix: true }
                                        )}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
