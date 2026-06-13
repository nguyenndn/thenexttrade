import { NextRequest, NextResponse } from "next/server";
import { resolveSyncAuth } from "@/lib/sync-auth";

export async function GET(request: NextRequest) {
 try {
 const accountNumber = request.nextUrl.searchParams.get("accountNumber") || request.headers.get("X-Account-Number");

 const auth = await resolveSyncAuth({
 request,
 accountNumber,
 requireAccount: true,
 });

 if (!auth.success) {
 return NextResponse.json({ error: auth.error }, { status: auth.status });
 }

 const { account } = auth.data;

 return NextResponse.json({
 autoSync: account!.autoSync,
 syncOpenTrades: account!.syncOpenTrades,
 heartbeatInterval: 300, // 5 minutes
 syncInterval: 60, // 1 minute after trade close
 });
 } catch (error) {
 return NextResponse.json({ error: "Config fetch failed" }, { status: 500 });
 }
}
