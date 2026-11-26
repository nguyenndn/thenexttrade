"use client";

import { Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type RuleCheckStatus = "FOLLOWED" | "BROKEN" | "SKIPPED";

export interface RuleChecklistItemData {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    severity: string;
}

export interface RuleCheckValue {
    status: RuleCheckStatus;
    note: string;
}

interface RuleChecklistRowProps {
    rule: RuleChecklistItemData;
    check: RuleCheckValue;
    onStatusChange: (status: RuleCheckStatus) => void;
    onNoteChange: (note: string) => void;
}

const STATUS_OPTIONS: ReadonlyArray<{
    value: RuleCheckStatus;
    label: string;
    Icon: typeof Check;
    activeClass: string;
}> = [
    {
        value: "FOLLOWED",
        label: "Pass",
        Icon: Check,
        activeClass:
            "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:text-white",
    },
    {
        value: "BROKEN",
        label: "Broken",
        Icon: X,
        activeClass:
            "bg-red-500 border-red-500 text-white hover:bg-red-600 hover:text-white",
    },
    {
        value: "SKIPPED",
        label: "N/A",
        Icon: Minus,
        activeClass:
            "bg-gray-500 border-gray-500 text-white hover:bg-gray-600 hover:text-white",
    },
];

export function RuleChecklistRow({
    rule,
    check,
    onStatusChange,
    onNoteChange,
}: RuleChecklistRowProps) {
    const severityDot =
        rule.severity === "HIGH"
            ? "bg-red-500"
            : rule.severity === "MEDIUM"
              ? "bg-amber-500"
              : "bg-gray-400";

    return (
        <div className="px-2.5 py-2 rounded-lg border border-dashboard bg-white/80 dark:bg-[#151925] space-y-2">
            <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${severityDot}`}
                        title={`${rule.severity} priority · ${rule.category}`}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">
                            {rule.title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {STATUS_OPTIONS.map(({ value, label, Icon, activeClass }) => {
                        const isSelected = check.status === value;
                        return (
                            <Button
                                key={value}
                                type="button"
                                variant="outline"
                                aria-label={`Mark rule ${rule.title} as ${value.toLowerCase()}`}
                                onClick={() => onStatusChange(value)}
                                className={`h-7 px-2 rounded-lg text-[10px] font-bold gap-1 transition-colors ${
                                    isSelected
                                        ? activeClass
                                        : "bg-gray-50/80 dark:bg-[#1E2028] text-gray-500 dark:text-gray-400 border-dashboard hover:text-gray-800 dark:hover:text-white"
                                }`}
                            >
                                <Icon size={11} />
                                <span className="hidden sm:inline">{label}</span>
                            </Button>
                        );
                    })}
                </div>
            </div>

            {(check.status === "BROKEN" || check.status === "SKIPPED") && (
                <div className="pl-3.5 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block">
                        {check.status === "BROKEN"
                            ? "Why was this rule broken?"
                            : "Reason not applicable"}
                    </label>
                    <input
                        type="text"
                        aria-label="Rule violation or skip note"
                        value={check.note || ""}
                        onChange={(e) => onNoteChange(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs rounded-lg bg-gray-50 dark:bg-[#1E2028] border border-dashboard focus:border-primary focus:outline-none"
                    />
                </div>
            )}
        </div>
    );
}
