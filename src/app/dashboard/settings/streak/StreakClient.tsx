"use client";

import { useState, useEffect } from "react";
import { Flame, CheckCircle, Loader2, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


export default function StreakClient() {
    const [streak, setStreak] = useState(0);
    const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
    const [checkInHistory, setCheckInHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    // Calendar State: Always current month
    const currentDate = new Date();

    useEffect(() => {
        fetchStreakData();
    }, []);

    const fetchStreakData = async () => {
        try {
            const res = await fetch("/api/streak");
            if (res.ok) {
                const data = await res.json();
                setStreak(data.streak);
                setLastCheckIn(data.lastCheckIn ? new Date(data.lastCheckIn) : null);
                setCheckInHistory(data.checkInHistory);
            }
        } catch (error) {
            console.error("Failed to fetch streak data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setIsCheckingIn(true);
        try {
            const res = await fetch("/api/streak/check-in", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                setStreak(data.streak);
                setLastCheckIn(new Date(data.lastCheckIn));
                // Optimistically update history
                setCheckInHistory(prev => [...prev, new Date().toISOString()]);
                toast.success(data.message);

                // Sync Header
                window.dispatchEvent(new Event("streak-updated"));

                // Trigger Fireworks Celebration
                console.log("Triggering confetti fireworks!");

                const confetti = (await import("canvas-confetti")).default;

                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);

                    // Since particles fall down, start a bit higher than random
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.3, 0.5) }
                    });
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.3, 0.5) }
                    });
                }, 250);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to check in");
        } finally {
            setIsCheckingIn(false);
        }
    };

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Check if user has checked in today
    const isCheckedInToday = lastCheckIn && isSameDay(new Date(), lastCheckIn);

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    // Milestones Configuration
    const MILESTONES = [
        { days: 3, reward: "20 XP" },
        { days: 7, reward: "50 XP + 'Week Warrior' Badge" },
        { days: 14, reward: "100 XP" },
        { days: 30, reward: "300 XP + 'Monthly Master' Badge" },
        { days: 60, reward: "500 XP" },
        { days: 90, reward: "1000 XP + 'Quarterly King' Badge" },
        { days: 100, reward: "Exclusive 'Century Club' Title" },
        { days: 365, reward: "Legendary Status + 5000 XP" },
    ];

    // Calculate Progress
    const nextMilestone = MILESTONES.find(m => m.days > streak) || MILESTONES[MILESTONES.length - 1];
    const prevMilestoneDays = MILESTONES.slice().reverse().find(m => m.days <= streak)?.days || 0;
    const progressPercent = Math.min(100, Math.max(0, ((streak - prevMilestoneDays) / (nextMilestone.days - prevMilestoneDays)) * 100));

    return (
        <div className="w-full grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
            {/* Left Column: Login Info (40%) */}
            <div className="xl:col-span-2 h-full">
                {/* 1. Hero Section: Current Streak & Check-in */}
                <div className="bg-white dark:bg-[#0B0E14] p-8 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col relative overflow-hidden h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                    {/* TOP PART: Stats & Action */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[300px]"> {/* Added min-h to ensure space */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-orange-500 blur-[50px] opacity-20 rounded-full"></div>
                            <Flame size={80} className="text-orange-500 relative z-10 animate-pulse" />
                        </div>

                        <div className="mb-6 text-center">
                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs mb-2">Current Login Streak</p>
                            <h2 className="text-6xl font-black text-gray-900 dark:text-white mb-2">{streak}</h2>
                            <p className="text-sm text-gray-400 font-medium">days in a row</p>
                        </div>

                        <button
                            onClick={handleCheckIn}
                            disabled={isCheckedInToday || isCheckingIn}
                            className={cn(
                                "h-12 px-8 rounded-xl font-bold text-white transition-all flex items-center gap-2 text-base w-auto",
                                isCheckedInToday
                                    ? "bg-primary/10 text-primary cursor-not-allowed border border-primary/20"
                                    : "bg-primary hover:bg-[#00B078] shadow-lg shadow-primary/20 active:scale-95"
                            )}
                        >
                            {isCheckingIn ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : isCheckedInToday ? (
                                <>
                                    <CheckCircle size={20} />
                                    Streak Extended
                                </>
                            ) : (
                                "Check-in Now"
                            )}
                        </button>

                        {!isCheckedInToday && (
                            <p className="mt-4 text-xs text-gray-400">
                                Check in before midnight
                            </p>
                        )}
                    </div>

                    {/* DIVIDER */}
                    <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-0"></div>

                    {/* BOTTOM PART: Rewards Timeline */}
                    <div className="flex-1 w-full bg-gray-50/50 dark:bg-white/[0.02] overflow-hidden flex flex-col">
                        <div className="p-4 pb-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Rewards</h4>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
                            {MILESTONES.map((milestone, index) => {
                                const isAchieved = streak >= milestone.days;
                                const isNext = !isAchieved && (index === 0 || streak >= MILESTONES[index - 1].days);

                                return (
                                    <div key={milestone.days} className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                        isAchieved
                                            ? "bg-primary/10 border-primary/20"
                                            : isNext
                                                ? "bg-white dark:bg-white/5 border-orange-200 dark:border-orange-500/30 shadow-sm"
                                                : "bg-transparent border-transparent opacity-50"
                                    )}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                            isAchieved
                                                ? "bg-primary text-white"
                                                : isNext
                                                    ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                                                    : "bg-gray-100 dark:bg-white/10 text-gray-400"
                                        )}>
                                            {isAchieved ? <CheckCircle size={14} /> : milestone.days}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={cn(
                                                    "text-sm font-bold truncate",
                                                    isAchieved ? "text-primary" : isNext ? "text-gray-900 dark:text-white" : "text-gray-500"
                                                )}>
                                                    {milestone.days} Day Streak
                                                </span>
                                                {isNext && (
                                                    <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                                        Next Goal
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{milestone.reward}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Calendar Wrapper (60%) */}
            <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col xl:col-span-3">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white">Monthly History</h3>
                    <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-medium text-gray-500">
                        {format(currentDate, "MMMM yyyy")}
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col justify-center">
                    {/* Days of Week */}
                    <div className="grid grid-cols-7 mb-3 gap-1 md:gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                            <div key={day} className="text-center text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {/* Padding for start of month */}
                        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square"></div>
                        ))}

                        {calendarDays.map((day) => {
                            const isCheckedIn = checkInHistory.some(h => isSameDay(new Date(h), day));
                            const isCurrentDay = isToday(day);
                            const isPast = !isFuture(day) && !isCurrentDay;
                            const isMissed = isPast && !isCheckedIn;

                            return (
                                <div key={day.toISOString()} className={cn(
                                    "aspect-square flex flex-col items-center justify-center rounded-lg md:rounded-xl border transition-all relative group",
                                    isCurrentDay
                                        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "bg-gray-50/50 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300"
                                )}>
                                    <span className="text-sm font-bold">{format(day, "d")}</span>

                                    {isCheckedIn && (
                                        <div className="mt-1.5">
                                            <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/50" />
                                        </div>
                                    )}

                                    {isMissed && (
                                        <div className="mt-1.5">
                                            <X size={14} className="text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
