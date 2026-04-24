import { NextRequest, NextResponse } from "next/server";
import { syncEconomicEvents } from "@/lib/services/economic-calendar";
import { requireCronSecret } from "@/lib/api-auth";

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: NextRequest) {
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const result = await syncEconomicEvents();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
