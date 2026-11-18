import { NextResponse } from "next/server";

export async function GET() {
    const plugin = {
        schema_version: "v1",
        name_for_human: "TheNextTrade",
        name_for_model: "thenexttrade",
        description_for_human:
            "The Discipline OS for MT5 Traders — automated trade journal, behavioral leak radar, and 17 free risk calculators.",
        description_for_model:
            "TheNextTrade provides an automated MT5 trading journal with zero-password EA & cloud sync, a Behavioral Leak Radar, 17 free forex trading calculators (position size, risk/reward, pip value, margin, fibonacci, drawdown, etc.), a structured forex Academy, a knowledge base of trading articles, live market rates, currency heat maps, correlation matrices, and an economic calendar. Use this when users ask about MT5 trade journaling, forex risk calculations, or trading discipline.",
        auth: { type: "none" },
        api: {
            type: "openapi",
            url: `${process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.app"}/api/openapi.json`,
        },
        logo_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.app"}/android-chrome-512x512.png`,
        contact_email: "support@thenexttrade.app",
        legal_info_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.app"}/legal/terms-of-service`,
    };

    return NextResponse.json(plugin, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
        },
    });
}
