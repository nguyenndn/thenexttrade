"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import {
    TrendingUp,
    TrendingDown,
    Wifi,
    WifiOff,
    DollarSign,
    BarChart3,
    Trophy,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Shield,
    Server,
    Layers,
    Landmark,
    BadgeCheck,
    Loader2,
} from "lucide-react";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AccountPerformance {
    id: string;
    name: string;
    broker: string;
    accountId: string;
    server: string;
    type: "MASTER" | "CLIENT";
    status: "ONLINE" | "OFFLINE";
    leverage: string;
    currency: string;
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
    deposit: number;
    withdrawal: number;
    equityData: { date: string; balance: number }[];
    calendar: Record<string, number>;
}

// ── Mock data (will be replaced by PVSR Capital API) ──────────────────────────
const mockAccounts: AccountPerformance[] = [
    {
        id: "acc-1",
        name: "Alpha Engine",
        broker: "Exness Technologies Ltd",
        accountId: "••••8547",
        server: "Exness-MT5Real38",
        type: "CLIENT",
        status: "ONLINE",
        leverage: "1:2000",
        currency: "USD",
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
        deposit: 10000.00,
        withdrawal: 0.00,
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
    {
        id: "acc-2",
        name: "Beta Fund",
        broker: "ICMarkets Global",
        accountId: "••••2291",
        server: "ICMarkets-MT5-4",
        type: "CLIENT",
        status: "ONLINE",
        leverage: "1:500",
        currency: "USD",
        highestBalance: 8920.00,
        balance: 8754.32,
        totalProfit: 1754.32,
        growth: 25.06,
        winRate: 72.1,
        wins: 89,
        losses: 34,
        totalTrades: 123,
        profitFactor: 2.87,
        swap: -12.50,
        commission: -45.80,
        maxDrawdown: { percent: 8.42, amount: 589.00 },
        deposit: 7000.00,
        withdrawal: 0.00,
        equityData: [
            { date: "03/28", balance: 7000 },
            { date: "03/29", balance: 7120 },
            { date: "03/30", balance: 7450 },
            { date: "03/31", balance: 7890 },
            { date: "04/01", balance: 8350 },
            { date: "04/02", balance: 8754 },
        ],
        calendar: {
            "2026-04-01": 460.00,
            "2026-04-02": 404.32,
        },
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
}

function formatCurrency(value: number, showSign = false) {
    const prefix = showSign && value >= 0 ? "+" : showSign && value < 0 ? "-" : value < 0 ? "-" : "";
    return `${prefix}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";

export function CopyTradingPerformance() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Account selector
    const [selectedId, setSelectedId] = useState(mockAccounts[0]?.id || "");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const data = mockAccounts.find((a) => a.id === selectedId) || mockAccounts[0];
    const hasMultiple = mockAccounts.length > 1;

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">No approved accounts found</p>
            </div>
        );
    }

    const [calYear, setCalYear] = useState(2026);
    const [calMonth, setCalMonth] = useState(3); // April = 3 (0-indexed)
    const monthName = new Date(calYear, calMonth).toLocaleString("en-US", { month: "long", year: "numeric" });
    const calendarDays = getCalendarDays(calYear, calMonth);

    // Calendar weekly totals
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    const monthlyTotal = Object.entries(data.calendar)
        .filter(([key]) => {
            const d = new Date(key);
            return d.getFullYear() === calYear && d.getMonth() === calMonth;
        })
        .reduce((sum, [, val]) => sum + val, 0);

    const getWeeklyTotal = (week: (number | null)[]): number => {
        return week.reduce<number>((sum, day) => {
            if (!day) return sum;
            const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return sum + (data.calendar[key] || 0);
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
        <div className="space-y-4">
            {/* Account Selector (only show when multiple accounts) */}
            {hasMultiple && (
                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#1A1D27] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${data.status === "ONLINE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                            <div className="text-left">
                                <p className="text-sm font-bold text-gray-700 dark:text-white">{data.name}</p>
                                <p className="text-[10px] text-gray-400">{data.broker} · {data.accountId}</p>
                            </div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full sm:w-80 bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] shadow-xl z-20 overflow-hidden">
                            {mockAccounts.map((acc) => (
                                <button
                                    key={acc.id}
                                    onClick={() => { setSelectedId(acc.id); setDropdownOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${
                                        acc.id === selectedId ? "bg-primary/5 dark:bg-primary/10" : ""
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${acc.status === "ONLINE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-700 dark:text-white truncate">{acc.name}</p>
                                        <p className="text-[10px] text-gray-400">{acc.broker} · {acc.accountId}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-xs font-black ${acc.growth >= 0 ? "text-primary" : "text-red-500"}`}>+{acc.growth}%</p>
                                        <p className="text-[10px] text-gray-400">{formatCurrency(acc.balance)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Row 1: Account Header + Statistics */}
            <div className="grid lg:grid-cols-5 gap-4">
                {/* Account Header — 3 cols */}
                <div className="lg:col-span-3 bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                {data.broker} · {data.accountId}
                            </p>
                            <h3 className="text-xl font-black text-gray-800 dark:text-white">{data.name}</h3>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                            data.status === "ONLINE"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-gray-100 dark:bg-white/5 text-gray-500"
                        }`}>
                            {data.status === "ONLINE" ? <Wifi size={12} /> : <WifiOff size={12} />}
                            {data.status}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Highest Balance</span>
                            <p className="text-lg font-black text-primary mt-0.5">{formatCurrency(data.highestBalance)}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance</span>
                            <p className="text-lg font-black text-gray-800 dark:text-white mt-0.5">{formatCurrency(data.balance)}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Profit</span>
                            <p className="text-lg font-black text-primary mt-0.5">{formatCurrency(data.totalProfit, true)}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Growth</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <TrendingUp size={16} className="text-primary" />
                                <p className="text-lg font-black text-primary">+{data.growth}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics — 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-wider">Statistics</h3>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Verified</span>
                    </div>

                    {/* Win Rate Donut */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative w-28 h-28">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6"} strokeWidth="10" />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="#00C888" strokeWidth="10"
                                    strokeDasharray={`${data.winRate * 2.51} ${251.2 - data.winRate * 2.51}`}
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="#EF4444" strokeWidth="10"
                                    strokeDasharray={`${(100 - data.winRate) * 2.51} ${251.2 - (100 - data.winRate) * 2.51}`}
                                    strokeDashoffset={`-${data.winRate * 2.51}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-primary">{data.winRate}%</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Win Rate</span>
                                <span className="text-[10px] text-gray-500">{data.wins}W / {data.losses}L</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats list */}
                    <div className="space-y-2 text-xs">
                        {[
                            { label: "Balance", value: formatCurrency(data.balance) },
                            { label: "Growth", value: `+${data.growth}%`, color: "text-primary" },
                            { label: "Total Trades", value: data.totalTrades.toString() },
                            { label: "Profit Factor", value: data.profitFactor.toFixed(2) },
                            { label: "Swap", value: formatCurrency(data.swap, true), color: "text-primary" },
                            { label: "Commission", value: formatCurrency(data.commission) },
                            { label: "Max Drawdown", value: `${data.maxDrawdown.percent.toFixed(2)}% / ${formatCurrency(data.maxDrawdown.amount)}`, color: "text-red-500" },
                        ].map((stat) => (
                            <div key={stat.label} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5 last:border-0">
                                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">{stat.label}</span>
                                <span className={`font-black text-gray-700 dark:text-white ${stat.color || ""}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Performance History Chart */}
            <div className="bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-wider">Performance History</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">6 Trading Days / 9 Days Lifespan</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                            <span className="text-gray-500 uppercase tracking-wider">Balance</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                            <span className="text-gray-500 uppercase tracking-wider">Deposit</span>
                        </div>
                    </div>
                </div>

                <div className="h-[280px] w-full overflow-x-auto overflow-y-hidden [&_svg]:outline-none [&_.recharts-wrapper]:outline-none pb-2">
                    <div className="min-w-[500px] h-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={data.equityData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="ctGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00C888" stopOpacity={0.15} />
                                        <stop offset="100%" stopColor="#00C888" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6"} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }} dy={15} />
                                <YAxis
                                    axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }}
                                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                                    domain={["auto", "auto"]}
                                    width={75}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const val = payload[0].value as number;
                                            return (
                                                <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</p>
                                                    <p className="text-sm font-black text-gray-700 dark:text-white">
                                                        Balance: {formatCurrency(val)}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="balance" stroke="#00C888" strokeWidth={2.5} fillOpacity={1} fill="url(#ctGradient)" animationDuration={1200} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Trading Calendar + Account Info */}
            <div className="grid lg:grid-cols-5 gap-4">
                {/* Trading Calendar — 3 cols */}
                <div className="lg:col-span-3 bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-wider">Trading Calendar</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                <ChevronLeft size={16} className="text-gray-400" />
                            </button>
                            <span className="text-xs font-bold text-gray-700 dark:text-white min-w-[120px] text-center">{monthName}</span>
                            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-8 gap-0.5 text-center">
                        {/* Header */}
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT", "WEEKLY"].map((d) => (
                            <div key={d} className="py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
                        ))}

                        {/* Weeks */}
                        {weeks.map((week, wi) => {
                            // Pad week to 7 days
                            const paddedWeek = [...week];
                            while (paddedWeek.length < 7) paddedWeek.push(null);
                            const weeklyTotal = getWeeklyTotal(paddedWeek);

                            return paddedWeek.concat([null]).map((day, di) => {
                                if (di === 7) {
                                    // Weekly total column
                                    return (
                                        <div key={`w${wi}-total`} className={`py-2 rounded-lg text-[10px] font-bold ${
                                            weeklyTotal > 0
                                                ? "bg-primary/10 text-primary"
                                                : weeklyTotal < 0
                                                ? "bg-red-500/10 text-red-500"
                                                : "text-gray-300"
                                        }`}>
                                            {weeklyTotal !== 0 ? formatCurrency(weeklyTotal, true) : ""}
                                        </div>
                                    );
                                }

                                if (!day) return <div key={`w${wi}-e${di}`} className="py-2" />;

                                const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const pnl = data.calendar[key];
                                const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;

                                return (
                                    <div key={`w${wi}-d${di}`} className={`py-2 rounded-lg text-[10px] transition-colors ${
                                        pnl !== undefined
                                            ? pnl >= 0
                                                ? "bg-primary/10 text-primary font-bold"
                                                : "bg-red-500/10 text-red-500 font-bold"
                                            : isToday
                                            ? "bg-sky-500 text-white font-bold"
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}>
                                        <div className="text-[11px]">{day}</div>
                                        {pnl !== undefined && (
                                            <div className="text-[9px] mt-0.5">{formatCurrency(pnl, true)}</div>
                                        )}
                                    </div>
                                );
                            });
                        })}
                    </div>

                    {/* Monthly total */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Monthly Total Profit</span>
                        <span className={`text-sm font-black ${monthlyTotal >= 0 ? "text-primary" : "text-red-500"}`}>
                            {formatCurrency(monthlyTotal, true)}
                        </span>
                    </div>
                </div>

                {/* Account Info — 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1A1D27] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5 flex flex-col">
                    <h3 className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-wider mb-4">Account Info</h3>

                    <div className="space-y-3 flex-1">
                        {[
                            { icon: Landmark, label: "Broker", value: data.broker },
                            { icon: Server, label: "Server", value: data.server },
                            { icon: Layers, label: "Type", value: data.type, bold: true },
                            { icon: BarChart3, label: "Leverage", value: data.leverage },
                            { icon: DollarSign, label: "Currency", value: data.currency, bold: true },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                                <div className="flex items-center gap-2">
                                    <item.icon size={13} className="text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                                </div>
                                <span className={`text-xs text-gray-700 dark:text-white ${item.bold ? "font-black" : "font-bold"}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Verified badge */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                            <BadgeCheck size={18} className="text-primary shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-primary">Verified Account</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Data synced directly from MT5 terminal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
