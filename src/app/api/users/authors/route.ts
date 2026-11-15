import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
        aalError ||
        (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2")
    ) {
        return NextResponse.json(
            { error: "Forbidden — MFA verification required" },
            { status: 403 }
        );
    }

    try {
        const callerProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (
            callerProfile?.role !== "ADMIN" &&
            callerProfile?.role !== "EDITOR"
        ) {
            return NextResponse.json(
                { error: "Forbidden — admin or editor access required" },
                { status: 403 }
            );
        }

        const authors = await prisma.user.findMany({
            where: {
                profile: {
                    role: {
                        in: ["ADMIN", "EDITOR"],
                    },
                },
            },
            select: {
                id: true,
                name: true,
                image: true,
            },
        });

        return NextResponse.json(authors);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch authors" },
            { status: 500 }
        );
    }
}
