import { NextRequest, NextResponse } from "next/server";
import { processWelcomeNudges } from "@/lib/emails/welcome-nudges.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/welcome-nudges
 *
 * Cron job that sends D1/D3 in-app welcome notifications
 * to new users who haven't logged any trades yet.
 *
 * Schedule: Every 6 hours
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
 try {
 const authHeader = request.headers.get("authorization");
 if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 return new NextResponse("Unauthorized", { status: 401 });
 }

 const result = await processWelcomeNudges();

 return NextResponse.json({
 success: true,
 ...result,
 });
 } catch (error) {
 console.error("[Cron] Welcome Nudges Error:", error);
 return new NextResponse("Internal Server Error", { status: 500 });
 }
}
