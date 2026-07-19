import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    // if "next" is in param, use it as the redirect URL
    let next = searchParams.get("next") ?? "/dashboard";

    // Open redirect protection: next must start with / and not start with //
    if (!next.startsWith("/") || next.startsWith("//")) {
        next = "/dashboard";
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if this was a password recovery request
            const isRecovery = next.includes("update-password");

            const isLocalEnv = process.env.NODE_ENV === "development";

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`);
            } else {
                // In production, use the trusted NEXT_PUBLIC_APP_URL to construct the redirect destination
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
                return NextResponse.redirect(`${appUrl}${next}`);
            }
        } else {
            console.error("Auth Callback Error:", error.message);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
