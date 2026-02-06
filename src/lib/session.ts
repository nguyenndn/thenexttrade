import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function recordSession(userId: string) {
    try {
        const headersList = await headers();
        const userAgent = headersList.get("user-agent") || "Unknown Device";
        // IP detection (works with Vercel/proxies)
        const forwardedFor = headersList.get("x-forwarded-for");
        const ip = forwardedFor ? forwardedFor.split(',')[0] : "Unknown IP";

        // Simple Device Parsing
        let deviceName = "Unknown Device";
        if (userAgent.includes("Windows")) deviceName = "Windows PC";
        else if (userAgent.includes("Macintosh")) deviceName = "Mac";
        else if (userAgent.includes("Linux")) deviceName = "Linux PC";
        else if (userAgent.includes("Android")) deviceName = "Android Device";
        else if (userAgent.includes("iPhone")) deviceName = "iPhone";
        else if (userAgent.includes("iPad")) deviceName = "iPad";

        // Browser Detection
        if (userAgent.includes("Chrome")) deviceName += " - Chrome";
        else if (userAgent.includes("Firefox")) deviceName += " - Firefox";
        else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) deviceName += " - Safari";
        else if (userAgent.includes("Edge")) deviceName += " - Edge";

        // Upsert Session
        // We define a unique constraint on [userId, userAgent, ip] in schema
        // so we can use upsert.
        await prisma.userSession.upsert({
            where: {
                unique_session: {
                    userId,
                    userAgent,
                    ip
                }
            },
            create: {
                userId,
                userAgent,
                ip,
                device: deviceName,
                lastActive: new Date()
            },
            update: {
                lastActive: new Date(),
                device: deviceName // Update usage in case parsing logic changes
            }
        });

    } catch (error) {
        console.error("Failed to record session:", error);
        // Don't block login if session recording fails
    }
}

export async function getActiveSessions(userId: string) {
    return await prisma.userSession.findMany({
        where: { userId },
        orderBy: { lastActive: 'desc' },
        take: 10
    });
}

export async function revokeSession(sessionId: string, userId: string) {
    // Only allow revoking own sessions
    return await prisma.userSession.deleteMany({
        where: {
            id: sessionId,
            userId: userId
        }
    });
}
