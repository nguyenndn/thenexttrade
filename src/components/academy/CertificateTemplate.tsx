"use client";

import { Award, Crown } from "lucide-react";

interface CertificateTemplateProps {
    userName: string;
    levelTitle: string;
    levelOrder: number;
    score: number;
    earnedAt: string;
    variant?: "level" | "master";
}

export function CertificateTemplate({
    userName,
    levelTitle,
    levelOrder,
    score,
    earnedAt,
    variant = "level"
}: CertificateTemplateProps) {
    const isMaster = variant === "master";
    const accentColor = isMaster ? "#FBBF24" : "#00C888";
    const bgColor = isMaster ? "#1a1408" : "#0c1220";
    const gradientFrom = isMaster ? "rgba(251,191,36,0.15)" : "rgba(0,200,136,0.15)";
    const gradientTo = isMaster ? "rgba(251,191,36,0.05)" : "rgba(0,200,136,0.05)";
    const borderAccent = isMaster ? "rgba(251,191,36,0.3)" : "rgba(0,200,136,0.3)";

    const dateStr = new Date(earnedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div
            id="certificate-template"
            style={{
                width: 1200,
                height: 850,
                background: bgColor,
                position: "relative",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                overflow: "hidden",
                color: "#fff"
            }}
        >
            {/* Candlestick chart pattern — full background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/images/candlestick-chart-bg.png"
                alt=""
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: isMaster ? 0.1 : 0.15,
                    pointerEvents: "none"
                }}
            />

            {/* Gold shimmer overlay for master */}
            {isMaster && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 60%)",
                    pointerEvents: "none"
                }} />
            )}

            {/* Corner brackets — 4 corners */}
            <svg style={{ position: "absolute", top: 20, left: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M2 40V2h38" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", top: 20, right: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M20 2h38v38" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", bottom: 20, left: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M2 20v38h38" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", bottom: 20, right: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M20 58h38V20" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Center blur — soft shadow for text readability */}
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                height: "85%",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, ${bgColor} 0%, ${bgColor}e6 15%, ${bgColor}b3 30%, ${bgColor}73 45%, ${bgColor}33 60%, ${bgColor}0d 80%, transparent 100%)`,
                filter: "blur(30px)",
                pointerEvents: "none"
            }} />

            {/* Content */}
            <div style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "50px 80px",
                textAlign: "center"
            }}>
                {/* Logo */}
                <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>
                        TheNext
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: accentColor, letterSpacing: 1 }}>
                        Trade
                    </span>
                </div>

                {/* Big Title */}
                <div style={{
                    fontSize: isMaster ? 48 : 52,
                    fontWeight: 900,
                    color: isMaster ? accentColor : "#fff",
                    lineHeight: 1.1,
                    marginBottom: 6,
                    letterSpacing: -1
                }}>
                    {isMaster ? "Master Trader Certificate" : "Academy Certificate"}
                </div>

                {/* Subtitle line */}
                <div style={{
                    width: 260,
                    height: 1,
                    background: accentColor,
                    borderRadius: 2,
                    marginBottom: isMaster ? 20 : 40
                }} />

                {/* Master subtitle */}
                {isMaster && (
                    <div style={{
                        fontSize: 14,
                        color: "rgba(251,191,36,0.7)",
                        fontWeight: 600,
                        letterSpacing: 3,
                        marginBottom: 24,
                        textTransform: "uppercase" as const
                    }}>
                        ★ ALL 12 LEVELS COMPLETED ★
                    </div>
                )}

                {/* Proudly presented to */}
                <div style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: 4,
                    marginBottom: 12,
                    fontWeight: 500,
                    textTransform: "uppercase" as const
                }}>
                    PROUDLY PRESENTED TO
                </div>

                {/* User name */}
                <div style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#fff",
                    marginBottom: 20,
                    lineHeight: 1.2
                }}>
                    {userName}
                </div>

                {/* Completion text */}
                <div style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 400,
                    marginBottom: 16,
                    maxWidth: 550,
                    lineHeight: 1.6
                }}>
                    {isMaster
                        ? "Who has demonstrated exceptional dedication and successfully completed the entire TheNextTrade Academy program"
                        : "Who has successfully completed all quizzes and assessments in"
                    }
                </div>

                {/* Level title */}
                <div style={{
                    fontSize: isMaster ? 32 : 36,
                    fontWeight: 800,
                    color: accentColor,
                    marginBottom: 32,
                    lineHeight: 1.2
                }}>
                    {isMaster ? "TheNextTrade Academy Graduate" : `Level ${levelOrder}: ${levelTitle}`}
                </div>

                {/* Score box */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 40,
                    marginBottom: 40
                }}>
                    {/* Date */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" as const }}>
                            DATE
                        </div>
                        <div style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>
                            {dateStr}
                        </div>
                    </div>

                    {/* Score */}
                    <div style={{
                        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                        border: `1px solid ${borderAccent}`,
                        borderRadius: 12,
                        padding: "12px 32px",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" as const }}>
                            {isMaster ? "AVG SCORE" : "SCORE"}
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: accentColor }}>
                            {score}%
                        </div>
                    </div>

                    {/* Certificate ID */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" as const }}>
                            CERT ID
                        </div>
                        <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, fontFamily: "monospace" }}>
                            {isMaster ? "TNT-MASTER" : `TNT-L${levelOrder}`}
                        </div>
                    </div>
                </div>

                {/* Footer line */}
                <div style={{
                    width: 200,
                    height: 1,
                    background: "rgba(255,255,255,0.1)",
                    marginBottom: 16
                }} />

                {/* Footer */}
                <div style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 400
                }}>
                    TheNextTrade.com — Professional Forex Trading Education
                </div>
            </div>

            {/* Badge — top right */}
            <div style={{
                position: "absolute",
                top: 40,
                right: 50,
                width: isMaster ? 72 : 64,
                height: isMaster ? 72 : 64,
                borderRadius: "50%",
                background: isMaster
                    ? "linear-gradient(135deg, #FBBF24, #D97706)"
                    : "linear-gradient(135deg, #FBBF24, #F59E0B)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isMaster
                    ? "0 8px 32px rgba(251, 191, 36, 0.5)"
                    : "0 8px 32px rgba(245, 158, 11, 0.3)"
            }}>
                {isMaster
                    ? <Crown size={36} color="#fff" />
                    : <Award size={32} color="#fff" />
                }
            </div>

            {/* Logo — top left */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/images/thenexttrade-avatar.png"
                alt=""
                style={{
                    position: "absolute",
                    top: 24,
                    left: 30,
                    width: 120,
                    height: 120,
                    borderRadius: 20,
                    opacity: 0.2
                }}
            />
        </div>
    );
}
