import { ImageResponse } from "next/og";
import { getCertificateShareData } from "@/lib/certificates/certificate-share.server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const data = await getCertificateShareData(id);

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
                                background: "#00C888",
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
                    <span style={{ fontSize: "16px", color: "#6B7280" }}>
                        Academy Certificate
                    </span>
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
                            color: "#00C888",
                            textTransform: "uppercase",
                            letterSpacing: "4px",
                            marginBottom: "16px",
                        }}
                    >
                        Certificate of Completion
                    </span>
                    <span
                        style={{
                            fontSize: "40px",
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
                        Level {data.levelOrder}: {data.levelTitle}
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
                            Score
                        </span>
                        <span
                            style={{
                                fontSize: "44px",
                                fontWeight: 900,
                                color: "#00C888",
                            }}
                        >
                            {data.score}%
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
                    <span
                        style={{
                            fontSize: "14px",
                            color: "#6B7280",
                        }}
                    >
                        Cert ID: {data.certificateId.slice(0, 8)}
                    </span>
                    <span
                        style={{
                            fontSize: "16px",
                            color: "#00C888",
                            fontWeight: 700,
                        }}
                    >
                        thenexttrade.com/certificate/{data.certificateId}
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
