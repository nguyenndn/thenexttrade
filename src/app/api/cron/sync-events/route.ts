import { NextResponse } from "next/server";
import { syncEconomicEvents } from "@/lib/services/economic-calendar";

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
    try {
        const result = await syncEconomicEvents();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
