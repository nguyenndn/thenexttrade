import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EAType, PlatformType } from "@prisma/client";

export async function GET() {
    try {
        // 1. TheNextTrade Trend Pilot (Expert Advisor)
        const trendPilot = await prisma.eAProduct.upsert({
            where: { slug: "tnt-trend-pilot" },
            update: {},
            create: {
                name: "TheNextTrade Trend Pilot",
                slug: "tnt-trend-pilot",
                description: "Advanced trend-following algorithm designed for XAUUSD and Major Pairs. Features dynamic risk management and news filtering.",
                type: EAType.AUTO_TRADE,
                platform: PlatformType.MT5,
                version: "2.1.0",
                fileMT5: "ea-products/demo/TNT_Trend_Pilot_v2.1.ex5",
                thumbnail: "https://placehold.co/600x400/1e293b/00c888?text=Trend+Pilot",
                isActive: true,
                isFree: false,
                changelog: "- Improved entry logic\n- Fixed partial close bug",
            },
        });

        // 2. TheNextTrade Supply Demand (Indicator)
        const supplyDemand = await prisma.eAProduct.upsert({
            where: { slug: "tnt-supply-demand" },
            update: {},
            create: {
                name: "TheNextTrade Supply & Demand",
                slug: "tnt-supply-demand",
                description: "Automatically identifies high-probability Supply and Demand zones. Essential for Price Action traders.",
                type: EAType.INDICATOR,
                platform: PlatformType.MT5, // or BOTH
                version: "1.0.5",
                fileMT5: "ea-products/demo/tnt_SD_Zones.ex5",
                thumbnail: "https://placehold.co/600x400/1e293b/3b82f6?text=Supply+Demand",
                isActive: true,
                isFree: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Seeded EA Products successfully",
            products: [trendPilot, supplyDemand]
        });
    } catch (error: any) {
        console.error("Seed Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
