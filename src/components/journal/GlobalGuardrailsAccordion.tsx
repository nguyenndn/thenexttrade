"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    RuleChecklistRow,
    type RuleChecklistItemData,
    type RuleCheckStatus,
    type RuleCheckValue,
} from "./RuleChecklistRow";

interface GlobalGuardrailsAccordionProps {
    rules: RuleChecklistItemData[];
    ruleChecks: Record<string, RuleCheckValue>;
    onStatusChange: (ruleId: string, status: RuleCheckStatus) => void;
    onNoteChange: (ruleId: string, note: string) => void;
}

export function GlobalGuardrailsAccordion({
    rules,
    ruleChecks,
    onStatusChange,
    onNoteChange,
}: GlobalGuardrailsAccordionProps) {
    const brokenCount = rules.reduce(
        (acc, r) => ((ruleChecks[r.id]?.status || "FOLLOWED") === "BROKEN" ? acc + 1 : acc),
        0
    );
    const [isOpen, setIsOpen] = useState(brokenCount > 0);

    if (rules.length === 0) return null;

    return (
        <div className="rounded-lg border border-dashboard bg-gray-50/70 dark:bg-[#151925] overflow-hidden">
            <Button
                type="button"
                variant="ghost"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full h-auto px-3 py-2.5 flex items-center justify-between gap-2 rounded-none hover:bg-gray-100/80 dark:hover:bg-white/[0.03]"
            >
                <div className="flex items-center gap-2 min-w-0 text-left">
                    {brokenCount > 0 ? (
                        <AlertTriangle
                            size={15}
                            className="text-red-500 shrink-0"
                        />
                    ) : (
                        <ShieldCheck
                            size={15}
                            className="text-emerald-500 shrink-0"
                        />
                    )}
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
                        Global Guardrails
                    </span>
                    <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tabular-nums shrink-0 ${
                            brokenCount > 0
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                    >
                        {brokenCount > 0
                            ? `${brokenCount} broken`
                            : `${rules.length} respected`}
                    </span>
                </div>

                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                    {isOpen ? "Hide" : "Flag violation"}
                    <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </span>
            </Button>

            {isOpen && (
                <div className="p-2.5 pt-1 border-t border-dashboard/60 space-y-1.5">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 px-0.5 pb-1">
                        Account-wide risk &amp; session guardrails. Only flag rules broken on this trade (does not affect Strategy Grade).
                    </p>
                    {rules.map((rule) => {
                        const currentCheck = ruleChecks[rule.id] || {
                            status: "FOLLOWED" as const,
                            note: "",
                        };
                        return (
                            <RuleChecklistRow
                                key={rule.id}
                                rule={rule}
                                check={currentCheck}
                                onStatusChange={(status) =>
                                    onStatusChange(rule.id, status)
                                }
                                onNoteChange={(note) =>
                                    onNoteChange(rule.id, note)
                                }
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
