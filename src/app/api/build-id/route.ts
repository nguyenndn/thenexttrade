import { NextResponse } from "next/server";
import { getServerBuildId } from "@/lib/deployment/build-id.server";

export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json(
        { buildId: getServerBuildId() },
        {
            headers: {
                "Cache-Control":
                    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                Pragma: "no-cache",
                Expires: "0",
                "CDN-Cache-Control": "no-store",
                "Cloudflare-CDN-Cache-Control": "no-store",
            },
        }
    );
}
