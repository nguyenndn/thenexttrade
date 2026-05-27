"use client";

import {
    Flame,
    Share2,
    Check,
    Shield,
    Award,
    Clock,
    ArrowUpRight,
    Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import type { PublicProfileData } from "@/lib/profile-queries";

function useTilt() {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateX = (y - 0.5) * -8;
        const rotateY = (x - 0.5) * 8;
        ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (!ref.current) return;
        ref.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
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
        <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-900 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100"
        >
            {copied ? <Check size={12} className="text-amber-700" /> : <Share2 size={12} />}
            {copied ? "Copied" : "Share"}
        </button>
    );
}

function getScoreInfo(score: number) {
    if (score >= 90) return { label: "Legendary", text: "text-amber-500" };
    if (score >= 75) return { label: "Epic", text: "text-orange-500" };
    if (score >= 60) return { label: "Rare", text: "text-yellow-600" };
    if (score >= 40) return { label: "Common", text: "text-slate-600" };
    return { label: "Beginner", text: "text-orange-600" };
}

export function PublicProfileCard({ profile }: { profile: PublicProfileData }) {
    const tilt = useTilt();
    const joinDate = format(new Date(profile.joinedDate), "MMM yyyy");
    const scoreInfo =
        profile.stats.tradeScore !== null && profile.visibility.showTradeScore
            ? getScoreInfo(profile.stats.tradeScore)
            : null;

    return (
        <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-white px-4 py-12 dark:bg-[#0F1117]">
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]" />

            <div
                ref={tilt.ref}
                onMouseMove={tilt.handleMouseMove}
                onMouseLeave={tilt.handleMouseLeave}
                className="z-10 w-full max-w-[430px] transition-transform duration-200 ease-out will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
            >
                <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-300 to-orange-600 p-[2px] shadow-2xl shadow-amber-900/20">
                    <div className="relative overflow-hidden rounded-[22px] border border-amber-100/80 bg-white dark:bg-[#0B0E14]">
                        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(120deg,rgba(251,191,36,0.05),transparent_38%,rgba(255,255,255,0.18)_70%,transparent)] dark:bg-[linear-gradient(120deg,rgba(251,191,36,0.08),transparent_38%,rgba(255,255,255,0.04)_70%,transparent)]" />

                        <div className="relative z-20 flex items-center justify-between px-6 pt-5">
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-amber-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">
                                    Trading Card
                                </span>
                            </div>
                            <ShareButton username={profile.username} />
                        </div>

                        <div className="relative z-20 px-6 pb-4 pt-5">
                            <div className="flex items-center gap-4">
                                <div className="shrink-0 rounded-full bg-gradient-to-br from-amber-500 via-yellow-300 to-orange-600 p-[2px] shadow-lg shadow-amber-900/15">
                                    <div className="h-16 w-16 overflow-hidden rounded-full bg-white p-[2px] dark:bg-[#0B0E14]">
                                        {profile.image ? (
                                            <Image
                                                src={profile.image}
                                                alt={profile.name}
                                                width={64}
                                                height={64}
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center rounded-full bg-amber-50 text-2xl font-black text-amber-300">
                                                {profile.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate text-2xl font-black leading-none tracking-tight text-slate-800">
                                        {profile.name}
                                    </h1>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-600">@{profile.username}</span>
                                        <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-[9px] font-black tracking-wide text-white shadow-sm shadow-amber-700/20">
                                            LV {profile.level}
                                        </span>
                                        {profile.streak >= 3 && (
                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500">
                                                <Flame size={10} /> {profile.streak}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {profile.headline && (
                                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                                    {profile.headline}
                                </p>
                            )}
                        </div>

                        <div className="mx-6 h-[1px] bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-600 opacity-40" />

                        <div className="relative z-20 px-6 py-5">
                            <div className="mb-4 flex items-center gap-1">
                                <Shield size={10} className="text-amber-700" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800">
                                    Verified / 90d
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-4xl font-black leading-none tracking-tighter text-slate-800">
                                        {profile.stats.totalTrades.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Trades</p>
                                </div>
                                <div>
                                    <p className={`text-4xl font-black leading-none tracking-tighter ${profile.stats.winRate >= 50 ? "text-amber-600" : "text-red-500"}`}>
                                        {Math.round(profile.stats.winRate)}
                                        <span className="text-xl text-slate-500">%</span>
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Win Rate</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black leading-none tracking-tighter text-slate-800">
                                        {profile.stats.avgRR > 0 ? profile.stats.avgRR.toFixed(1) : "-"}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg R:R</p>
                                </div>
                                {profile.stats.tradeScore !== null && profile.visibility.showTradeScore && scoreInfo ? (
                                    <div>
                                        <p className={`text-4xl font-black leading-none tracking-tighter ${scoreInfo.text}`}>
                                            {profile.stats.tradeScore}
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Score / <span className={`${scoreInfo.text} font-black`}>{scoreInfo.label}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-4xl font-black leading-none tracking-tighter text-amber-200">-</p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Score</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mx-6 h-[1px] bg-amber-100" />

                        {profile.topPairs && profile.topPairs.length > 0 && profile.visibility.showPairStats && (
                            <div className="relative z-20 px-6 py-4">
                                <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-amber-800">
                                    Top Pairs
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.topPairs.map((pair, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50/70 px-2.5 py-1.5 transition-colors hover:border-amber-300 hover:bg-amber-100/70"
                                        >
                                            <span className="text-[11px] font-bold text-slate-700">{pair.symbol}</span>
                                            <span className={`text-[10px] font-black ${pair.winRate >= 50 ? "text-amber-600" : "text-red-500"}`}>
                                                {Math.round(pair.winRate)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profile.badges && profile.badges.length > 0 && profile.visibility.showBadges && (
                            <>
                                <div className="mx-6 h-[1px] bg-amber-100" />
                                <div className="relative z-20 px-6 py-4">
                                    <div className="mb-3 flex items-center gap-1">
                                        <Award size={10} className="text-amber-700" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800">
                                            Achievements
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.badges.map((badge, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50/70 px-2.5 py-1.5 text-[11px] font-bold text-slate-600"
                                                title={`${badge.name} - ${format(new Date(badge.earnedAt), "MMM d, yyyy")}`}
                                            >
                                                <span className="text-sm">{badge.icon}</span>
                                                {badge.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {profile.preferredSession && profile.visibility.showSessionStats && (
                            <>
                                <div className="mx-6 h-[1px] bg-amber-100" />
                                <div className="relative z-20 px-6 py-4">
                                    <div className="mb-2 flex items-center gap-1">
                                        <Clock size={10} className="text-amber-700" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800">
                                            Session
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-black text-slate-800">{profile.preferredSession.name}</span>
                                        <span className="text-xs font-bold text-amber-600">{profile.preferredSession.percentage}%</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="relative z-20 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500">
                                    Est. {joinDate}
                                </span>
                                <span className="text-[10px] font-bold tracking-wider text-slate-500">
                                    #{String(profile.level).padStart(4, "0")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center">
                <Link
                    href={`/auth/signup?ref=${profile.username}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.03] active:scale-[0.97] border-0"
                >
                    Join TheNextTrade
                    <ArrowUpRight size={16} />
                </Link>
                <p className="mt-2 text-sm font-medium text-amber-900/70">Track, analyze, and improve your trading</p>
            </div>
        </div>
    );
}
