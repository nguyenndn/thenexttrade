"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RuleCategory, RuleSeverity, StrategyRuleInput } from "@/lib/strategies/playbook-presets";

interface StrategyRulesEditorProps {
    rules: StrategyRuleInput[];
    onChange: (next: StrategyRuleInput[]) => void;
}

const CATEGORY_OPTIONS: Array<{ value: RuleCategory; label: string }> = [
    { value: "ENTRY", label: "Entry" },
    { value: "EXIT", label: "Exit" },
    { value: "RISK", label: "Risk" },
    { value: "SESSION", label: "Session" },
    { value: "MANAGEMENT", label: "Management" },
    { value: "PSYCHOLOGY", label: "Psychology" },
];

const SEVERITY_OPTIONS: Array<{ value: RuleSeverity; label: string }> = [
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

export function StrategyRulesEditor({ rules, onChange }: StrategyRulesEditorProps) {
    const [draftTitle, setDraftTitle] = useState("");
    const [draftCategory, setDraftCategory] = useState<RuleCategory>("ENTRY");
    const [draftSeverity, setDraftSeverity] = useState<RuleSeverity>("HIGH");

    const handleAddRule = () => {
        const trimmed = draftTitle.trim();
        if (trimmed.length < 3) return;
        onChange([
            ...rules,
            { title: trimmed.slice(0, 140), category: draftCategory, severity: draftSeverity, isActive: true },
        ]);
        setDraftTitle("");
    };

    return (
        <div className="space-y-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-gold shrink-0" />
                    <label htmlFor="new-strategy-rule-title" className="text-sm font-bold text-gray-800 dark:text-white">
                        Execution Rules & Checklist
                    </label>
                </div>
                <span className="text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {rules.length} {rules.length === 1 ? "Rule" : "Rules"}
                </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Each rule becomes an auditable checklist item when logging trades with this strategy.
            </p>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <Select value={draftCategory} onValueChange={(v) => setDraftCategory(v as RuleCategory)}>
                        <SelectTrigger aria-label="Rule category" className="h-9 px-3 rounded-lg border border-dashboard dark:border-white/10 bg-white dark:bg-[#151925] text-xs font-semibold text-gray-800 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925]">
                            {CATEGORY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={draftSeverity} onValueChange={(v) => setDraftSeverity(v as RuleSeverity)}>
                        <SelectTrigger aria-label="Rule severity" className="h-9 px-3 rounded-lg border border-dashboard dark:border-white/10 bg-white dark:bg-[#151925] text-xs font-semibold text-gray-800 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925]">
                            {SEVERITY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label} Severity</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        id="new-strategy-rule-title"
                        type="text"
                        maxLength={140}
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); handleAddRule(); }
                        }}
                        className="flex-1 h-10 px-3 rounded-lg border border-dashboard dark:border-white/10 bg-white dark:bg-[#151925] text-xs sm:text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={draftTitle.trim().length < 3}
                        onClick={handleAddRule}
                        className="h-10 px-3.5 rounded-lg font-bold text-xs shrink-0 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    >
                        <Plus size={14} />
                        <span>Add Rule</span>
                    </Button>
                </div>
            </div>

            {rules.length > 0 && (
                <div className="space-y-1.5 pt-1 max-h-52 overflow-y-auto custom-scrollbar">
                    {rules.map((rule, idx) => (
                        <div
                            key={rule.id ?? `draft-${idx}`}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925]"
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 shrink-0">
                                    {rule.category}
                                </span>
                                <span
                                    className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                                        rule.severity === "HIGH"
                                            ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                            : rule.severity === "MEDIUM"
                                              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                              : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                                    }`}
                                >
                                    {rule.severity}
                                </span>
                                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{rule.title}</span>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => onChange(rules.filter((_, i) => i !== idx))}
                                aria-label={`Remove rule ${rule.title}`}
                                className="h-7 w-7 p-0 rounded-lg border-transparent hover:border-red-200 dark:hover:border-red-500/20 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
                            >
                                <Trash2 size={13} />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
