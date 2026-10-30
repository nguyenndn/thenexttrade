"use client";

import { useState, useEffect } from "react";
import { X, Trophy, Calendar, DollarSign, ShieldAlert, Award, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    createCompetition,
    updateCompetition,
    type CreateCompetitionInput,
    type CompetitionPrizeItem,
} from "@/actions/admin/competitions";

interface CompetitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    competition?: any | null;
    onSuccess?: () => void;
}

export function CompetitionModal({
    isOpen,
    onClose,
    competition,
    onSuccess,
}: CompetitionModalProps) {
    const isEdit = !!competition;

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED">("DRAFT");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [prizePool, setPrizePool] = useState<number>(1000);
    const [rank1Reward, setRank1Reward] = useState("$500");
    const [rank2Reward, setRank2Reward] = useState("$300");
    const [rank3Reward, setRank3Reward] = useState("$200");
    const [minTrades, setMinTrades] = useState<number>(10);
    const [maxDrawdown, setMaxDrawdown] = useState<number>(10.0);
    const [eligibleBrokers, setEligibleBrokers] = useState("ALL");
    const [scoringMetric, setScoringMetric] = useState<"currency" | "percentage">("currency");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (competition) {
            setTitle(competition.title || "");
            setSlug(competition.slug || "");
            setDescription(competition.description || "");
            setStatus(competition.status || "DRAFT");
            setStartDate(
                competition.startDate
                    ? new Date(competition.startDate).toISOString().slice(0, 16)
                    : ""
            );
            setEndDate(
                competition.endDate
                    ? new Date(competition.endDate).toISOString().slice(0, 16)
                    : ""
            );
            setPrizePool(competition.prizePool ?? 1000);
            setMinTrades(competition.minTrades ?? 10);
            setMaxDrawdown(competition.maxDrawdown ?? 10.0);
            setEligibleBrokers(competition.eligibleBrokers || "ALL");
            setScoringMetric(competition.scoringMetric || "currency");

            if (Array.isArray(competition.prizes) && competition.prizes.length >= 3) {
                setRank1Reward(competition.prizes[0]?.reward || "$500");
                setRank2Reward(competition.prizes[1]?.reward || "$300");
                setRank3Reward(competition.prizes[2]?.reward || "$200");
            }
        } else {
            // Default: current month start & end
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);

            setTitle(`${now.toLocaleString("en-US", { month: "long" })} Trading Sprint`);
            setSlug("");
            setDescription("Monthly verified MT5 trading tournament with institutional risk telemetry.");
            setStatus("DRAFT");
            setStartDate(start.toISOString().slice(0, 16));
            setEndDate(end.toISOString().slice(0, 16));
            setPrizePool(1000);
            setRank1Reward("$500");
            setRank2Reward("$300");
            setRank3Reward("$200");
            setMinTrades(10);
            setMaxDrawdown(10.0);
            setEligibleBrokers("ALL");
            setScoringMetric("currency");
        }
    }, [competition, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const prizes: CompetitionPrizeItem[] = [
            { rank: 1, reward: rank1Reward, title: "Champion" },
            { rank: 2, reward: rank2Reward, title: "Runner-up" },
            { rank: 3, reward: rank3Reward, title: "Podium" },
        ];

        const payload: CreateCompetitionInput = {
            title,
            slug: slug || undefined,
            description,
            status,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            prizePool: Number(prizePool) || 0,
            prizes,
            minTrades: Number(minTrades) || 10,
            maxDrawdown: Number(maxDrawdown) || 10.0,
            eligibleBrokers,
            scoringMetric,
        };

        try {
            if (isEdit) {
                const res = await updateCompetition(competition.id, payload);
                if (res.error) {
                    toast.error(res.error);
                } else {
                    toast.success("Competition updated successfully.");
                    onSuccess?.();
                    onClose();
                }
            } else {
                const res = await createCompetition(payload);
                if (res.error) {
                    toast.error(res.error);
                } else {
                    toast.success("Competition created successfully.");
                    onSuccess?.();
                    onClose();
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save competition.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-dashboard pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {isEdit ? "Edit Competition" : "Create New Competition"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Configure rules, dates, prize pool, and telemetry constraints.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onClose}
                        className="rounded-lg h-8 w-8"
                        aria-label="Close modal"
                    >
                        <X size={16} />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Competition Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Status
                            </label>
                            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                <SelectTrigger className="w-full px-3.5 py-2 h-auto rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1E2230] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRAFT">DRAFT (Hidden)</SelectItem>
                                    <SelectItem value="UPCOMING">UPCOMING (Announced)</SelectItem>
                                    <SelectItem value="ACTIVE">ACTIVE (Live Scoring)</SelectItem>
                                    <SelectItem value="ENDED">ENDED (Finalized)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <Calendar size={13} className="text-amber-500" /> Start Date &amp; Time *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <Calendar size={13} className="text-amber-500" /> End Date &amp; Time *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            />
                        </div>
                    </div>

                    {/* Prize Pool & Breakdown */}
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <DollarSign size={14} /> Prize Pool Structure
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Total Pool ($):</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    value={prizePool}
                                    onChange={(e) => setPrizePool(Number(e.target.value))}
                                    className="w-24 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-right font-black text-amber-600 dark:text-amber-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                    <Award size={13} className="text-amber-500 shrink-0" /> 1st Place
                                </label>
                                <input
                                    type="text"
                                    value={rank1Reward}
                                    onChange={(e) => setRank1Reward(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                    <Award size={13} className="text-gray-400 shrink-0" /> 2nd Place
                                </label>
                                <input
                                    type="text"
                                    value={rank2Reward}
                                    onChange={(e) => setRank2Reward(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                    <Award size={13} className="text-amber-700 dark:text-amber-600 shrink-0" /> 3rd Place
                                </label>
                                <input
                                    type="text"
                                    value={rank3Reward}
                                    onChange={(e) => setRank3Reward(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Risk & Telemetry Constraints */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <Award size={13} className="text-amber-500" /> Min Closed Trades
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={minTrades}
                                onChange={(e) => setMinTrades(Number(e.target.value))}
                                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <ShieldAlert size={13} className="text-red-500" /> Max Drawdown (%)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                step="0.5"
                                value={maxDrawdown}
                                onChange={(e) => setMaxDrawdown(Number(e.target.value))}
                                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Scoring Metric
                            </label>
                            <Select value={scoringMetric} onValueChange={(val: any) => setScoringMetric(val)}>
                                <SelectTrigger className="w-full px-3.5 py-2 h-auto rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1E2230] text-sm text-gray-900 dark:text-white focus:outline-none">
                                    <SelectValue placeholder="Select metric" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="currency">Net PnL ($ USD)</SelectItem>
                                    <SelectItem value="percentage">Win Rate (%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Eligible Brokers */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Eligible Brokers (Comma separated or &quot;ALL&quot;)
                        </label>
                        <input
                            type="text"
                            value={eligibleBrokers}
                            onChange={(e) => setEligibleBrokers(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none"
                        />
                    </div>

                    {/* Description / Rules */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <FileText size={13} className="text-gray-400" /> Description &amp; Custom Rules
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-dashboard">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : isEdit ? "Update Competition" : "Create Competition"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
