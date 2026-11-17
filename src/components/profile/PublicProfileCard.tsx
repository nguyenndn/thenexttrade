"use client";

import {
    Flame,
    Share2,
    Check,
    Shield,
    ShieldCheck,
    Award,
    Brain,
    Clock,
    ArrowUpRight,
    Zap,
    TrendingUp,
    Star,
    Trophy,
    Target,
    Crown,
    Medal,
    Building2,
    Hash,
    DollarSign,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import type { PublicProfileData } from "@/lib/profile-queries";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const BADGE_ICON_MAP: Record<string, React.ElementType> = {
    TrendingUp,
    ShieldCheck,
    Shield,
    Star,
    Award,
    Flame,
    Zap,
    Trophy,
    Target,
    Crown,
    Medal,
};

function useTilt() {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotateX = (y - 0.5) * -8;
            const rotateY = (x - 0.5) * 8;
            ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        },
        []
    );

    const handleMouseLeave = useCallback(() => {
        if (!ref.current) return;
        ref.current.style.transform =
            "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }, []);

    return { ref, handleMouseMove, handleMouseLeave };
}

function ShareButton({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/trader/${username}`;

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({ url, title: "Trading Card" });
            return;
        }

        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-white/10 bg-amber-50 dark:bg-[#1E2536] px-3 h-7 text-[11px] font-bold text-amber-900 dark:text-amber-300 shadow-sm transition-all hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-500/15"
        >
            {copied ? (
                <Check size={12} className="text-amber-700 dark:text-amber-400" />
            ) : (
                <Share2 size={12} />
            )}
            {copied ? "Copied" : "Share"}
        </Button>
    );
}

function getScoreInfo(score: number) {
    if (score >= 90)
        return {
            label: "Legendary",
            text: "text-amber-500 dark:text-amber-400",
        };
    if (score >= 75)
        return { label: "Epic", text: "text-orange-500 dark:text-orange-400" };
    if (score >= 60)
        return { label: "Rare", text: "text-yellow-600 dark:text-yellow-400" };
    if (score >= 40)
        return {
            label: "Common",
            text: "text-slate-600 dark:text-slate-300",
        };
    return { label: "Beginner", text: "text-orange-600 dark:text-orange-400" };
}

function formatSignedUsd(amount: number): string {
    const absFormatted = Math.abs(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    if (amount > 0) return `+$${absFormatted}`;
    if (amount < 0) return `-$${absFormatted}`;
    return `$${absFormatted}`;
}

export function PublicProfileCard({
    profile,
    isModal = false,
    isLoggedIn = false,
}: {
    profile: PublicProfileData;
    isModal?: boolean;
    isLoggedIn?: boolean;
}) {
    const tilt = useTilt();
    const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
    const showAvatar = Boolean(profile.image) && failedAvatarSrc !== profile.image;
    const joinDate = format(new Date(profile.joinedDate), "MMM yyyy");
    const scoreInfo =
        profile.stats.tradeScore !== null && profile.visibility.showTradeScore
            ? getScoreInfo(profile.stats.tradeScore)
            : null;
    const avatarInitial = (
        profile.name.replace(/^@/, "").trim() ||
        profile.username ||
        "T"
    )
        .charAt(0)
        .toUpperCase();
    const showHandleSubtitle =
        profile.name.trim().toLowerCase() !==
        `@${profile.username}`.toLowerCase();
    const visibleBroker = profile.visibility.showBroker
        ? profile.verifiedAccount?.broker?.trim() || null
        : null;
    const rawAccountNum = profile.visibility.showAccountNumber
        ? profile.verifiedAccount?.accountNumber?.trim() || null
        : null;
    const visibleAccountNumber = rawAccountNum
        ? rawAccountNum.startsWith("#")
            ? rawAccountNum
            : `#${rawAccountNum}`
        : null;
    const visibleNetPnl =
        profile.visibility.showMoney &&
        typeof profile.stats.netPnl === "number"
            ? profile.stats.netPnl
            : null;

    return (
        <div
            className={`relative flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-transparent ${
                isModal ? "px-2 py-4 sm:py-6" : "px-4 py-8 sm:py-12"
            }`}
        >
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]" />

            <div
                ref={tilt.ref}
                onMouseMove={tilt.handleMouseMove}
                onMouseLeave={tilt.handleMouseLeave}
                className="z-10 w-full max-w-[430px] transition-transform duration-200 ease-out will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
            >
                <div className="rounded-xl border border-amber-500/30 bg-white dark:bg-[#151925] shadow-xl shadow-amber-500/5">
                    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#151925]">
                        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(120deg,rgba(251,191,36,0.05),transparent_38%,rgba(255,255,255,0.18)_70%,transparent)] dark:bg-[linear-gradient(120deg,rgba(251,191,36,0.08),transparent_38%,rgba(255,255,255,0.04)_70%,transparent)]" />

                        <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 pt-5">
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-amber-600 dark:text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
                                    Trading Card
                                </span>
                            </div>
                            <ShareButton username={profile.username} />
                        </div>

                        <div className="relative z-20 px-4 sm:px-6 pb-4 pt-5">
                            <div className="flex items-center gap-4">
                                <div className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/5 p-[2px] shadow-sm">
                                    <div className="h-16 w-16 overflow-hidden rounded-full bg-white p-[2px] dark:bg-[#151925]">
                                        {showAvatar && profile.image ? (
                                            <Image
                                                src={profile.image}
                                                alt={profile.name}
                                                width={64}
                                                height={64}
                                                unoptimized={profile.image.startsWith("http")}
                                                className="h-full w-full rounded-full object-cover"
                                                onError={() => setFailedAvatarSrc(profile.image)}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10 text-2xl font-black text-amber-500">
                                                {avatarInitial}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate text-2xl font-black leading-none tracking-tight text-slate-800 dark:text-white">
                                        {profile.name}
                                    </h1>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        {showHandleSubtitle && (
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                @{profile.username}
                                            </span>
                                        )}
                                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-black tracking-wide text-amber-600 dark:text-amber-400">
                                            LV {profile.level}
                                        </span>
                                        {profile.streak >= 3 && (
                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500">
                                                <Flame size={10} />{" "}
                                                {profile.streak}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {profile.headline && (
                                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    {profile.headline}
                                </p>
                            )}

                            <div className="mt-4 rounded-lg border border-amber-100 dark:border-white/10 bg-amber-50/55 dark:bg-[#1E2536] px-3 py-2.5">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-400">
                                        Public data window
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                                        {profile.performanceWindow.label}
                                    </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-600 dark:text-slate-300 tabular-nums">
                                    <span>
                                        {profile.performanceWindow.qualifyingClosedTrades.toLocaleString()} closed trades
                                    </span>
                                    <span aria-hidden="true" className="text-amber-400 dark:text-white/20">
                                        |
                                    </span>
                                    <span>
                                        Updated {format(profile.performanceWindow.calculatedAt, "MMM d, yyyy")}
                                    </span>
                                </div>
                            </div>

                            {(visibleBroker || visibleAccountNumber) && (
                                <div
                                    className={cn(
                                        "mt-2.5 grid rounded-lg border border-amber-100 dark:border-white/10 bg-gray-50/70 dark:bg-[#1E2536] overflow-hidden",
                                        visibleBroker && visibleAccountNumber
                                            ? "grid-cols-2 divide-x divide-amber-200/60 dark:divide-white/10"
                                            : "grid-cols-1"
                                    )}
                                >
                                    {visibleBroker && (
                                        <div className="px-3 py-2 min-w-0">
                                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                                <Building2
                                                    size={10}
                                                    className="text-amber-600 dark:text-amber-400 shrink-0"
                                                />
                                                <span>Broker</span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs font-bold text-slate-800 dark:text-white">
                                                {visibleBroker}
                                            </p>
                                        </div>
                                    )}
                                    {visibleAccountNumber && (
                                        <div className="px-3 py-2 min-w-0">
                                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                                <Hash
                                                    size={10}
                                                    className="text-amber-600 dark:text-amber-400 shrink-0"
                                                />
                                                <span>Account</span>
                                            </div>
                                            <p className="mt-0.5 truncate font-mono text-xs font-bold tabular-nums text-slate-800 dark:text-white">
                                                {visibleAccountNumber}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mx-4 sm:mx-6 h-[1px] bg-gradient-to-r from-transparent via-amber-500/25 dark:via-white/15 to-transparent" />

                        <div className="relative z-20 px-4 sm:px-6 py-5">
                            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <Shield size={10} className="text-amber-700 dark:text-amber-400" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
                                    {profile.performanceWindow.verificationLabel} · {profile.performanceWindow.label}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                                    {profile.performanceWindow.qualifyingClosedTrades.toLocaleString()} closed trades
                                </span>
                            </div>

                            {visibleNetPnl !== null && (
                                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-100 dark:border-white/10 bg-gray-50/70 dark:bg-[#1E2536] px-3.5 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign
                                            size={13}
                                            className="text-amber-600 dark:text-amber-400 shrink-0"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                            Net P&amp;L (90d)
                                        </span>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-lg font-black tracking-tight tabular-nums",
                                            visibleNetPnl > 0
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : visibleNetPnl < 0
                                                  ? "text-rose-500 dark:text-rose-400"
                                                  : "text-slate-700 dark:text-slate-200"
                                        )}
                                    >
                                        {formatSignedUsd(visibleNetPnl)}
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-3xl sm:text-4xl font-black leading-none tracking-tighter text-slate-800 dark:text-white tabular-nums">
                                        {profile.stats.totalTrades.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Trades
                                    </p>
                                </div>
                                <div>
                                    {profile.visibility.showPercentMetrics ? (
                                        <>
                                            <p
                                                className={`text-3xl sm:text-4xl font-black leading-none tracking-tighter tabular-nums ${profile.stats.winRate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}
                                            >
                                                {Math.round(
                                                    profile.stats.winRate
                                                )}
                                                <span className="text-xl text-slate-500 dark:text-slate-400">
                                                    %
                                                </span>
                                            </p>
                                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Win Rate
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-3xl sm:text-4xl font-black leading-none tracking-tighter text-amber-200 dark:text-slate-600">
                                                —
                                            </p>
                                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Win Rate
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <p className="text-3xl sm:text-4xl font-black leading-none tracking-tighter text-slate-800 dark:text-white tabular-nums">
                                        {profile.stats.avgRR > 0
                                            ? profile.stats.avgRR.toFixed(1)
                                            : "-"}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Avg R:R
                                    </p>
                                </div>
                                {profile.stats.tradeScore !== null &&
                                profile.visibility.showTradeScore &&
                                scoreInfo ? (
                                    <div>
                                        <p
                                            className={`text-3xl sm:text-4xl font-black leading-none tracking-tighter tabular-nums ${scoreInfo.text}`}
                                        >
                                            {profile.stats.tradeScore}
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Score /{" "}
                                            <span
                                                className={`${scoreInfo.text} font-black`}
                                            >
                                                {scoreInfo.label}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-3xl sm:text-4xl font-black leading-none tracking-tighter text-amber-200 dark:text-slate-600">
                                            -
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Score
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mx-4 sm:mx-6 h-[1px] bg-amber-100 dark:bg-white/10" />

                        {profile.topPairs &&
                            profile.topPairs.length > 0 &&
                            profile.visibility.showPairStats && (
                                <div className="relative z-20 px-4 sm:px-6 py-4">
                                    <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
                                        Top Pairs
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.topPairs.map((pair, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-1.5 rounded-lg border border-amber-100 dark:border-white/10 bg-amber-50/70 dark:bg-[#1E2536] px-2.5 py-1.5 transition-colors hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-100/70 dark:hover:bg-[#252D42]"
                                            >
                                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                    {pair.symbol}
                                                </span>
                                                {profile.visibility
                                                    .showPercentMetrics ? (
                                                    <span
                                                        className={`text-[10px] font-black tabular-nums ${pair.winRate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}
                                                    >
                                                        {Math.round(
                                                            pair.winRate
                                                        )}
                                                        %
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                                        {pair.trades}t
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        {profile.badges &&
                            profile.badges.length > 0 &&
                            profile.visibility.showBadges && (
                                <>
                                    <div className="mx-4 sm:mx-6 h-[1px] bg-amber-100 dark:bg-white/10" />
                                    <div className="relative z-20 px-4 sm:px-6 py-4">
                                        <div className="mb-3 flex items-center gap-1">
                                            <Award
                                                size={10}
                                                className="text-amber-700 dark:text-amber-400"
                                            />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
                                                Achievements
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.badges.map((badge, i) => {
                                                const BadgeIcon =
                                                    BADGE_ICON_MAP[
                                                        badge.icon
                                                    ] || Award;
                                                return (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-100 dark:border-white/10 bg-amber-50/70 dark:bg-[#1E2536] px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-200"
                                                        title={`${badge.name} - ${format(new Date(badge.earnedAt), "MMM d, yyyy")}`}
                                                    >
                                                        <BadgeIcon
                                                            size={13}
                                                            className="text-amber-600 dark:text-amber-400 shrink-0"
                                                        />
                                                        {badge.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}

                        {profile.preferredSession &&
                            profile.visibility.showSessionStats && (
                                <>
                                    <div className="mx-4 sm:mx-6 h-[1px] bg-amber-100 dark:bg-white/10" />
                                    <div className="relative z-20 px-4 sm:px-6 py-4">
                                        <div className="mb-2 flex items-center gap-1">
                                            <Clock
                                                size={10}
                                                className="text-amber-700 dark:text-amber-400"
                                            />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
                                                Session
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-black text-slate-800 dark:text-white">
                                                {profile.preferredSession.name}
                                            </span>
                                            {profile.visibility
                                                .showPercentMetrics && (
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                    {
                                                        profile.preferredSession
                                                            .percentage
                                                    }
                                                    %
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                        {profile.tradingStyle &&
                            profile.visibility.showTradingStyle !== false && (
                                <>
                                    <div className="mx-4 sm:mx-6 h-[1px] bg-amber-100 dark:bg-white/10" />
                                    <div className="relative z-20 px-4 sm:px-6 py-4">
                                        <div className="mb-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Brain
                                                    size={11}
                                                    className="text-amber-700 dark:text-amber-400"
                                                />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
                                                    Trading Style
                                                </span>
                                            </div>
                                            <Link
                                                href="/trading-style"
                                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                                            >
                                                <span>Know Your Style</span>
                                                <ArrowUpRight size={10} />
                                            </Link>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 dark:border-white/10 bg-amber-500/[0.04] dark:bg-[#1E2536] px-3.5 py-2.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold text-white shadow-sm shadow-gold/30">
                                                    <Award size={15} />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-black text-slate-800 dark:text-white">
                                                        {profile.tradingStyle.archetypeTitle}
                                                    </p>
                                                    <p className="text-[10px] font-semibold text-amber-600 dark:text-gold">
                                                        Verified Archetype
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        <div className="relative z-20 px-4 sm:px-6 py-4">
                            <div className="mb-3 space-y-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                                <p>
                                    {profile.dataSource}. Calculated as of{" "}
                                    {format(profile.performanceWindow.calculatedAt, "MMM d, yyyy HH:mm")}.
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <Link
                                        href={profile.methodologyHref}
                                        className="font-bold text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
                                    >
                                        How this is calculated
                                    </Link>
                                    <span aria-hidden="true">·</span>
                                    <span>Historical information only. Not financial advice.</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between tabular-nums">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                    Est. {joinDate}
                                </span>
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                    #{String(profile.level).padStart(4, "0")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Button in natural layout flow below card */}
            {!isModal && (
                <div className="relative z-20 mt-8 text-center">
                    <Link
                        href={isLoggedIn ? "/dashboard" : "/auth/signup"}
                        className={cn(
                            buttonVariants({ variant: "gold", size: "smd" }),
                            "gap-2 font-black shadow-lg shadow-gold/25 transition-all hover:scale-[1.03] active:scale-[0.97]"
                        )}
                    >
                        {isLoggedIn ? "Go to Dashboard" : "Join TheNextTrade"}
                        <ArrowUpRight size={14} />
                    </Link>
                    <p className="mt-2 text-sm font-medium text-amber-900/70 dark:text-amber-200/70">
                        Track, analyze, and improve your trading
                    </p>
                </div>
            )}
        </div>
    );
}
