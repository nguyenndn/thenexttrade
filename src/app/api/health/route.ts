import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - start;

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db: { status: 'ok', latencyMs: dbLatency }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            db: { status: 'error' }
        }, { status: 503 });
    }
}
