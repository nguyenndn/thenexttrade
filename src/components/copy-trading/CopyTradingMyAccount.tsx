"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
    Copy,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Shield,
    Server,
    Wallet,
    Hash,
    TrendingUp,
    Wifi,
    WifiOff,
    DollarSign,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Layers,
    Landmark,
    BadgeCheck,
    Trash2,
    Unplug,
    RefreshCw,
    AlertTriangle,
    Plus,
    Camera,
    CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import * as htmlToImage from "html-to-image";
import { CopyTradingRegistrationModal } from "./CopyTradingRegistrationModal";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
} from "recharts";
import type { PVSRAccountDetail } from "@/lib/pvsr-client";
import { toast } from "sonner";

type Registration = {
    id: string;
    fullName: string;
    email: string;
    telegramHandle: string | null;
    brokerName: string;
    customBrokerName: string | null;
    mt5Server: string | null;
    customServer: string | null;
    mt5AccountNumber: string;
    tradingCapital: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "DISCONNECTED";
    rejectReason: string | null;
    disconnectedAt: string | null;
    disconnectReason: string | null;
    createdAt: string;
};

function formatCurrency(value: number, showSign = false) {
    const prefix = showSign && value >= 0 ? "+" : showSign && value < 0 ? "-" : value < 0 ? "-" : "";
    return `${prefix}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
}

const statusDisplay: Record<string, { label: string; sublabel: string; color: string; dotColor: string; icon: React.ComponentType<{ size?: number }> }> = {
    PENDING: {
        label: "Pending Review",
        sublabel: "Your registration is being reviewed by our team",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dotColor: "bg-amber-500",
        icon: Clock,
    },
    APPROVED: {
        label: "Connected",
        sublabel: "Your account is actively copy trading",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dotColor: "bg-emerald-500",
        icon: CheckCircle2,
    },
    REJECTED: {
        label: "Rejected",
        sublabel: "Contact support for more information",
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        dotColor: "bg-red-500",
        icon: XCircle,
    },
    DISCONNECTED: {
        label: "Disconnected",
        sublabel: "Account is no longer connected",
        color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        dotColor: "bg-gray-500",
        icon: Unplug,
    },
};

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel,
    confirmColor = "red",
    onConfirm,
    onCancel,
    isLoading,
}: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor?: "red" | "primary";
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    if (!isOpen) return null;
    const colorClasses = confirmColor === "red"
        ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
        : "bg-primary hover:bg-primary/90 text-white shadow-primary/20";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1E2028] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${confirmColor === "red" ? "bg-red-500/10" : "bg-primary/10"}`}>
                        <AlertTriangle size={20} className={confirmColor === "red" ? "text-red-500" : "text-primary"} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${colorClasses} disabled:opacity-50`}
                    >
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Performance Section ───────────────────────────────────────────────────────
function AccountPerformanceView({ reg, pvsrData }: { reg: Registration; pvsrData: PVSRAccountDetail | null }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [calYear, setCalYear] = useState(2026);
    const [calMonth, setCalMonth] = useState(3); // April
    const calendarRef = useRef<HTMLDivElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    if (!pvsrData?.performance) {
        return (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex flex-col items-center py-10 text-gray-500">
                    <BarChart3 size={32} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold">No trading data available yet</p>
                    <p className="text-xs mt-1">Performance data will appear after the first trade</p>
                </div>
            </div>
        );
    }

    const perf = pvsrData.performance;
    const acctInfo = pvsrData.accountInfo;
    const isFrozen = reg.status === "DISCONNECTED";

    const monthName = new Date(calYear, calMonth).toLocaleString("en-US", { month: "long", year: "numeric" });
    const calendarDays = getCalendarDays(calYear, calMonth);
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    const monthlyTotal = Object.entries(perf.dailyCalendar)
        .filter(([key]) => {
            const d = new Date(key);
            return d.getFullYear() === calYear && d.getMonth() === calMonth;
        })
        .reduce((sum, [, val]) => sum + val.profit, 0);

    const getWeeklyTotal = (week: (number | null)[]): number => {
        return week.reduce<number>((sum, day) => {
            if (!day) return sum;
            const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return sum + (perf.dailyCalendar[key]?.profit || 0);
        }, 0);
    };

    const prevMonth = () => {
        if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
        else setCalMonth(calMonth - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
        else setCalMonth(calMonth + 1);
    };

    const handleScreenshot = React.useCallback(async () => {
        if (!calendarRef.current) return;
        try {
            setIsCapturing(true);
            const dataUrl = await htmlToImage.toPng(calendarRef.current, {
                quality: 1,
                pixelRatio: 3,
                backgroundColor: isDark ? '#1E2028' : '#ffffff',
                style: { margin: '0' },
            });
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Trading-Calendar-${monthName.replace(' ', '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Screenshot saved successfully!');
        } catch (error: any) {
            console.error('Screenshot error:', error);
            toast.error(error instanceof Error ? error.message : (error?.message || 'Failed to capture screenshot'));
        } finally {
            setIsCapturing(false);
        }
    }, [monthName, isDark]);

    // Map growthChartArray for recharts
    const equityData = perf.growthChartArray.map(p => ({
        date: new Date(p.date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }),
        balance: p.balance,
        dailyProfit: p.dailyProfit,
    }));

    return (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            {/* Frozen banner for disconnected */}
            {isFrozen && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <WifiOff size={14} className="text-gray-500" />
                    <p className="text-xs font-bold text-gray-500">Disconnected — showing historical data</p>
                </div>
            )}

            {/* Account Info bar */}
            {acctInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Balance</span>
                        <p className="text-base font-black text-gray-800 dark:text-white mt-0.5">{formatCurrency(acctInfo.balance)}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Equity</span>
                        <p className="text-base font-black text-gray-800 dark:text-white mt-0.5">{formatCurrency(acctInfo.equity)}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {acctInfo.accountStatus === "ONLINE"
                                ? <><Wifi size={12} className="text-emerald-500" /><span className="text-sm font-bold text-emerald-500">Online</span></>
                                : <><WifiOff size={12} className="text-gray-400" /><span className="text-sm font-bold text-gray-400">Offline</span></>
                            }
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Drawdown</span>
                        <p className="text-base font-black text-red-500 mt-0.5">{acctInfo.drawdownPercent.toFixed(2)}%</p>
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Highest Balance</span>
                    <p className="text-lg font-black text-primary mt-1">{formatCurrency(perf.coreMetrics.highestBalance)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Net Profit</span>
                    <p className="text-lg font-black text-primary mt-1">{formatCurrency(perf.advancedStats.totalNetProfit, true)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Growth</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <TrendingUp size={16} className="text-primary" />
                        <p className="text-lg font-black text-primary">+{perf.advancedStats.growthPercent}%</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Max Drawdown</span>
                    <p className="text-lg font-black text-red-500 mt-1">{perf.advancedStats.maxDrawdownPercent.toFixed(2)}%</p>
                </div>
            </div>

            {/* Win Rate + Key Stats + Recovery */}
            <div className="grid md:grid-cols-3 gap-3">
                {/* Win Rate Donut */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-6 flex flex-col items-center justify-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3">Win Rate</p>
                    <div className="relative w-20 h-20 mb-2">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth="6" fill="none" />
                            <circle cx="40" cy="40" r="34" stroke="hsl(var(--primary))" strokeWidth="6" fill="none" strokeLinecap="round"
                                strokeDasharray={`${(perf.advancedStats.winRatePercent / 100) * 213.6} 213.6`}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-base font-black text-gray-700 dark:text-white">
                            {perf.advancedStats.winRatePercent}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Winning trades</p>
                </div>

                {/* Key Stats */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-5 flex flex-col justify-center">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Wins / Losses</span><span className="font-black text-gray-700 dark:text-white">{perf.advancedStats.winCount}W / {perf.advancedStats.lossCount}L</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Total Trades</span><span className="font-black text-gray-700 dark:text-white">{perf.advancedStats.totalTrades}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Profit Factor</span><span className="font-black text-gray-700 dark:text-white">{perf.advancedStats.profitFactor.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Recovery Factor</span><span className="font-black text-gray-700 dark:text-white">{perf.advancedStats.recoveryFactor.toFixed(1)}</span></div>
                    </div>
                </div>

                {/* Best/Worst + Verified */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-5 flex flex-col justify-between">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Best Trade</span><span className="font-black text-primary">{formatCurrency(perf.advancedStats.bestTrade, true)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Worst Trade</span><span className="font-black text-red-500">{formatCurrency(perf.advancedStats.worstTrade)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Avg Hold Time</span><span className="font-black text-gray-700 dark:text-white">{perf.advancedStats.avgHoldTime}</span></div>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 mt-4">
                        <BadgeCheck size={16} className="text-primary shrink-0" />
                        <p className="text-xs font-bold text-primary">Verified — Data synced from MT5</p>
                    </div>
                </div>
            </div>

            {/* Equity Curve */}
            <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-base">Equity Curve</h3>
                            <p className="text-xs text-gray-500 font-medium">Cumulative Net Profit</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Net Profit</p>
                        <p className={`text-lg font-black ${perf.advancedStats.totalNetProfit >= 0 ? "text-primary" : "text-red-500"}`}>
                            {formatCurrency(perf.advancedStats.totalNetProfit, true)}
                        </p>
                    </div>
                </div>

                <div className="h-[340px] w-full overflow-x-auto overflow-y-hidden [&_svg]:outline-none [&_.recharts-wrapper]:outline-none scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 pb-2">
                    <div className="min-w-[600px] h-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                            <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <defs>
                                    <linearGradient id={`ctGrad-${reg.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00C888" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#00C888" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6"} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }} dy={15} minTickGap={40} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }} tickFormatter={(v) => `$${v.toLocaleString()}`} domain={["auto", "auto"]} width={80} />
                                <Tooltip content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</p>
                                                <p className="text-sm font-black text-gray-700 dark:text-white">Balance: {formatCurrency(payload[0].value as number)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Area type="monotone" dataKey="balance" stroke="#00C888" strokeWidth={3} fillOpacity={1} fill={`url(#ctGrad-${reg.id})`} animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Trading Calendar */}
            <div ref={calendarRef} className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <CalendarDays size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">Trading Calendar</h3>
                            <p className="text-xs text-gray-500">Daily P&L overview</p>
                        </div>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 hidden sm:block">
                        Monthly P/L:{" "}
                        <span className={monthlyTotal >= 0 ? "text-primary" : "text-red-500"}>
                            {formatCurrency(monthlyTotal, true)}
                        </span>
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={prevMonth}
                            className="rounded-lg border-0"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={18} />
                        </Button>
                        <span className="text-[15px] font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                            {monthName}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={nextMonth}
                            className="rounded-lg border-0"
                            aria-label="Next month"
                        >
                            <ChevronRight size={18} />
                        </Button>

                        <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1"></div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleScreenshot}
                            disabled={isCapturing}
                            className={`rounded-lg ${isCapturing ? 'opacity-50' : ''}`}
                            title="Screenshot Report"
                            aria-label="Download screenshot"
                        >
                            {isCapturing ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <Camera size={16} className="text-gray-600" />}
                        </Button>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <div className="min-w-[768px]">
                        <div className="grid grid-cols-8 gap-2 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Weekly"].map((d) => (
                                <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-8 gap-2">
                            {weeks.map((week, wi) => {
                                const paddedWeek = [...week];
                                while (paddedWeek.length < 7) paddedWeek.push(null);
                                const weeklyTotal_w = getWeeklyTotal(paddedWeek);
                                let weeklyTradeDays = 0;
                                paddedWeek.forEach((day) => {
                                    if (day) {
                                        const k = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                        if (perf.dailyCalendar[k] !== undefined) weeklyTradeDays++;
                                    }
                                });

                                return (
                                    <React.Fragment key={`week-${wi}`}>
                                        {paddedWeek.map((day, di) => {
                                            if (!day) return <div key={`w${wi}-e${di}`} className="min-h-[80px]" />;

                                            const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                            const entry = perf.dailyCalendar[key];
                                            const hasPnl = entry !== undefined;
                                            const pnl = entry?.profit ?? 0;

                                            return (
                                                <div key={`w${wi}-d${di}`}
                                                    className={`min-h-[80px] p-2 rounded-xl flex flex-col items-center justify-center transition-all relative border
                                                        ${hasPnl ? pnl >= 0
                                                            ? "bg-emerald-50/80 dark:bg-primary/10 text-emerald-600 dark:text-primary border-emerald-100/50 dark:border-primary/20 hover:brightness-95 dark:hover:brightness-110"
                                                            : "bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/20 hover:brightness-95 dark:hover:brightness-110"
                                                        : "bg-gray-50 dark:bg-white/5 text-gray-500 border-transparent"}`}
                                                >
                                                    <span className={`text-[10px] font-bold absolute top-1.5 left-2 ${hasPnl ? "text-gray-700 dark:text-gray-100" : "text-gray-700 dark:text-gray-500"}`}>
                                                        {day}
                                                    </span>
                                                    {hasPnl && (
                                                        <div className="flex flex-col items-center mt-2.5">
                                                            <span className="text-base sm:text-lg tracking-tighter whitespace-nowrap font-bold leading-none mb-0.5">
                                                                {formatCurrency(pnl, true)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Weekly Summary Cell */}
                                        <div className="min-h-[80px] p-2 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 relative shadow-sm hover:shadow-md transition-all">
                                            <span className={`text-[10px] font-bold absolute top-1.5 left-2 ${weeklyTotal_w >= 0 ? "text-primary" : "text-red-500"}`}>W{wi + 1}</span>
                                            <div className="flex flex-col items-center mt-2.5 w-full">
                                                <span className={`w-full text-center px-0.5 text-base sm:text-lg tracking-tighter whitespace-nowrap font-bold leading-none mb-0.5 ${weeklyTotal_w >= 0 ? "text-primary" : "text-red-500"}`}>
                                                    {formatCurrency(weeklyTotal_w, true)}
                                                </span>
                                                <span className="text-sm opacity-80 font-medium text-gray-700 dark:text-gray-300 w-full text-center">
                                                    {weeklyTradeDays} days
                                                </span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">Profit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">Loss</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-white/10" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">No trades</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CopyTradingMyAccount() {
    const [showRegistration, setShowRegistration] = useState(false);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // PVSR data cache per mt5 account
    const [pvsrCache, setPvsrCache] = useState<Record<string, PVSRAccountDetail | null>>({});
    const [loadingPvsr, setLoadingPvsr] = useState<Record<string, boolean>>({});

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        confirmColor: "red" | "primary";
        action: () => Promise<void>;
    }>({ isOpen: false, title: "", message: "", confirmLabel: "", confirmColor: "red", action: async () => {} });
    const [confirmLoading, setConfirmLoading] = useState(false);

    const fetchingRef = useRef<Set<string>>(new Set());
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await fetch("/api/copy-trading/my-registrations");
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data.registrations || []);
                // Fetch PVSR data for all approved accounts (for status badge)
                const approvedAccounts = (data.registrations || []).filter(
                    (r: Registration) => r.status === "APPROVED" || r.status === "DISCONNECTED"
                );
                approvedAccounts.forEach((r: Registration) => fetchPvsrData(r.mt5AccountNumber));
                // Auto-expand first one
                if (approvedAccounts.length > 0) {
                    setExpandedId(approvedAccounts[0].id);
                }
            }
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPvsrData = async (mt5Account: string) => {
        if (fetchingRef.current.has(mt5Account)) return;
        fetchingRef.current.add(mt5Account);
        setLoadingPvsr(prev => ({ ...prev, [mt5Account]: true }));
        try {
            const res = await fetch(`/api/copy-trading/account/${mt5Account}`);
            if (res.ok) {
                const data = await res.json();
                setPvsrCache(prev => ({ ...prev, [mt5Account]: data }));
            }
        } catch {
            // silently fail
        } finally {
            fetchingRef.current.delete(mt5Account);
            setLoadingPvsr(prev => ({ ...prev, [mt5Account]: false }));
        }
    };

    const handleExpand = (reg: Registration) => {
        const isExpanding = expandedId !== reg.id;
        setExpandedId(isExpanding ? reg.id : null);
        if (isExpanding && (reg.status === "APPROVED" || reg.status === "DISCONNECTED")) {
            fetchPvsrData(reg.mt5AccountNumber);
        }
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const cancelRegistration = (reg: Registration) => {
        setConfirmDialog({
            isOpen: true,
            title: "Cancel Registration?",
            message: `This will cancel your pending registration for MT5 account ${reg.mt5AccountNumber}. You can register again later.`,
            confirmLabel: "Cancel Registration",
            confirmColor: "red",
            action: async () => {
                const res = await fetch(`/api/copy-trading/account/${reg.mt5AccountNumber}/delete`, { method: "DELETE" });
                if (res.ok) {
                    setRegistrations(prev => prev.filter(r => r.id !== reg.id));
                    toast.success("Registration cancelled successfully");
                } else {
                    const data = await res.json().catch(() => null);
                    toast.error(data?.error || "Failed to cancel registration");
                }
            },
        });
    };

    const disconnectAccount = (reg: Registration) => {
        setConfirmDialog({
            isOpen: true,
            title: "Disconnect Account?",
            message: `This will disconnect your MT5 account ${reg.mt5AccountNumber} from copy trading. You will stop receiving trade signals. Historical data will be preserved.`,
            confirmLabel: "Disconnect",
            confirmColor: "red",
            action: async () => {
                const res = await fetch(`/api/copy-trading/account/${reg.mt5AccountNumber}/disconnect`, { method: "POST" });
                if (res.ok) {
                    setRegistrations(prev => prev.map(r =>
                        r.id === reg.id ? { ...r, status: "DISCONNECTED" as const, disconnectedAt: new Date().toISOString() } : r
                    ));
                    toast.success("Account disconnected. You will no longer receive trade signals.");
                } else {
                    const data = await res.json().catch(() => null);
                    toast.error(data?.error || "Failed to disconnect account");
                }
            },
        });
    };

    const deleteRegistration = (reg: Registration) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Registration?",
            message: `This will permanently remove the registration for MT5 account ${reg.mt5AccountNumber}. This action cannot be undone.`,
            confirmLabel: "Delete",
            confirmColor: "red",
            action: async () => {
                const res = await fetch(`/api/copy-trading/account/${reg.mt5AccountNumber}/delete`, { method: "DELETE" });
                if (res.ok) {
                    setRegistrations(prev => prev.filter(r => r.id !== reg.id));
                    if (expandedId === reg.id) setExpandedId(null);
                    toast.success("Registration deleted successfully");
                } else {
                    const data = await res.json().catch(() => null);
                    toast.error(data?.error || "Failed to delete registration");
                }
            },
        });
    };

    const reconnectAccount = (reg: Registration) => {
        setConfirmDialog({
            isOpen: true,
            title: "Reconnect Account?",
            message: `This will send a reconnection request for MT5 account ${reg.mt5AccountNumber}. Your account will be reviewed by the PVSR team before reactivation.`,
            confirmLabel: "Reconnect",
            confirmColor: "primary",
            action: async () => {
                const res = await fetch("/api/copy-trading/reconnect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mt5AccountNumber: reg.mt5AccountNumber }),
                });
                if (res.ok) {
                    setRegistrations(prev => prev.map(r =>
                        r.id === reg.id ? { ...r, status: "PENDING" as const, disconnectedAt: null, disconnectReason: null } : r
                    ));
                    setExpandedId(null);
                    toast.success("Reconnection request sent! Awaiting approval.");
                } else {
                    const data = await res.json().catch(() => null);
                    toast.error(data?.error || "Failed to send reconnection request");
                }
            },
        });
    };

    const handleConfirm = async () => {
        setConfirmLoading(true);
        try {
            await confirmDialog.action();
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
            console.error("[Copy Trading] Action error:", error);
        } finally {
            setConfirmLoading(false);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
        );
    }

    if (registrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 border border-gray-200 dark:border-white/[0.06]">
                    <Copy size={24} className="text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-1">No Copy Trading Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 text-center max-w-sm">
                    Connect your MT5 account to start receiving institutional-grade trade signals from PVSR Capital.
                </p>
                <Button
                    onClick={() => setShowRegistration(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    Register Now <ArrowRight size={16} />
                </Button>

                <CopyTradingRegistrationModal
                    isOpen={showRegistration}
                    onClose={() => { setShowRegistration(false); fetchRegistrations(); }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Account cards */}
            {registrations.map((reg) => {
                const sd = statusDisplay[reg.status] || statusDisplay.PENDING;
                const broker = reg.brokerName === "Any Broker" ? (reg.customBrokerName || "Custom Broker") : reg.brokerName;
                const server = reg.customServer || reg.mt5Server || "—";
                const StatusIcon = sd.icon;
                const isExpanded = expandedId === reg.id;
                const hasPerformance = reg.status === "APPROVED" || reg.status === "DISCONNECTED";
                const pvsrInfo = pvsrCache[reg.mt5AccountNumber];
                const capital = pvsrInfo?.accountInfo?.balance ?? reg.tradingCapital;

                return (
                    <div key={reg.id} className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
                        {/* Status header bar */}
                        <div className={`px-5 py-3 flex items-center gap-2.5 border-b border-gray-100 dark:border-white/5 ${sd.color}`}>
                            <div className="flex items-center gap-2 flex-1">
                                <StatusIcon size={16} />
                                <span className="text-sm font-bold">{sd.label}</span>
                                <span className="text-sm font-semibold hidden sm:inline">— {sd.sublabel}</span>
                            </div>
                            {reg.status === "APPROVED" && (() => {
                                const acctStatus = pvsrInfo?.accountInfo?.accountStatus;
                                const isOnline = acctStatus === "ONLINE";
                                const isOffline = acctStatus === "OFFLINE";
                                return (
                                    <div className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] backdrop-blur-sm shadow-sm ${
                                        isOnline
                                            ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-emerald-500/25"
                                            : isOffline
                                            ? "bg-gray-900/5 text-gray-500 dark:bg-white/5 dark:text-gray-400 ring-1 ring-gray-500/15"
                                            : "bg-gray-900/5 text-gray-400 dark:bg-white/5 dark:text-gray-500 ring-1 ring-gray-500/10"
                                    }`}>
                                        <span className="relative flex h-2 w-2">
                                            {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />}
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                                isOnline ? "bg-emerald-500" : isOffline ? "bg-gray-400 dark:bg-gray-500" : "bg-gray-300 dark:bg-gray-600"
                                            }`} />
                                        </span>
                                        {isOnline ? "Online" : isOffline ? "Offline" : "Awaiting"}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Account details */}
                        <div className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 mt-0.5">
                                        <Shield size={13} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Broker</span>
                                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{broker}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 mt-0.5">
                                        <Hash size={13} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">MT5 Account</span>
                                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5 font-mono">{reg.mt5AccountNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 mt-0.5">
                                        <Server size={13} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Server</span>
                                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{server}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 mt-0.5">
                                        <Wallet size={13} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Capital</span>
                                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{formatCurrency(capital)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reject reason */}
                            {reg.status === "REJECTED" && reg.rejectReason && (
                                <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        <span className="font-bold">Reason:</span> {reg.rejectReason}
                                    </p>
                                </div>
                            )}

                            {/* Disconnect info */}
                            {reg.status === "DISCONNECTED" && reg.disconnectedAt && (
                                <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                    <p className="text-xs text-gray-500">
                                        <span className="font-bold">Disconnected:</span>{" "}
                                        {new Date(reg.disconnectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        {reg.disconnectReason && ` — ${reg.disconnectReason}`}
                                    </p>
                                </div>
                            )}

                            {/* Footer: actions + expand toggle */}
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-gray-500">
                                        Submitted {new Date(reg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </span>

                                    {/* Action buttons per status */}
                                    {reg.status === "PENDING" && (
                                        <button
                                            onClick={() => cancelRegistration(reg)}
                                            className="ml-2 flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <Trash2 size={12} /> Cancel
                                        </button>
                                    )}
                                    {reg.status === "APPROVED" && (
                                        <button
                                            onClick={() => disconnectAccount(reg)}
                                            className="ml-2 flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <Unplug size={12} /> Disconnect
                                        </button>
                                    )}
                                    {(reg.status === "REJECTED" || reg.status === "DISCONNECTED") && (
                                        <>
                                            <button
                                                onClick={() => deleteRegistration(reg)}
                                                className="ml-2 flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                            {reg.status === "DISCONNECTED" ? (
                                                <button
                                                    onClick={() => reconnectAccount(reg)}
                                                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                                                >
                                                    <RefreshCw size={12} /> Reconnect
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setShowRegistration(true)}
                                                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                                                >
                                                    <RefreshCw size={12} /> Register Again
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {hasPerformance && (
                                    <button
                                        onClick={() => handleExpand(reg)}
                                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        {isExpanded ? "Hide" : "View"} Performance
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                )}
                            </div>

                            {/* Inline Performance (expanded) */}
                            {hasPerformance && isExpanded && (
                                loadingPvsr[reg.mt5AccountNumber] ? (
                                    <div className="flex items-center justify-center py-12 mt-4 border-t border-gray-100 dark:border-white/5">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-500 font-medium">Loading performance data...</span>
                                    </div>
                                ) : (
                                    <AccountPerformanceView reg={reg} pvsrData={pvsrCache[reg.mt5AccountNumber] || null} />
                                )
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Add Account button */}
            <button
                onClick={() => setShowRegistration(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={16} />
                Add Another Account
            </button>

            <CopyTradingRegistrationModal
                isOpen={showRegistration}
                onClose={() => { setShowRegistration(false); fetchRegistrations(); }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmLabel={confirmDialog.confirmLabel}
                confirmColor={confirmDialog.confirmColor}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                isLoading={confirmLoading}
            />
        </div>
    );
}
