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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
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
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectReason: string | null;
    createdAt: string;
};

// Mock performance data — will be replaced by PVSR Capital API
interface AccountPerformance {
    highestBalance: number;
    balance: number;
    totalProfit: number;
    growth: number;
    winRate: number;
    wins: number;
    losses: number;
    totalTrades: number;
    profitFactor: number;
    swap: number;
    commission: number;
    maxDrawdown: { percent: number; amount: number };
    equityData: { date: string; balance: number }[];
    calendar: Record<string, number>;
}

const mockPerformance: Record<string, AccountPerformance> = {
    // Keyed by mt5AccountNumber — will be matched from API
    "default": {
        highestBalance: 15339.23,
        balance: 15325.54,
        totalProfit: 4824.87,
        growth: 48.25,
        winRate: 68.8,
        wins: 176,
        losses: 80,
        totalTrades: 256,
        profitFactor: 3.53,
        swap: 0.00,
        commission: 0.00,
        maxDrawdown: { percent: 100.00, amount: 1143.01 },
        equityData: [
            { date: "03/25", balance: 10000 },
            { date: "03/26", balance: 10250 },
            { date: "03/27", balance: 11800 },
            { date: "03/28", balance: 14200 },
            { date: "03/29", balance: 14950 },
            { date: "03/30", balance: 15100 },
            { date: "03/31", balance: 15050 },
            { date: "04/01", balance: 15200 },
            { date: "04/02", balance: 15325 },
        ],
        calendar: {
            "2026-04-01": 1651.63,
            "2026-04-02": 113.45,
        },
    },
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

const statusDisplay = {
    PENDING: {
        label: "Pending Review",
        sublabel: "Your registration is being reviewed by our team",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dotColor: "bg-amber-500",
        icon: Clock,
    },
    APPROVED: {
        label: "Approved",
        sublabel: "Account approved — awaiting connection setup",
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
};

// ── Performance Section (inline for approved accounts) ────────────────────────
function AccountPerformanceView({ reg }: { reg: Registration }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const perf = mockPerformance[reg.mt5AccountNumber] || mockPerformance["default"];

    const [calYear, setCalYear] = useState(2026);
    const [calMonth, setCalMonth] = useState(3);
    const monthName = new Date(calYear, calMonth).toLocaleString("en-US", { month: "long", year: "numeric" });
    const calendarDays = getCalendarDays(calYear, calMonth);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    const monthlyTotal = Object.entries(perf.calendar)
        .filter(([key]) => {
            const d = new Date(key);
            return d.getFullYear() === calYear && d.getMonth() === calMonth;
        })
        .reduce((sum, [, val]) => sum + val, 0);

    const getWeeklyTotal = (week: (number | null)[]): number => {
        return week.reduce<number>((sum, day) => {
            if (!day) return sum;
            const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return sum + (perf.calendar[key] || 0);
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

    return (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Highest Balance</span>
                    <p className="text-lg font-black text-primary mt-1">{formatCurrency(perf.highestBalance)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Balance</span>
                    <p className="text-lg font-black text-gray-800 dark:text-white mt-1">{formatCurrency(perf.balance)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Profit</span>
                    <p className="text-lg font-black text-primary mt-1">{formatCurrency(perf.totalProfit, true)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Growth</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        <TrendingUp size={16} className="text-primary" />
                        <p className="text-lg font-black text-primary">+{perf.growth}%</p>
                    </div>
                </div>
            </div>

            {/* Win Rate + Key Stats + Swap/Commission */}
            <div className="grid md:grid-cols-3 gap-3">
                {/* Win Rate Donut — matches DashboardHero style */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-6 flex flex-col items-center justify-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3">Win Rate</p>
                    <div className="relative w-20 h-20 mb-2">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth="6" fill="none" />
                            <circle
                                cx="40" cy="40" r="34"
                                stroke="hsl(var(--primary))"
                                strokeWidth="6"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${(perf.winRate / 100) * 213.6} 213.6`}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-base font-black text-gray-700 dark:text-white">
                            {perf.winRate}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Winning trades</p>
                </div>

                {/* Key Stats */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-5 flex flex-col justify-center">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Wins / Losses</span><span className="font-black text-gray-700 dark:text-white">{perf.wins}W / {perf.losses}L</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Total Trades</span><span className="font-black text-gray-700 dark:text-white">{perf.totalTrades}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Profit Factor</span><span className="font-black text-gray-700 dark:text-white">{perf.profitFactor.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Max Drawdown</span><span className="font-black text-red-500">{perf.maxDrawdown.percent.toFixed(2)}%</span></div>
                    </div>
                </div>

                {/* Swap/Commission + Verified badge */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl p-5 flex flex-col justify-between">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Swap</span><span className={`font-black ${perf.swap >= 0 ? "text-primary" : "text-red-500"}`}>{formatCurrency(perf.swap, true)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 font-bold text-[11px] uppercase">Commission</span><span className="font-black text-gray-700 dark:text-white">{formatCurrency(perf.commission)}</span></div>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 mt-4">
                        <BadgeCheck size={16} className="text-primary shrink-0" />
                        <p className="text-xs font-bold text-primary">Verified — Data synced from MT5</p>
                    </div>
                </div>
            </div>

            {/* Equity Curve — matches EquityCurve from /dashboard/analytics */}
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
                        <p className={`text-lg font-black ${perf.totalProfit >= 0 ? "text-primary" : "text-red-500"}`}>
                            {formatCurrency(perf.totalProfit, true)}
                        </p>
                    </div>
                </div>

                <div className="h-[340px] w-full overflow-x-auto overflow-y-hidden [&_svg]:outline-none [&_.recharts-wrapper]:outline-none scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 pb-2">
                    <div className="min-w-[600px] h-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={perf.equityData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <defs>
                                    <linearGradient id={`ctGrad-${reg.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00C888" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#00C888" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke={isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6"}
                                />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }}
                                    dy={15}
                                    minTickGap={40}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }}
                                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                                    domain={["auto", "auto"]}
                                    width={80}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl">
                                                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</p>
                                                    <p className="text-sm font-black text-gray-700 dark:text-white">
                                                        Balance: {formatCurrency(payload[0].value as number)}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#00C888"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill={`url(#ctGrad-${reg.id})`}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Trading Calendar — matches ProfitCalendar from /dashboard/analytics */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">Trading Calendar</h3>
                            <p className="text-xs text-gray-500">Daily P&L overview</p>
                        </div>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200">
                        Monthly P/L:{" "}
                        <span className={monthlyTotal >= 0 ? "text-primary" : "text-red-500"}>
                            {formatCurrency(monthlyTotal, true)}
                        </span>
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft size={18} className="text-gray-500" />
                        </button>
                        <span className="text-[15px] font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                            {monthName}
                        </span>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronRight size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Scrollable calendar grid */}
                <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <div className="min-w-[768px]">
                        {/* Day headers */}
                        <div className="grid grid-cols-8 gap-2 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Weekly"].map((d) => (
                                <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-8 gap-2">
                            {weeks.map((week, wi) => {
                                const paddedWeek = [...week];
                                while (paddedWeek.length < 7) paddedWeek.push(null);
                                const weeklyTotal_w = getWeeklyTotal(paddedWeek);
                                let weeklyTradeDays = 0;
                                paddedWeek.forEach((day) => {
                                    if (day) {
                                        const k = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                        if (perf.calendar[k] !== undefined) weeklyTradeDays++;
                                    }
                                });

                                return (
                                    <React.Fragment key={`week-${wi}`}>
                                        {paddedWeek.map((day, di) => {
                                            if (!day) return <div key={`w${wi}-e${di}`} className="min-h-[80px]" />;

                                            const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                            const pnl = perf.calendar[key];
                                            const hasPnl = pnl !== undefined;

                                            return (
                                                <div
                                                    key={`w${wi}-d${di}`}
                                                    className={`
                                                        min-h-[80px] p-2 rounded-xl flex flex-col items-center justify-center
                                                        transition-all hover:scale-105 hover:z-10 relative border
                                                        ${hasPnl
                                                            ? pnl >= 0
                                                                ? "bg-emerald-50/80 dark:bg-primary/10 text-emerald-600 dark:text-primary border-emerald-100/50 dark:border-primary/20"
                                                                : "bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/20"
                                                            : "bg-gray-50 dark:bg-white/5 text-gray-500 border-transparent"
                                                        }
                                                    `}
                                                >
                                                    <span className={`text-[10px] font-bold absolute top-1.5 left-2 ${
                                                        hasPnl ? "text-gray-700 dark:text-gray-100" : "text-gray-700 dark:text-gray-500"
                                                    }`}>
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
                                        <div className="min-h-[80px] p-2 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 relative shadow-sm hover:shadow-md transition-all hover:scale-105 hover:z-10">
                                            <span className={`text-[10px] font-bold absolute top-1.5 left-2 ${weeklyTotal_w >= 0 ? "text-primary" : "text-red-500"}`}>
                                                W{wi + 1}
                                            </span>
                                            <div className="flex flex-col items-center mt-2.5 w-full">
                                                <span className={`w-full text-center px-0.5 text-base sm:text-lg tracking-tighter whitespace-nowrap font-bold leading-none mb-0.5 ${
                                                    weeklyTotal_w >= 0 ? "text-primary" : "text-red-500"
                                                }`}>
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

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await fetch("/api/copy-trading/my-registrations");
            if (res.ok) {
                const data = await res.json();
                setRegistrations(data.registrations || []);
                // Auto-expand first approved account
                const firstApproved = (data.registrations || []).find((r: Registration) => r.status === "APPROVED");
                if (firstApproved) setExpandedId(firstApproved.id);
            }
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
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
                const sd = statusDisplay[reg.status];
                const broker = reg.brokerName === "Any Broker" ? (reg.customBrokerName || "Custom Broker") : reg.brokerName;
                const server = reg.brokerName === "Any Broker" ? (reg.customServer || "—") : (reg.mt5Server || "—");
                const StatusIcon = sd.icon;
                const isExpanded = expandedId === reg.id;
                const isApproved = reg.status === "APPROVED";

                return (
                    <div key={reg.id} className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
                        {/* Status header bar */}
                        <div className={`px-5 py-3 flex items-center gap-2.5 border-b border-gray-100 dark:border-white/5 ${sd.color}`}>
                            <div className="flex items-center gap-2 flex-1">
                                <StatusIcon size={16} />
                                <span className="text-sm font-bold">{sd.label}</span>
                                <span className="text-sm font-semibold hidden sm:inline">— {sd.sublabel}</span>
                            </div>
                            {isApproved && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-sm font-bold">Awaiting connection</span>
                                </div>
                            )}
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
                                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">${reg.tradingCapital.toLocaleString()}</p>
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

                            {/* Footer + expand toggle for approved accounts */}
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <span className="text-[11px] text-gray-500">
                                    Submitted {new Date(reg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                                {isApproved && (
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        {isExpanded ? "Hide" : "View"} Performance
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                )}
                            </div>

                            {/* Inline Performance (expanded) */}
                            {isApproved && isExpanded && (
                                <AccountPerformanceView reg={reg} />
                            )}
                        </div>
                    </div>
                );
            })}

            <CopyTradingRegistrationModal
                isOpen={showRegistration}
                onClose={() => { setShowRegistration(false); fetchRegistrations(); }}
            />
        </div>
    );
}
