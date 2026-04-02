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

// ============================================================================
// 3D TILT HOOK
// ============================================================================
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

// ============================================================================
// SHARE BUTTON
// ============================================================================
function ShareButton({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/trader/${username}`;

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({ url, title: "Trading Card" });
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
        >
            {copied ? <Check size={12} className="text-primary" /> : <Share2 size={12} />}
            {copied ? "Copied" : "Share"}
        </button>
    );
}

// ============================================================================
// SCORE RARITY
// ============================================================================
function getScoreInfo(score: number) {
    if (score >= 90) return { label: "Legendary", text: "text-yellow-600" };
    if (score >= 75) return { label: "Epic", text: "text-blue-600" };
    if (score >= 60) return { label: "Rare", text: "text-cyan-600" };
    if (score >= 40) return { label: "Common", text: "text-gray-600" };
    return { label: "Beginner", text: "text-orange-500" };
}

// ============================================================================
// NFT TRADING CARD — Light Mode, Theme Green
// ============================================================================
export function PublicProfileCard({ profile }: { profile: PublicProfileData }) {
    const tilt = useTilt();
    const joinDate = format(new Date(profile.joinedDate), "MMM yyyy");

    const scoreInfo = profile.stats.tradeScore !== null && profile.visibility.showTradeScore
        ? getScoreInfo(profile.stats.tradeScore)
        : null;

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* ═══ Background: Grid dot pattern ═══ */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: "radial-gradient(circle, #00C78B 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            {/* ═══ THE CARD ═══ */}
            <div
                ref={tilt.ref}
                onMouseMove={tilt.handleMouseMove}
                onMouseLeave={tilt.handleMouseLeave}
                className="w-full max-w-[420px] transition-transform duration-200 ease-out will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Gradient border wrapper — theme green */}
                <div className="p-[2px] rounded-3xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-500 shadow-2xl shadow-primary/20">
                    <div className="bg-white rounded-[22px] overflow-hidden relative">

                        {/* ═══ Holographic sheen overlay ═══ */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-cyan-500/[0.03] pointer-events-none z-10" />

                        {/* ═══ TOP: Label + Share ═══ */}
                        <div className="flex items-center justify-between px-6 pt-5 relative z-20">
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-primary" />
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
                                    Trading Card
                                </span>
                            </div>
                            <ShareButton username={profile.username} />
                        </div>

                        {/* ═══ AVATAR + NAME ═══ */}
                        <div className="px-6 pt-5 pb-4 relative z-20">
                            <div className="flex items-center gap-4">
                                {/* Avatar with green gradient ring */}
                                <div className="p-[2px] rounded-full bg-gradient-to-br from-primary via-emerald-400 to-cyan-500 shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-white p-[2px] overflow-hidden">
                                        {profile.image ? (
                                            <Image
                                                src={profile.image}
                                                alt={profile.name}
                                                width={64}
                                                height={64}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center text-2xl font-black text-gray-300">
                                                {profile.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight truncate leading-none">
                                        {profile.name}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-sm text-gray-600 font-medium">@{profile.username}</span>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary text-white tracking-wide">
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
                                <p className="text-xs text-gray-600 mt-3 leading-relaxed line-clamp-2">{profile.headline}</p>
                            )}
                        </div>

                        {/* ═══ DIVIDER — green gradient ═══ */}
                        <div className="mx-6">
                            <div className="h-[1px] bg-gradient-to-r from-primary via-emerald-400 to-cyan-500 opacity-30" />
                        </div>

                        {/* ═══ STATS GRID 2×2 ═══ */}
                        <div className="px-6 py-5 relative z-20">
                            <div className="flex items-center gap-1 mb-4">
                                <Shield size={10} className="text-gray-600" />
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">
                                    Verified · 90d
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">
                                        {profile.stats.totalTrades.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mt-1">Trades</p>
                                </div>
                                <div>
                                    <p className={`text-4xl font-black tracking-tighter leading-none ${profile.stats.winRate >= 50 ? "text-primary" : "text-red-500"}`}>
                                        {Math.round(profile.stats.winRate)}
                                        <span className="text-xl text-gray-400">%</span>
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mt-1">Win Rate</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">
                                        {profile.stats.avgRR > 0 ? profile.stats.avgRR.toFixed(1) : "—"}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mt-1">Avg R:R</p>
                                </div>
                                {profile.stats.tradeScore !== null && profile.visibility.showTradeScore && scoreInfo ? (
                                    <div>
                                        <p className={`text-4xl font-black tracking-tighter leading-none ${scoreInfo.text}`}>
                                            {profile.stats.tradeScore}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mt-1">
                                            Score · <span className={`${scoreInfo.text} font-black`}>{scoreInfo.label}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-4xl font-black text-gray-300 tracking-tighter leading-none">—</p>
                                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mt-1">Score</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ═══ DIVIDER ═══ */}
                        <div className="mx-6">
                            <div className="h-[1px] bg-gray-100" />
                        </div>

                        {/* ═══ PAIRS: Mini badges ═══ */}
                        {profile.topPairs && profile.topPairs.length > 0 && profile.visibility.showPairStats && (
                            <div className="px-6 py-4 relative z-20">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">
                                    Top Pairs
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.topPairs.map((pair, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                                        >
                                            <span className="text-[11px] font-bold text-gray-700">{pair.symbol}</span>
                                            <span className={`text-[10px] font-black ${pair.winRate >= 50 ? "text-primary" : "text-red-500"}`}>
                                                {Math.round(pair.winRate)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ BADGES ═══ */}
                        {profile.badges && profile.badges.length > 0 && profile.visibility.showBadges && (
                            <>
                                <div className="mx-6"><div className="h-[1px] bg-gray-100" /></div>
                                <div className="px-6 py-4 relative z-20">
                                    <div className="flex items-center gap-1 mb-3">
                                        <Award size={10} className="text-gray-600" />
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">
                                            Achievements
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.badges.map((badge, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-bold text-gray-600"
                                                title={`${badge.name} — ${format(new Date(badge.earnedAt), "MMM d, yyyy")}`}
                                            >
                                                <span className="text-sm">{badge.icon}</span>
                                                {badge.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══ SESSION ═══ */}
                        {profile.preferredSession && profile.visibility.showSessionStats && (
                            <>
                                <div className="mx-6"><div className="h-[1px] bg-gray-100" /></div>
                                <div className="px-6 py-4 relative z-20">
                                    <div className="flex items-center gap-1 mb-2">
                                        <Clock size={10} className="text-gray-600" />
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Session</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-black text-gray-700">{profile.preferredSession.name}</span>
                                        <span className="text-xs font-bold text-primary">{profile.preferredSession.percentage}%</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══ FOOTER ═══ */}
                        <div className="px-6 py-4 relative z-20">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-600 tracking-wider">
                                    Est. {joinDate}
                                </span>
                                <span className="text-[10px] font-bold text-gray-600 tracking-wider">
                                    #{String(profile.level).padStart(4, "0")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ CTA below card ═══ */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-emerald-500 text-white font-bold text-sm hover:opacity-90 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-primary/25"
                >
                    Join TheNextTrade
                    <ArrowUpRight size={16} />
                </Link>
                <p className="text-[11px] text-gray-400 mt-2">Track, analyze, and improve your trading</p>
            </div>
        </div>
    );
}
