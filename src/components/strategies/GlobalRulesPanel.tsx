"use client";

import { useState, useTransition } from "react";
import { Plus, Shield, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TradingRuleCard, TradingRuleItem } from "@/components/rules/TradingRuleCard";
import { addStarterRules } from "@/actions/rulebook";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GlobalRulesPanelProps {
    rules: TradingRuleItem[];
    onAddRule: () => void;
    onEditRule: (rule: TradingRuleItem) => void;
    onRefresh: () => void;
}

const CATEGORIES = [
    { value: "ALL", label: "All Global Rules" },
    { value: "RISK", label: "Risk Management" },
    { value: "PSYCHOLOGY", label: "Psychology" },
    { value: "SESSION", label: "Session Rules" },
    { value: "ENTRY", label: "Entry Criteria" },
    { value: "EXIT", label: "Exit Criteria" },
    { value: "MANAGEMENT", label: "Trade Management" },
] as const;

export function GlobalRulesPanel({ rules, onAddRule, onEditRule, onRefresh }: GlobalRulesPanelProps) {
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [isPending, startTransition] = useTransition();

    const globalRules = rules.filter((r) => !r.strategyId);
    const filteredRules = selectedCategory === "ALL" ? globalRules : globalRules.filter((r) => r.category === selectedCategory);
    const currentCategoryLabel = CATEGORIES.find((c) => c.value === selectedCategory)?.label ?? "All Global Rules";

    const handleAddStarterRules = () => {
        startTransition(async () => {
            const res = await addStarterRules();
            if (res.success) {
                toast.success("Default starter rules added!");
                onRefresh();
            } else {
                toast.error("Failed to add starter rules.");
            }
        });
    };

    return (
        <div className="space-y-3 md:space-y-6">
            <div className="flex md:hidden items-center justify-between gap-2 bg-white dark:bg-[#1E2028] p-2 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="smd"
                            className="flex-1 justify-between px-3 font-semibold text-xs text-gray-700 dark:text-gray-200 border-dashboard bg-gray-50/80 dark:bg-[#151925] min-w-0"
                        >
                            <span className="truncate">
                                Category: <span className="text-gold dark:text-amber-400 font-bold">{currentCategoryLabel}</span>
                            </span>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10">
                        {CATEGORIES.map((cat) => (
                            <DropdownMenuItem
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={cn(
                                    "flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer rounded-lg",
                                    selectedCategory === cat.value && "text-amber-600 dark:text-gold font-bold bg-amber-500/10"
                                )}
                            >
                                <span>{cat.label}</span>
                                {selectedCategory === cat.value && <Check size={14} className="text-amber-600 dark:text-gold shrink-0" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="hidden md:flex flex-wrap gap-1.5 pb-4 border-b border-gray-200 dark:border-white/10">
                {CATEGORIES.map((cat) => (
                    <Button
                        key={cat.value}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategory(cat.value)}
                        className={cn(
                            "h-auto shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                            selectedCategory === cat.value
                                ? "bg-amber-500/10 border-amber-500 text-gold dark:text-amber-400 hover:bg-amber-500/15"
                                : "bg-white dark:bg-[#1E2028] border-gray-200 dark:border-white/10 hover:border-amber-400/40 text-gray-600 dark:text-gray-400"
                        )}
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {filteredRules.length === 0 ? (
                <div className="w-full text-center py-12 md:py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-gold/15 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-gold">
                        <Shield size={24} />
                    </div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white">No Global Discipline Rules Defined</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-6 max-w-md mx-auto">
                        Global rules enforce risk limits, session windows, and anti-tilt guardrails across every strategy you trade.
                    </p>
                    <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 px-4">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={handleAddStarterRules}
                            disabled={isPending}
                            className="border-amber-500/30 text-amber-600 dark:text-gold hover:bg-gold/10 font-bold"
                        >
                            <Plus size={14} />
                            <span>Add Starter Rules</span>
                        </Button>
                        <Button variant="primary" size="smd" onClick={onAddRule} className="font-bold">
                            <Plus size={14} />
                            <span>Create Global Rule</span>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {filteredRules.map((rule) => (
                        <TradingRuleCard key={rule.id} rule={rule} onUpdate={onRefresh} onEdit={onEditRule} />
                    ))}
                </div>
            )}
        </div>
    );
}
