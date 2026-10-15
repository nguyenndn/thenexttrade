"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Trophy,
    ShieldCheck,
    Clock,
    Award,
    AlertCircle,
    Zap,
    CheckCircle2,
    ArrowRight,
    Users,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { joinCompetition } from "../actions";

export interface CompetitionPrize {
    place: number;
    prize: number;
    reward: string;
}

export interface DynamicCompetition {
    id: string;
    title: string;
    description: string | null;
    rules?: string | null;
    status: string;
    startDate: Date | string;
    endDate: Date | string;
    prizePool: number;
    prizes?: any;
    minTrades?: number | null;
    maxDrawdown?: number | null;
    eligibleBrokers?: string[] | string | null;
    scoringMetric?: string | null;
    _count?: {
        participants: number;
    };
}

export interface UserAccountItem {
    id: string;
    name: string;
    accountNumber?: string | null;
    broker?: string | null;
    balance?: number;
    useForLeaderboard?: boolean;
}

interface TradingSprintBannerProps {
    competition: DynamicCompetition;
    userEnrollment?: {
        id: string;
        tradingAccountId: string;
        tradingAccount?: {
            id: string;
            name: string;
            accountNumber?: string | null;
            broker?: string | null;
        } | null;
    } | null;
    userAccounts?: UserAccountItem[];
    isLoggedIn?: boolean;
}

