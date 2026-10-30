import { ImageResponse } from "next/og";
import { getMasterCertificateShareData } from "@/lib/certificates/certificate-share.server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;

    try {
        const data = await getMasterCertificateShareData(userId);

        if (!data) {
            return new Response("Certificate not found", { status: 404 });
        }

        const dateStr = new Date(data.earnedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        return new ImageResponse(
            <div
                style={{
                    width: "1200",
                    height: "630",
                    display: "flex",
                    flexDirection: "column",
                    background:
                        "linear-gradient(135deg, #0F1117 0%, #1E2028 50%, #0F1117 100%)",
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    padding: "60px",
                }}
            >
                {/* Top bar */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "48px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: "12px",
                                height: "36px",
                                background: "#FBBF24",
                                borderRadius: "6px",
                            }}
                        />
                        <span
                            style={{
                                fontSize: "24px",
                                fontWeight: 900,
                                letterSpacing: "-0.5px",
                            }}
                        >
                            TheNextTrade
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span
                            style={{
                                fontSize: "16px",
                                color: "#FBBF24",
                                fontWeight: 700,
                                letterSpacing: "1px",
                            }}
                        >
                            Master Certificate
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </div>
                </div>

                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        marginBottom: "40px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#FBBF24",
                            textTransform: "uppercase",
                            letterSpacing: "4px",
                            marginBottom: "16px",
                        }}
                    >
                        Master Trader Certified
                    </span>
                    <span
                        style={{
                            fontSize: "44px",
                            fontWeight: 900,
                            letterSpacing: "-1px",
                        }}
                    >
                        {data.displayName || "Trader"}
                    </span>
                    <span
                        style={{
                            fontSize: "18px",
                            color: "#9CA3AF",
                            marginTop: "8px",
                        }}
                    >
                        Completed all {data.levelCount} levels of the TheNextTrade
                        Academy
                    </span>
                </div>

                {/* Divider */}
                <div
                    style={{
                        width: "100%",
                        height: "1px",
                        background: "rgba(255,255,255,0.1)",
                        marginBottom: "40px",
                    }}
                />

                {/* Stats */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "64px",
                        marginBottom: "40px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                color: "#6B7280",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: "8px",
                            }}
                        >
                            Average Score
                        </span>
                        <span
                            style={{
                                fontSize: "44px",
                                fontWeight: 900,
                                color: "#FBBF24",
                            }}
                        >
                            {data.avgScore}%
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                color: "#6B7280",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: "8px",
                            }}
                        >
                            Levels
                        </span>
                        <span style={{ fontSize: "44px", fontWeight: 900 }}>
                            {data.levelCount}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                color: "#6B7280",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: "8px",
                            }}
                        >
                            Issued
                        </span>
                        <span style={{ fontSize: "44px", fontWeight: 900 }}>
                            {dateStr}
                        </span>
                    </div>
                </div>

                {/* Bottom info */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#6B7280" }}>
                        Verified Master Trader
                    </span>
                    <span
                        style={{
                            fontSize: "16px",
                            color: "#FBBF24",
                            fontWeight: 700,
                        }}
                    >
                        thenexttrade.com/certificate/master/{data.userId}
                    </span>
                </div>
            </div>,
            {
                width: 1200,
                height: 630,
            }
        );
    } catch {
        return new Response("Error generating image", { status: 500 });
    }
}
