import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { createTradePlan, getTradePlans } from "@/actions/trade-plans";

export const dynamic = "force-dynamic";

export async function GET() {
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const plans = await getTradePlans();
        return NextResponse.json(plans);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch trade plans" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const result = await createTradePlan(body);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json(result.plan);
    } catch {
        return NextResponse.json(
            { error: "Failed to create trade plan" },
            { status: 500 }
        );
    }
}
