"use client";

import { Award } from "lucide-react";

interface CertificateTemplateProps {
    userName: string;
    levelTitle: string;
    levelOrder: number;
    score: number;
    earnedAt: string;
}

export function CertificateTemplate({
    userName,
    levelTitle,
    levelOrder,
    score,
    earnedAt
}: CertificateTemplateProps) {
    const dateStr = new Date(earnedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div
            id="certificate-template"
            style={{
                width: 1200,
                height: 850,
                background: "#0c1220",
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
                    opacity: 0.15,
                    pointerEvents: "none"
                }}
            />

            {/* Corner brackets — 4 corners */}
            <svg style={{ position: "absolute", top: 20, left: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M2 40V2h38" stroke="#00C888" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", top: 20, right: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M20 2h38v38" stroke="#00C888" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", bottom: 20, left: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M2 20v38h38" stroke="#00C888" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", bottom: 20, right: 20 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M20 58h38V20" stroke="#00C888" strokeWidth="3" strokeLinecap="round" />
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
                background: "radial-gradient(ellipse at center, #0c1220 0%, rgba(12,18,32,0.9) 15%, rgba(12,18,32,0.7) 30%, rgba(12,18,32,0.45) 45%, rgba(12,18,32,0.2) 60%, rgba(12,18,32,0.05) 80%, transparent 100%)",
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
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#00C888", letterSpacing: 1 }}>
                        Trade
                    </span>
                </div>

                {/* Big Title */}
                <div style={{
                    fontSize: 52,
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1.1,
                    marginBottom: 6,
                    letterSpacing: -1
                }}>
                    Academy Certificate
                </div>

                {/* Subtitle line */}
                <div style={{
                    width: 260,
                    height: 1,
                    background: "#00C888",
                    borderRadius: 2,
                    marginBottom: 40
                }} />

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
                    maxWidth: 500,
                    lineHeight: 1.6
                }}>
                    Who has successfully completed all quizzes and assessments in
                </div>

                {/* Level title */}
                <div style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#00C888",
                    marginBottom: 32,
                    lineHeight: 1.2
                }}>
                    Level {levelOrder}: {levelTitle}
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
                        background: "linear-gradient(135deg, rgba(0,200,136,0.15), rgba(0,200,136,0.05))",
                        border: "1px solid rgba(0,200,136,0.3)",
                        borderRadius: 12,
                        padding: "12px 32px",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" as const }}>
                            SCORE
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: "#00C888" }}>
                            {score}%
                        </div>
                    </div>

                    {/* Certificate ID */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" as const }}>
                            CERT ID
                        </div>
                        <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, fontFamily: "monospace" }}>
                            TNT-L{levelOrder}
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

            {/* Award badge — top right */}
            <div style={{
                position: "absolute",
                top: 40,
                right: 50,
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(245, 158, 11, 0.3)"
            }}>
                <Award size={32} color="#fff" />
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
