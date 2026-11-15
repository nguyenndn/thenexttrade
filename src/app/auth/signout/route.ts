import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function performSignOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    return redirect("/auth/login");
}

export async function POST() {
    return performSignOut();
}

export async function GET(request: Request) {
    const secFetchDest = request.headers.get("sec-fetch-dest")?.toLowerCase();
    const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
    const purpose = (
        request.headers.get("purpose") ||
        request.headers.get("sec-purpose") ||
        ""
    ).toLowerCase();
    const isPrefetch =
        request.headers.has("next-router-prefetch") ||
        request.headers.get("x-middleware-prefetch") === "1" ||
        purpose.includes("prefetch");

    // Never sign out on router/browser prefetch requests
    if (isPrefetch) {
        return new NextResponse(null, { status: 204 });
    }

    // Block cross-site CSRF (<img src="/auth/signout">, cross-origin navigations, subresources)
    if (
        secFetchDest === "image" ||
        (secFetchDest &&
            secFetchDest !== "document" &&
            secFetchDest !== "empty") ||
        (secFetchSite &&
            secFetchSite !== "same-origin" &&
            secFetchSite !== "none")
    ) {
        return NextResponse.json(
            { error: "Cross-site signout request blocked" },
            { status: 400 }
        );
    }

    return performSignOut();
}
