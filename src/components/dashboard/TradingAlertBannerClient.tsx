"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TradingAlert } from "./TradingAlertBanner";

const levelStyles = {
    danger: {
        container: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
        text: "text-red-800 dark:text-red-300",
        title: "text-red-900 dark:text-red-200",
        close: "text-red-400 hover:text-red-600 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-500/20",
        bar: "bg-red-500",
    },
    warning: {
        container: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
        text: "text-amber-800 dark:text-amber-300",
        title: "text-amber-900 dark:text-amber-200",
        close: "text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20",
        bar: "bg-amber-500",
    },
    info: {
        container: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
        text: "text-blue-800 dark:text-blue-300",
        title: "text-blue-900 dark:text-blue-200",
        close: "text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-500/20",
        bar: "bg-blue-500",
    },
};

export function TradingAlertBannerClient({ alerts }: { alerts: TradingAlert[] }) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
    if (visibleAlerts.length === 0) return null;

    const dismiss = (id: string) => {
        setDismissed(prev => new Set(prev).add(id));
    };

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
            {visibleAlerts.map((alert) => {
                const styles = levelStyles[alert.level];
                return (
                    <div
                        key={alert.id}
                        className={`relative overflow-hidden rounded-xl border ${styles.container} transition-all duration-300`}
                    >
                        {/* Accent bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />
                        
                        <div className="flex items-start gap-3 px-5 py-3.5 pl-6">
                            <span className="text-lg mt-0.5 shrink-0">{alert.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${styles.title}`}>
                                    {alert.title}
                                </p>
                                <p className={`text-sm ${styles.text} mt-0.5 leading-relaxed`}>
                                    {alert.description}
                                </p>
                            </div>
                            <button
                                onClick={() => dismiss(alert.id)}
                                className={`p-1.5 rounded-lg transition-colors shrink-0 ${styles.close}`}
                                aria-label="Dismiss alert"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
