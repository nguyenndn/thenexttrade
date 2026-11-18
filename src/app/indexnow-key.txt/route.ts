import { NextResponse } from "next/server";
import { getIndexNowKey } from "@/lib/seo/indexnow";

export async function GET() {
    return new NextResponse(getIndexNowKey(), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    });
}
