import { NextRequest, NextResponse } from "next/server";
import {
    resubscribeEmailToMarketing,
    unsubscribeEmailFromMarketing,
    verifyMarketingUnsubscribeToken,
} from "@/lib/email/unsubscribe";

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token") || "";
    const target = new URL("/unsubscribe", request.url);
    if (token) {
        target.searchParams.set("token", token);
    }
    return NextResponse.redirect(target, { status: 302 });
}

export async function POST(request: NextRequest) {
    const queryToken = request.nextUrl.searchParams.get("token");
    let token = queryToken || "";
    let action: "unsubscribe" | "resubscribe" = "unsubscribe";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        try {
            const body = (await request.json()) as {
                token?: unknown;
                action?: unknown;
            };
            if (typeof body.token === "string" && body.token) {
                token = body.token;
            }
            if (body.action === "resubscribe") {
                action = "resubscribe";
            }
        } catch {
            // Fall back to query token for empty/non-JSON POST bodies
        }
    }

    const email = verifyMarketingUnsubscribeToken(token);
    if (!email) {
        return NextResponse.json(
            {
                success: false,
                error: "Invalid or expired unsubscribe link.",
            },
            { status: 400 }
        );
    }

    if (action === "resubscribe") {
        await resubscribeEmailToMarketing(email);
        return NextResponse.json({
            success: true,
            status: "subscribed",
            email,
        });
    }

    await unsubscribeEmailFromMarketing(email);
    return NextResponse.json({
        success: true,
        status: "unsubscribed",
        email,
    });
}