export function TradingSprintBanner({
    competition,
    userEnrollment,
    userAccounts = [],
    isLoggedIn = true,
}: TradingSprintBannerProps) {
    const [showRules, setShowRules] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        userEnrollment?.tradingAccountId || userAccounts[0]?.id || ""
    );
    const [isJoining, setIsJoining] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);

    // Calculate dates & countdown
    const now = new Date();
    const start = new Date(competition.startDate);
    const end = new Date(competition.endDate);
    const isUpcoming = competition.status === "UPCOMING" || now < start;
    const targetDate = isUpcoming ? start : end;
    const diffMs = targetDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = Math.max(0, now.getTime() - start.getTime());
    const sprintProgress =
        totalDuration > 0
            ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
            : 0;

    const minTrades = competition.minTrades ?? 10;
    const maxDrawdown = competition.maxDrawdown ?? 10;
    const scoringMetric = competition.scoringMetric || "net_pnl";
    const eligibleBrokers = Array.isArray(competition.eligibleBrokers)
        ? competition.eligibleBrokers
        : typeof competition.eligibleBrokers === "string" && competition.eligibleBrokers !== "ALL"
          ? competition.eligibleBrokers.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

    // Parse prizes
    const prizes: CompetitionPrize[] =
        Array.isArray(competition.prizes) && competition.prizes.length > 0
            ? competition.prizes
            : [
                  {
                      place: 1,
                      prize: Math.round(competition.prizePool * 0.5),
                      reward: "Lifetime VIP & Sprint Winner Trophy",
                  },
                  {
                      place: 2,
                      prize: Math.round(competition.prizePool * 0.3),
                      reward: "6 Months VIP Subscription",
                  },
                  {
                      place: 3,
                      prize: Math.round(competition.prizePool * 0.2),
                      reward: "3 Months VIP Subscription",
                  },
              ];

    const handleJoin = async () => {
        if (!selectedAccountId) {
            toast.error("Please select a trading account to participate.");
            return;
        }
        setIsJoining(true);
        try {
            const res = await joinCompetition(competition.id, selectedAccountId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Successfully registered for the tournament!");
                setIsSwitching(false);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to join tournament.";
            toast.error(msg);
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/10 dark:via-[#161922] dark:to-[#12141C] p-5 sm:p-7 shadow-lg shadow-amber-500/5">
            {/* Ambient Background Accents */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
                {/* Top Row: Meta Badge & Countdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span>{isUpcoming ? "UPCOMING TOURNAMENT" : "LIVE COMPETITION"}</span>
                            {competition._count?.participants !== undefined && (
                                <>
                                    <span className="text-gray-300 dark:text-white/20">•</span>
                                    <span className="flex items-center gap-1 font-semibold">
                                        <Users size={12} />
                                        {competition._count.participants} Contenders
                                    </span>
                                </>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
                            <Trophy className="text-amber-500 shrink-0" size={28} />
                            {competition.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
                            {competition.description ||
                                "Compete with top prop & retail traders with verified MT5 Cloud Sync telemetry. Hard risk controls, automated scoring, and real prize distribution."}
                        </p>
                    </div>

                    {/* Countdown Card */}
                    <div className="flex flex-col sm:items-end justify-center rounded-xl border border-dashboard bg-white/80 dark:bg-white/5 p-3.5 sm:px-5 backdrop-blur-xs min-w-[200px]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <Clock size={14} className="text-amber-500" />
                            <span>{isUpcoming ? "Sprint Begins In" : "Sprint Closes In"}</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                            {daysRemaining} <span className="text-xs font-bold text-gray-500">Days</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${sprintProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Dynamic Prize Pool Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {prizes.slice(0, 3).map((item, idx) => {
                        const isFirst = item.place === 1;
                        const isSecond = item.place === 2;
                        return (
                            <div
                                key={item.place || idx}
                                className={`rounded-xl border p-4 relative overflow-hidden shadow-xs bg-white ${
                                    isFirst
                                        ? "border-amber-500/40 dark:bg-amber-500/[0.04]"
                                        : isSecond
                                          ? "border-slate-300 dark:border-slate-700/60 dark:bg-slate-500/[0.03]"
                                          : "border-orange-300 dark:border-orange-700/60 dark:bg-orange-500/[0.03]"
                                }`}
                            >
                                <div
                                    className={`absolute top-0 left-0 right-0 h-1 ${
                                        isFirst
                                            ? "bg-gradient-to-r from-amber-400 to-amber-600"
                                            : isSecond
                                              ? "bg-slate-400"
                                              : "bg-orange-500"
                                    }`}
                                />
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`text-[11px] font-black uppercase tracking-wider ${
                                            isFirst
                                                ? "text-amber-600 dark:text-amber-400"
                                                : isSecond
                                                  ? "text-slate-600 dark:text-slate-300"
                                                  : "text-orange-600 dark:text-orange-400"
                                        }`}
                                    >
                                        {isFirst ? "1st Place" : isSecond ? "2nd Place" : "3rd Place"}
                                    </span>
                                    <span
                                        className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold border ${
                                            isFirst
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                : isSecond
                                                  ? "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20"
                                                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                        }`}
                                    >
                                        {isFirst ? "Champion" : isSecond ? "Runner-up" : "Podium"}
                                    </span>
                                </div>
                                <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                                    ${item.prize.toLocaleString()}{" "}
                                    <span className="text-xs font-bold text-gray-500">USD</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
                                    {item.reward}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Enrollment Action Section */}
                <div className="pt-1">
                    {!isLoggedIn ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                Sign in with your trader profile to enroll your account and compete for the prize pool.
                            </span>
                            <Link href="/login?redirect=/dashboard/leaderboard?type=sprint">
                                <Button size="sm" className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black">
                                    Sign In to Compete <ArrowRight size={13} className="ml-1" />
                                </Button>
                            </Link>
                        </div>
                    ) : userEnrollment && !isSwitching ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xs">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                <div className="text-xs">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        You are registered for this sprint!
                                    </span>{" "}
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Active Account: #{userEnrollment.tradingAccount?.accountNumber || "N/A"}{" "}
                                        {userEnrollment.tradingAccount?.broker ? `(${userEnrollment.tradingAccount.broker})` : ""}
                                    </span>
                                </div>
                            </div>
                            {userAccounts.length > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsSwitching(true)}
                                    className="text-xs h-8"
                                >
                                    Change Account
                                </Button>
                            )}
                        </div>
                    ) : userAccounts.length === 0 ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-dashboard bg-white/60 dark:bg-white/5">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                You don&apos;t have any MT5 accounts connected yet. Connect your account to enter the tournament.
                            </span>
                            <Link href="/dashboard/rules">
                                <Button variant="outline" size="sm" className="text-xs font-bold">
                                    Connect MT5 Account <ArrowRight size={13} className="ml-1" />
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-dashboard bg-white/70 dark:bg-white/5 backdrop-blur-xs">
                            <div className="space-y-0.5">
                                <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <span>{userEnrollment ? "Switch Tournament Account" : "Select MT5 Account to Compete"}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Only closed trades synced within the sprint window count towards the leaderboard.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                    <SelectTrigger className="h-9 w-[220px] text-xs font-semibold">
                                        <SelectValue placeholder="Choose account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userAccounts.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                                #{acc.accountNumber || "Acc"} - {acc.name} ({acc.broker || "MT5"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={handleJoin}
                                    isLoading={isJoining}
                                    className="h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black shrink-0"
                                >
                                    {userEnrollment ? "Update Account" : "Enroll Account"}
                                </Button>
                                {isSwitching && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsSwitching(false)}
                                        className="h-9 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Guardrails & Rules Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashboard">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-2.5 py-1">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Min {minTrades} Closed Trades
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-2.5 py-1">
                            <AlertCircle size={14} className="text-amber-500" />
                            Max {maxDrawdown}% Drawdown
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-2.5 py-1">
                            <Zap size={14} className="text-sky-500" />
                            Scoring: {scoringMetric === "win_rate" ? "Win Rate %" : "Net PnL ($)"}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRules(!showRules)}
                        className="text-xs font-bold"
                    >
                        {showRules ? "Hide Sprint Rules" : "View Sprint Rules & Criteria"}
                    </Button>
                </div>

                {/* Expandable Rules Detail */}
                {showRules && (
                    <div className="rounded-xl border border-dashboard bg-white/90 dark:bg-[#141720] p-4 text-xs space-y-3 animate-in fade-in duration-200">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <Award size={16} className="text-amber-500" />
                            Competition Governance &amp; Fair Play Rules
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600 dark:text-gray-400">
                            <div className="space-y-1">
                                <p className="font-bold text-gray-800 dark:text-gray-200">1. Eligibility &amp; Accounts</p>
                                <p>
                                    {eligibleBrokers.length > 0
                                        ? `Eligible brokers: ${eligibleBrokers.join(", ")}.`
                                        : "Open to all MT5 accounts connected via EA Trade Manager."}{" "}
                                    Account telemetry must be actively synced.
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-800 dark:text-gray-200">2. Scoring Metric</p>
                                <p>
                                    Rankings are ordered by verified{" "}
                                    {scoringMetric === "win_rate" ? "Win Rate (%)" : "Total Net PnL ($)"}{" "}
                                    over the competition window with a minimum threshold of {minTrades} closed trades.
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-800 dark:text-gray-200">3. Risk Disqualification</p>
                                <p>
                                    Any account experiencing trailing equity drawdown exceeding {maxDrawdown}%
                                    is disqualified to prevent reckless high-risk lot sizing.
                                </p>
                            </div>
                        </div>
                        {competition.rules && (
                            <div className="pt-2 border-t border-dashboard/50 text-gray-500 dark:text-gray-400 italic">
                                Special terms: {competition.rules}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
