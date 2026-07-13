import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// We can periodically check the connection to the DB and DeepSeek
export async function GET() {
  try {
    // Basic DB check
    await prisma.$queryRaw`SELECT 1`;

    // DeepSeek status (just checking if key exists, or we could ping models)
    const hasKey = !!process.env.DEEPSEEK_API_KEY;

    return NextResponse.json({
      status: "online",
      database: "online",
      provider: hasKey ? "online" : "offline",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "degraded",
      database: "offline",
      provider: "unknown",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
