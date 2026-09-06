"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Plus,
    Shield,
    Award,
    ClipboardCheck,
    AlertCircle,
    RefreshCw,
    BarChart2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { TradingRuleCard } from "./TradingRuleCard";
import { TradingRuleModal } from "./TradingRuleModal";
import { GoalCard } from "./GoalCard";
import { GoalModal } from "./GoalModal";
import { addStarterRules, getRulesComplianceStats } from "@/actions/rulebook";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RulebookClientProps {
    initialRules: any[];
    initialGoals: any[];
    strategies: any[];
    accounts: any[];
}

export function RulebookClient({
    initialRules,
    initialGoals,
    strategies,
    accounts,
}: RulebookClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("rulebook");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
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

    return (
        <>
            <PageHeader
                title="Trading Rulebook & Behavior Goals"
                description="Establish clear risk parameters, entry filters, and habit targets to build professional consistency."
            >
                <div className="flex items-center gap-3">
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
                    {activeTab === "goals" && (
                        <Button
                            variant="primary"
                            size="smd"
                            onClick={() => setIsGoalModalOpen(true)}
                            className="flex items-center gap-1.5 shadow-md"
                        >
                            <Plus size={16} />
                            Add Goal
                        </Button>
                    )}
                </div>
            </PageHeader>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                tabsId="rules-tabs"
            >
                <div className="overflow-x-auto scrollbar-hide flex">
                    <TabsList className="bg-[#F1F3F5] dark:bg-[#1A1D27] border border-dashboard rounded-xl p-1 gap-1 shrink-0">
                        <TabsTrigger
                            value="rulebook"
                            className="rounded-lg px-3 sm:px-4 py-1.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 border whitespace-nowrap flex-1 text-center lg:flex-none border-transparent hover:border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0 !-inset-[1px]"
                            activeTextClassName="!text-white"
                        >
                            <Shield size={14} className="sm:w-4 sm:h-4" />
                            Rulebook
                        </TabsTrigger>
                        <TabsTrigger
                            value="goals"
                            className="rounded-lg px-3 sm:px-4 py-1.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 border whitespace-nowrap flex-1 text-center lg:flex-none border-transparent hover:border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0 !-inset-[1px]"
                            activeTextClassName="!text-white"
                        >
                            <Award size={14} className="sm:w-4 sm:h-4" />
                            Behavior Goals
                        </TabsTrigger>
                        <TabsTrigger
                            value="compliance"
                            className="rounded-lg px-3 sm:px-4 py-1.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 border whitespace-nowrap flex-1 text-center lg:flex-none border-transparent hover:border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0 !-inset-[1px]"
                            activeTextClassName="!text-white"
                        >
                            <ClipboardCheck
                                size={14}
                                className="sm:w-4 sm:h-4"
                            />
                            Compliance Analytics
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- RULEBOOK TAB --- */}
                <TabsContent value="rulebook" className="space-y-6">
                    {/* Category Filter Selector */}
                    <div className="flex flex-wrap gap-1.5 border-b border-dashboard/80 dark:border-white/[0.08] pb-4">
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    selectedCategory === cat.value
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-white dark:bg-[#1E2028] border-dashboard hover:border-gray-400 text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {filteredRules.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-2xl border border-dashboard shadow-sm max-w-xl mx-auto mt-6">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center mx-auto mb-4 text-indigo-500">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">
                                No Rules Defined
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                                Define entry checklists or risk boundaries.
                                Alternatively, set up starter rules below.
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                                <Button
                                    variant="outline"
                                    size="smd"
                                    onClick={handleAddStarterRules}
                                    disabled={isPending}
                                    className="flex items-center gap-1.5 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                {/* --- GOALS TAB --- */}
                <TabsContent value="goals">
                    {initialGoals.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-2xl border border-dashboard shadow-sm max-w-xl mx-auto">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-4 text-amber-500">
                                <Award size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">
                                No Active Goals
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                                Set behavior targets, such as logging a specific
                                number of trades or reviewing losses.
                            </p>
                            <div className="mt-6">
                                <Button
                                    variant="primary"
                                    size="smd"
                                    onClick={() => setIsGoalModalOpen(true)}
                                    className="font-bold"
                                >
                                    Set Behavior Goal
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {initialGoals.map((goal) => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    onUpdate={() => router.refresh()}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* --- COMPLIANCE TAB --- */}
                <TabsContent value="compliance">
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
                        <div className="space-y-6">
                            {/* Compliance Overview Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Stats Table */}
                                <div className="bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] p-5 rounded-2xl">
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
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                                                            Checked{" "}
                                                            {totalChecks} times
                                                            • {stat.followed}{" "}
                                                            Followed,{" "}
                                                            {stat.broken} Broken
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-sm font-black ${rate >= 75 ? "text-emerald-500" : rate >= 50 ? "text-amber-500" : "text-red-500"}`}
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
                                <div className="bg-white dark:bg-[#1E2028] border border-dashboard/80 dark:border-white/[0.08] p-5 rounded-2xl flex flex-col justify-between">
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
                                                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
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
                                                            <span className="font-bold text-red-500">
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
                                                        week. Consider setting
                                                        up a behavior goal in
                                                        the Goals tab to track
                                                        this habit.
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

            <GoalModal
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSuccess={() => router.refresh()}
            />
        </>
    );
}
