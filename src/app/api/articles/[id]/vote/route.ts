import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET: Check if user has voted + get total vote count
export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: articleId } = await props.params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const [count, userVote] = await Promise.all([
            prisma.articleVote.count({ where: { articleId } }),
            user
                ? prisma.articleVote.findUnique({
                    where: { userId_articleId: { userId: user.id, articleId } }
                })
                : null
        ]);

        return NextResponse.json({
            count,
            voted: !!userVote
        });
    } catch (error) {
        console.error("Error fetching vote:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST: Toggle vote (add if not voted, remove if already voted)
export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: articleId } = await props.params;

        // Check if already voted
        const existing = await prisma.articleVote.findUnique({
            where: { userId_articleId: { userId: user.id, articleId } }
        });

        if (existing) {
            // Remove vote
            await prisma.articleVote.delete({ where: { id: existing.id } });
        } else {
            // Add vote
            await prisma.articleVote.create({
                data: { userId: user.id, articleId }
            });
        }

        const count = await prisma.articleVote.count({ where: { articleId } });

        return NextResponse.json({
            voted: !existing,
            count
        });
    } catch (error) {
        console.error("Error toggling vote:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
