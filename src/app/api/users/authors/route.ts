
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch users who have a profile with role ADMIN or MANAGER (assuming these roles exist in schema)
        // Adjust based on your 'Profile' model and 'UserRole' enum
        const authors = await prisma.user.findMany({
            where: {
                profile: {
                    role: {
                        in: ["ADMIN", "EDITOR"] // Adjust if roles are different
                    }
                }
            },
            select: {
                id: true,
                name: true,
                image: true
            }
        });

        return NextResponse.json(authors);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch authors" }, { status: 500 });
    }
}
