"use client";

import { useState } from "react";
import { X, UserCheck, BarChart2, Key, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SetupStep {
    label: string;
    icon: React.ElementType;
    completed: boolean;
}

interface AccountSetupWidgetProps {
    hasAccount: boolean;
    hasApprovedLicense: boolean;
    hasDownloaded: boolean;
}

export function AccountSetupWidget({ hasAccount, hasApprovedLicense, hasDownloaded }: AccountSetupWidgetProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    const steps: SetupStep[] = [
        { label: "Profile Created", icon: UserCheck, completed: true },
        { label: "MT5 Account Submitted", icon: BarChart2, completed: hasAccount },
        { label: "License Key Active", icon: Key, completed: hasApprovedLicense },
        { label: "EA Downloaded", icon: Download, completed: hasDownloaded },
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = (completedCount / steps.length) * 100;

    // Hide only if user explicitly dismissed
    if (isDismissed) return null;

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Account Setup
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        {completedCount}/{steps.length} complete
                    </span>
                    <Button
                        variant="outline"
                        aria-label="Dismiss setup guide"
                        onClick={() => setIsDismissed(true)}
                        className="w-7 h-7 p-0 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={15} />
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-5 pb-4">
                <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-[#00B078] to-[#2F80ED] transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-3 px-5 py-3 transition-colors",
                                step.completed
                                    ? "bg-primary/[0.03]"
                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                            )}
                        >
                            {/* Status Circle */}
                            <div className={cn(
                                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                step.completed
                                    ? "text-primary"
                                    : "border-2 border-gray-200 dark:border-white/10"
                            )}>
                                {step.completed && <CheckCircle2 size={18} strokeWidth={2.5} />}
                            </div>

                            {/* Step Icon */}
                            <Icon
                                size={16}
                                className={cn(
                                    "flex-shrink-0 transition-colors",
                                    step.completed
                                        ? "text-primary"
                                        : "text-gray-400 dark:text-gray-500"
                                )}
                            />

                            {/* Label */}
                            <span className={cn(
                                "text-sm font-semibold transition-colors",
                                step.completed
                                    ? "text-primary"
                                    : "text-gray-500 dark:text-gray-400"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
