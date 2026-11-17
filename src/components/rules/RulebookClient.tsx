"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Plus,
    Shield,
    ClipboardCheck,
    AlertCircle,
    RefreshCw,
    BarChart2,
    ChevronDown,
    Check,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TradingRuleCard } from "./TradingRuleCard";
import { TradingRuleModal } from "./TradingRuleModal";
import { addStarterRules, getRulesComplianceStats } from "@/actions/rulebook";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RulebookClientProps {
    initialRules: any[];
    strategies: any[];
    accounts: any[];
}

export function RulebookClient({
    initialRules,
    strategies,
    accounts,
}: RulebookClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("rulebook");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<any>(null);

    const [complianceStats, setComplianceStats] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Categories list
    const categories = [
        { value: "ALL", label: "All Rules" },
        { value: "RISK", label: "Risk Management" },
        { value: "ENTRY", label: "Entry Criteria" },
        { value: "EXIT", label: "Exit Criteria" },
        { value: "PSYCHOLOGY", label: "Psychology" },
        { value: "SESSION", label: "Session Rules" },
        { value: "MANAGEMENT", label: "Trade Management" },
    ];

    // Fetch compliance statistics when visiting compliance tab
    const fetchCompliance = async () => {
        setLoadingStats(true);
        try {
            const stats = await getRulesComplianceStats();
            setComplianceStats(stats);
        } catch (err) {
            console.error("Failed to fetch compliance stats:", err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        if (activeTab === "compliance") {
            fetchCompliance();
        }
    }, [activeTab, initialRules]);

    const handleAddStarterRules = () => {
        startTransition(async () => {
            const res = await addStarterRules();
            if (res.success) {
                toast.success("Default starter rules added!");
                router.refresh();
            } else {
                toast.error("Failed to add starter rules.");
            }
        });
    };

    const handleEditRule = (rule: any) => {
        setRuleToEdit(rule);
        setIsRuleModalOpen(true);
    };

    const filteredRules =
        selectedCategory === "ALL"
            ? initialRules
            : initialRules.filter((r) => r.category === selectedCategory);

    const currentCategoryLabel =
        categories.find((c) => c.value === selectedCategory)?.label ??
        "All Rules";

    return (
        <>
            <PageHeader
                title="Trading Rulebook & Compliance"
                description="Establish clear risk parameters, entry filters, and audit your rule compliance."
                hideDescriptionOnMobile
                className="hidden md:flex page-header-mobile-empty"
            >
                <div className="hidden md:flex items-center gap-3">
                    {activeTab === "rulebook" && (
                        <Button
                            variant="primary"
                            size="smd"
                            onClick={() => {
                                setRuleToEdit(null);
                                setIsRuleModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 shadow-md"
                        >
                            <Plus size={16} />
                            Add Rule
                        </Button>
                    )}
                </div>
            </PageHeader>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                tabsId="rules-tabs"
            >
                <TabsList className="w-full grid grid-cols-2 gap-0 bg-transparent dark:bg-transparent p-0 rounded-none border-0 border-b border-dashboard overflow-visible sm:w-auto sm:inline-flex sm:bg-[#F1F3F5] sm:dark:bg-[#1A1D27] sm:border sm:rounded-lg sm:p-1 sm:gap-1">
                    <TabsTrigger
                        value="rulebook"
                        className="w-full sm:w-auto justify-center rounded-none sm:rounded-lg px-2 sm:px-4 py-2.5 sm:py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border-0 sm:border whitespace-nowrap border-transparent hover:border-transparent min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:!-inset-[1px] sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">Rulebook</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="compliance"
                        className="w-full sm:w-auto justify-center rounded-none sm:rounded-lg px-2 sm:px-4 py-2.5 sm:py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border-0 sm:border whitespace-nowrap border-transparent hover:border-transparent min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:!-inset-[1px] sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="sm:hidden truncate">Compliance</span>
                        <span className="hidden sm:inline">
                            Compliance Analytics
                        </span>
                    </TabsTrigger>
                </TabsList>

                {/* --- RULEBOOK TAB --- */}
                <TabsContent value="rulebook" className="mt-2 md:mt-6 space-y-2 md:space-y-6">
                    {/* Mobile Rulebook Toolbar (< md): Category Dropdown + Add Rule CTA */}
                    <div className="flex md:hidden items-center justify-between gap-2 bg-white dark:bg-[#1E2028] p-2 rounded-xl border border-dashboard shadow-sm">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="smd"
                                    className="flex-1 justify-between px-3 font-semibold text-xs text-gray-700 dark:text-gray-200 border-dashboard bg-gray-50/80 dark:bg-[#151925] min-w-0"
                                >
                                    <span className="truncate">
                                        Category:{" "}
                                        <span className="text-gold dark:text-amber-400 font-bold">
                                            {currentCategoryLabel}
                                        </span>
                                    </span>
                                    <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-56 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard"
                            >
                                {categories.map((cat) => (
                                    <DropdownMenuItem
                                        key={cat.value}
                                        onClick={() =>
                                            setSelectedCategory(cat.value)
                                        }
                                        className={cn(
                                            "flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer rounded-lg",
                                            selectedCategory === cat.value &&
                                                "text-amber-600 dark:text-gold font-bold bg-amber-500/10"
                                        )}
                                    >
                                        <span>{cat.label}</span>
                                        {selectedCategory === cat.value && (
                                            <Check
                                                size={14}
                                                className="text-amber-600 dark:text-gold shrink-0"
                                            />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="primary"
                            size="smd"
                            onClick={() => {
                                setRuleToEdit(null);
                                setIsRuleModalOpen(true);
                            }}
                            className="shrink-0 flex items-center gap-1.5 shadow-sm px-3"
                        >
                            <Plus size={15} strokeWidth={2.5} />
                            <span>Add Rule</span>
                        </Button>
                    </div>

                    {/* Desktop Category Filter Selector (>= md) */}
                    <div className="hidden md:flex flex-wrap gap-1.5 pb-4 border-b border-dashboard/80 dark:border-white/[0.08]">
                        {categories.map((cat) => (
                            <Button
                                key={cat.value}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`h-auto shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    selectedCategory === cat.value
                                        ? "bg-amber-500/10 border-amber-500 text-gold dark:text-amber-400 font-bold hover:bg-amber-500/15"
                                        : "bg-white dark:bg-[#1E2028] border-dashboard hover:border-amber-400/40 text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>

                    {filteredRules.length === 0 ? (
                        <div className="w-full text-center py-12 md:py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-2 md:mt-6 shadow-sm">
                            <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-gold/15 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-gold">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">
                                No Rules Defined
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-6 max-w-sm mx-auto">
                                Define entry checklists or risk boundaries.
                                Alternatively, set up starter rules below.
                            </p>
                            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 px-4">
                                <Button
                                    variant="outline"
                                    size="smd"
                                    onClick={handleAddStarterRules}
                                    disabled={isPending}
                                    className="flex items-center justify-center gap-1.5 border-amber-500/30 text-amber-600 dark:text-gold hover:bg-gold/10 font-bold"
                                >
                                    <Plus size={14} />
                                    Add Starter Rules
                                </Button>
                                <Button
                                    variant="primary"
                                    size="smd"
                                    onClick={() => {
                                        setRuleToEdit(null);
                                        setIsRuleModalOpen(true);
                                    }}
                                    className="font-bold"
                                >
                                    Create Custom Rule
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
                            {filteredRules.map((rule) => (
                                <TradingRuleCard
                                    key={rule.id}
                                    rule={rule}
                                    onUpdate={() => router.refresh()}
                                    onEdit={handleEditRule}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* --- COMPLIANCE TAB --- */}
                <TabsContent value="compliance" className="mt-2 md:mt-6">
                    {loadingStats ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <RefreshCw
                                size={32}
                                className="animate-spin text-primary"
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                                Loading compliance stats...
                            </p>
                        </div>
                    ) : complianceStats.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Log trades and check rules inside your journal
                                to build compliance data.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 md:space-y-6">
                            {/* Compliance Overview Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
                                {/* Stats Table */}
                                <div className="bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] p-3.5 sm:p-5 rounded-xl">
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <BarChart2
                                            size={16}
                                            className="text-primary"
                                        />
                                        Rule Compliance Rates
                                    </h3>
                                    <div className="divide-y divide-dashboard dark:divide-white/[0.05]">
                                        {complianceStats.map((stat) => {
                                            const totalChecks =
                                                stat.followed +
                                                stat.broken +
                                                stat.skipped;
                                            const rate =
                                                totalChecks > 0
                                                    ? Math.round(
                                                          (stat.followed /
                                                              totalChecks) *
                                                              100
                                                      )
                                                    : 0;
                                            return (
                                                <div
                                                    key={stat.ruleId}
                                                    className="py-3 flex items-center justify-between gap-4"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
                                                            {stat.ruleTitle}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold font-mono tabular-nums mt-0.5">
                                                            Checked{" "}
                                                            {totalChecks} times
                                                            • {stat.followed}{" "}
                                                            Followed,{" "}
                                                            {stat.broken} Broken
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-sm font-black font-mono tabular-nums ${rate >= 75 ? "text-emerald-500" : rate >= 50 ? "text-amber-500" : "text-red-500"}`}
                                                        >
                                                            {totalChecks > 0
                                                                ? `${rate}%`
                                                                : "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Focus / Advice panel */}
                                <div className="bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] p-3.5 sm:p-5 rounded-xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                            <AlertCircle
                                                size={16}
                                                className="text-amber-500"
                                            />
                                            Discipline Advisor
                                        </h3>
                                        {(() => {
                                            // Find most broken rule
                                            const mostBroken = [
                                                ...complianceStats,
                                            ]
                                                .filter((s) => s.broken > 0)
                                                .sort(
                                                    (a, b) =>
                                                        b.broken - a.broken
                                                )[0];

                                            if (!mostBroken) {
                                                return (
                                                    <div className="space-y-3">
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                            Excellent! You
                                                            haven't broken any
                                                            rules yet on checked
                                                            trades.
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Enforce your rules
                                                            systematically on
                                                            every trade setup to
                                                            build data.
                                                        </p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                                            Biggest Leak
                                                            Identified:
                                                        </p>
                                                        <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
                                                            "
                                                            {
                                                                mostBroken.ruleTitle
                                                            }
                                                            "
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                            Broken{" "}
                                                            <span className="font-bold font-mono tabular-nums text-red-500">
                                                                {
                                                                    mostBroken.broken
                                                                }{" "}
                                                                times
                                                            </span>
                                                            .
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        Focus strictly on this
                                                        rule during the coming
                                                        week and verify it before
                                                        every execution in your
                                                        journal.
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* MODALS */}
            <TradingRuleModal
                isOpen={isRuleModalOpen}
                onClose={() => {
                    setIsRuleModalOpen(false);
                    setRuleToEdit(null);
                }}
                onSuccess={() => router.refresh()}
                ruleToEdit={ruleToEdit}
                accounts={accounts}
                strategies={strategies}
            />
        </>
    );
}
