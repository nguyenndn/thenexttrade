import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import sitemap from "@/app/sitemap";
import { notifyIndexNow } from "@/lib/seo/indexnow";

export async function POST() {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const result = await notifyIndexNow(urls);

    return NextResponse.json({
        success: result.submitted,
        ...result,
    });
}
