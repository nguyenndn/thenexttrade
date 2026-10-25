import { NextRequest, NextResponse } from "next/server";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { detectBroker } from "@/lib/ea/broker-detection";

export async function GET(request: NextRequest) {
    try {
        const accountNumber =
            request.nextUrl.searchParams.get("accountNumber") ||
            request.headers.get("X-Account-Number");
        const broker =
            request.nextUrl.searchParams.get("broker") ||
            request.headers.get("X-Broker") ||
            "";
        const server =
            request.nextUrl.searchParams.get("server") ||
            request.headers.get("X-Server") ||
            "";
        const detectedBroker = detectBroker(server, broker);

        const auth = await resolveSyncAuth({
            request,
            accountNumber,
            broker: detectedBroker || broker || server || null,
            requireAccount: true,
        });

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const { account } = auth.data;

        return NextResponse.json({
            autoSync: account!.autoSync,
            syncOpenTrades: account!.syncOpenTrades,
            heartbeatInterval: 300, // 5 minutes
            syncInterval: 60, // 1 minute after trade close
        });
    } catch {
        return NextResponse.json(
            { error: "Config fetch failed" },
            { status: 500 }
        );
    }
}
