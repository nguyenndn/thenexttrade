import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils/api-key";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const newApiKey = generateApiKey();

        const account = await prisma.tradingAccount.updateMany({
            where: { id: params.id, userId: user.id },
            data: {
                apiKey: newApiKey,
                apiKeyCreatedAt: new Date(),
                status: "PENDING", // Reset status as EA needs new key
            },
        });

        if (account.count === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            apiKey: newApiKey, // Show new key once
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to regenerate key" }, { status: 500 });
    }
}
