import { ImageResponse } from "next/og";
import { getPublicProfileData } from "@/lib/profile-queries";

export const runtime = "edge";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    try {
        const profile = await getPublicProfileData(username);

        if (!profile) {
            return new Response("Profile not found", { status: 404 });
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        width: "1200",
                        height: "630",
                        display: "flex",
                        flexDirection: "column",
                        background: "linear-gradient(135deg, #0F1117 0%, #1E2028 50%, #0F1117 100%)",
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        padding: "60px",
                    }}
                >
                    {/* Top bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                                width: "12px",
                                height: "36px",
                                background: "#00C888",
                                borderRadius: "6px",
                            }} />
                            <span style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                                TheNextTrade
                            </span>
                        </div>
                        <span style={{ fontSize: "16px", color: "#6B7280" }}>
                            Verified Trading Profile
                        </span>
                    </div>

                    {/* Profile */}
                    <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "40px" }}>
                        <div style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "16px",
                            background: "#2D3748",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "32px",
                            fontWeight: 700,
                            border: "3px solid rgba(255,255,255,0.1)",
                        }}>
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                                {profile.name}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                                <span style={{ fontSize: "18px", color: "#9CA3AF" }}>
                                    @{profile.username}
                                </span>
                                <span style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    padding: "2px 10px",
                                    borderRadius: "9999px",
                                    background: "rgba(0,200,136,0.15)",
                                    color: "#00C888",
                                }}>
                                    Level {profile.level}
                                </span>
                            </div>
                            {profile.headline && (
                                <span style={{ fontSize: "16px", color: "#6B7280", marginTop: "4px" }}>
                                    {profile.headline}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "32px" }} />

                    {/* Stats */}
                    <div style={{ display: "flex", gap: "48px", marginBottom: "32px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                                Trades
                            </span>
                            <span style={{ fontSize: "36px", fontWeight: 900 }}>
                                {profile.stats.totalTrades}
                            </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                                Win Rate
                            </span>
                            <span style={{
                                fontSize: "36px",
                                fontWeight: 900,
                                color: profile.stats.winRate >= 50 ? "#10B981" : "#EF4444",
                            }}>
                                {Math.round(profile.stats.winRate)}%
                            </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "14px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                                Avg R:R
                            </span>
                            <span style={{ fontSize: "36px", fontWeight: 900 }}>
                                {profile.stats.avgRR > 0 ? profile.stats.avgRR.toFixed(1) : "N/A"}
                            </span>
                        </div>
                        {profile.stats.tradeScore !== null && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "14px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                                    Score
                                </span>
                                <span style={{ fontSize: "36px", fontWeight: 900, color: "#06B6D4" }}>
                                    {profile.stats.tradeScore}/100
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bottom info */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            {profile.topPairs && profile.topPairs.slice(0, 3).map((pair, i) => (
                                <span key={i} style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    padding: "4px 12px",
                                    borderRadius: "8px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "#D1D5DB",
                                }}>
                                    {pair.symbol} ({Math.round(pair.winRate)}%)
                                </span>
                            ))}
                        </div>
                        <span style={{ fontSize: "16px", color: "#00C888", fontWeight: 700 }}>
                            thenexttrade.com/trader/{profile.username}
                        </span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch {
        return new Response("Error generating image", { status: 500 });
    }
}
