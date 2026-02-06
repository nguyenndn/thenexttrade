import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.tradingAccount.findFirst({
            where: { id: params.id, userId: user.id },
            select: { apiKey: true }
        });

        if (!account) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (!account.apiKey) {
            return NextResponse.json({ error: "No API Key found" }, { status: 404 });
        }

        return NextResponse.json({ apiKey: account.apiKey });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch key" }, { status: 500 });
    }
}
