"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Lock, Share2, Award, Crown, Eye, X } from "lucide-react";
import { toast } from "sonner";
import * as htmlToImage from "html-to-image";
import { CertificateTemplate } from "./CertificateTemplate";

interface CertificateCardProps {
    levelTitle: string;
    levelOrder: number;
    levelDescription: string | null;
    isEarned: boolean;
    score: number | null;
    earnedAt: string | null;
    passedQuizzes: number;
    totalQuizzes: number;
    userName: string;
    variant?: "level" | "master";
}

const LEVEL_GRADIENT = { from: "#00C888", to: "#0d9488" };
const MASTER_GRADIENT = { from: "#FBBF24", to: "#D97706" };

export function CertificateCard({
    levelTitle,
    levelOrder,
    levelDescription,
    isEarned,
    score,
    earnedAt,
    passedQuizzes,
    totalQuizzes,
    userName,
    variant = "level"
}: CertificateCardProps) {
    const isMaster = variant === "master";
    const gradient = isMaster ? MASTER_GRADIENT : LEVEL_GRADIENT;
    const [showPreview, setShowPreview] = useState(false);
    const templateRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        // Open preview if not already open so template is rendered
        if (!showPreview) {
            setShowPreview(true);
            setDownloading(true);
            return; // useEffect will trigger download after render
        }
        await captureAndDownload();
    };

    const captureAndDownload = async () => {
        // Wait for images to load
        await new Promise(r => setTimeout(r, 500));
        
        if (!templateRef.current) {
            toast.error("Template not ready");
            return;
        }
        const el = templateRef.current.querySelector("#certificate-template") as HTMLElement;
        if (!el) {
            toast.error("Template not found");
            return;
        }

        try {
            const dataUrl = await htmlToImage.toPng(el, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: isMaster ? "#1a1408" : "#0c1220"
            });
            const link = document.createElement("a");
            link.download = isMaster ? `TheNextTrade-Master-Certificate.png` : `TheNextTrade-Certificate-Level${levelOrder}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Certificate downloaded!");
        } catch (err) {
            console.error("Download error:", err);
            toast.error("Failed to download certificate");
        }
        setDownloading(false);
    };

    // Auto-download when modal opens for download
    useEffect(() => {
        if (downloading && showPreview) {
            captureAndDownload();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [downloading, showPreview]);

    const handleShare = async () => {
        const text = isMaster
            ? `🏆 I just completed the entire TheNextTrade Academy program with a ${score}% average score! Master Trader Certified! #ForexTrading #TheNextTrade`
            : `🎓 I just earned my Level ${levelOrder}: ${levelTitle} certificate on TheNextTrade Academy with a ${score}% score! #ForexTrading #TheNextTrade`;
        if (navigator.share) {
            try {
                await navigator.share({ text, url: "https://thenexttrade.com/academy" });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(text);
            toast.success("Share text copied to clipboard!");
        }
    };

    if (!isEarned) {
        const progress = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 0;
        return (
            <div className="relative bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 opacity-70">
                <div className="absolute top-4 right-4">
                    <Lock size={18} className="text-gray-400" />
                </div>
                <div className="mb-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Level {levelOrder}</span>
                    <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mt-1">{levelTitle}</h3>
                    {levelDescription && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{levelDescription}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{passedQuizzes}/{totalQuizzes} quizzes passed</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gray-300 dark:bg-white/20 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Earned state
    return (
        <>
            <div
                className="relative rounded-xl overflow-hidden shadow-lg group"
                style={{ background: `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})` }}
            >
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none" />

                <div className="relative z-10 p-6 text-white">
                    {/* Award icon — gold, top-right */}
                    <div className={`absolute top-4 right-4 ${isMaster ? 'w-12 h-12' : 'w-10 h-10'} rounded-full ${isMaster ? 'bg-white/20 shadow-lg shadow-white/10' : 'bg-yellow-400/90 shadow-md shadow-yellow-500/30'} flex items-center justify-center`}>
                        {isMaster ? <Crown size={24} className="text-white" /> : <Award size={20} className="text-white" />}
                    </div>

                    {/* Title — centered, bold */}
                    <div className="text-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                            {isMaster ? "★ ALL LEVELS COMPLETED ★" : `Level ${levelOrder}`}
                        </span>
                        <h3 className={`${isMaster ? 'text-2xl' : 'text-xl'} font-black mt-1 leading-tight`}>
                            {isMaster ? "Master Trader" : levelTitle}
                        </h3>
                    </div>

                    <div className="flex items-center justify-center gap-6 text-sm mb-4">
                        <div>
                            <span className="text-white/60 text-xs">Score</span>
                            <p className="font-black text-xl">{score}%</p>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div>
                            <span className="text-white/60 text-xs">Earned</span>
                            <p className="font-bold text-sm">
                                {earnedAt ? new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm font-bold text-sm transition-colors"
                        >
                            <Eye size={14} /> Preview
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm font-bold text-sm transition-colors"
                        >
                            <Download size={14} /> Download
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm font-bold text-sm transition-colors self-stretch"
                        >
                            <Share2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setShowPreview(false)}
                >
                    <div
                        className="relative max-w-[95vw] max-h-[90vh] overflow-auto rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-100 backdrop-blur-sm border-b border-gray-200">
                            <h3 className="text-gray-800 font-bold text-sm">
                                {isMaster ? "Master Trader Certificate Preview" : `Certificate Preview — Level ${levelOrder}`}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-bold transition-colors hover:opacity-90"
                                    style={{ background: isMaster ? "#D97706" : "#00C888" }}
                                >
                                    <Download size={14} /> Download PNG
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Certificate template */}
                        <div ref={templateRef} className={isMaster ? "bg-[#1a1408]" : "bg-[#0F1119]"}>
                            <CertificateTemplate
                                userName={userName}
                                levelTitle={levelTitle}
                                levelOrder={levelOrder}
                                score={score ?? 0}
                                earnedAt={earnedAt ?? new Date().toISOString()}
                                variant={variant}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
