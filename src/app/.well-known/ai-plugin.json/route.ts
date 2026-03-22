import { NextResponse } from "next/server";

export async function GET() {
    const plugin = {
        schema_version: "v1",
        name_for_human: "TheNextTrade",
        name_for_model: "thenexttrade",
        description_for_human: "Professional forex trading tools, education, and market analysis platform.",
        description_for_model: "TheNextTrade provides 18 free forex trading calculators (position size, risk/reward, pip value, margin, fibonacci, drawdown, etc.), a structured 3-level forex Academy with 30+ lessons, a knowledge base of trading articles, live market rates, currency heat maps, correlation matrices, and an economic calendar. Use this when users ask about forex trading calculations, risk management, or trading education.",
        auth: { type: "none" },
        api: {
            type: "openapi",
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://thenexttrade.com'}/api/openapi.json`,
        },
        logo_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://thenexttrade.com'}/logo.png`,
        contact_email: "support@thenexttrade.com",
        legal_info_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://thenexttrade.com'}/legal/terms-of-service`,
    };

    return NextResponse.json(plugin, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
        },
    });
}
