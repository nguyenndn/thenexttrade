import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    // if "next" is in param, use it as the redirect URL
    let next = searchParams.get("next") ?? "/dashboard";

    // Strict open redirect protection:
    // Destination must start with exactly one '/', must not contain backslashes ('\' or '/\'),
    // must not be protocol-relative ('//'), and must parse strictly as a relative path under current origin.
    const isSafeRelativePath = (path: string): boolean => {
        if (
            !path.startsWith("/") ||
            path.startsWith("//") ||
            path.includes("\\") ||
            path.includes("/\\") ||
            /^\/\s/.test(path) ||
            /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path.slice(1))
        ) {
            return false;
        }

        try {
            const parsed = new URL(path, "http://localhost");
            return parsed.origin === "http://localhost" && parsed.pathname.startsWith("/");
        } catch {
            return false;
        }
    };

    if (!isSafeRelativePath(next)) {
        next = "/dashboard";
    }

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            if (data?.user) {
                const authUser = data.user;
                const metaName = (
                    authUser.user_metadata?.full_name ||
                    authUser.user_metadata?.name ||
                    ""
                ).trim();
                const confirmedAt = authUser.email_confirmed_at
                    ? new Date(authUser.email_confirmed_at)
                    : new Date();

                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { id: authUser.id },
                        select: { id: true, name: true },
                    });
                    const conflictingEmailUser = authUser.email
                        ? await prisma.user.findUnique({
                              where: { email: authUser.email },
                              select: { id: true },
                          })
                        : null;
                    const canSetEmail =
                        Boolean(authUser.email) &&
                        (!conflictingEmailUser ||
                            conflictingEmailUser.id === authUser.id);

                    await prisma.user.upsert({
                        where: { id: authUser.id },
                        update: {
                            ...(canSetEmail ? { email: authUser.email } : {}),
                            ...(!existingUser?.name && metaName
                                ? { name: metaName }
                                : {}),
                            emailVerified: confirmedAt,
                        },
                        create: {
                            id: authUser.id,
                            email: canSetEmail ? authUser.email : null,
                            name: metaName,
                            emailVerified: confirmedAt,
                            image: authUser.user_metadata?.avatar_url || null,
                        },
                    });
                } catch (upsertErr) {
                    console.error(
                        "Auth Callback User Upsert Error:",
                        upsertErr
                    );
                }
            }

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
