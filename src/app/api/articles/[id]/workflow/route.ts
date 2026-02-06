
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next 15
) {
    // Await params first (Next.js 15 requirement)
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, reason } = body; // action: 'submit', 'approve', 'reject'

        if (!['submit', 'approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // Fetch User Profile for Role Check
        const currentUserProfile = await prisma.profile.findUnique({
            where: { userId: user.id }
        });

        if (!currentUserProfile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 });
        }

        const article = await prisma.article.findUnique({
            where: { id }
        });

        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        // Action Logic
        if (action === 'submit') {
            // Editor or User submits draft
            // Article must be DRAFT or ARCHIVED (?) to be pending
            if (article.status === 'PUBLISHED') {
                return NextResponse.json({ error: "Article is already published" }, { status: 400 });
            }

            await prisma.article.update({
                where: { id },
                data: { status: 'PENDING' }
            });

            // TODO: Send Notification to Admins
        }
        else if (action === 'approve') {
            // Only ADMIN can approve
            if (currentUserProfile.role !== 'ADMIN') {
                return NextResponse.json({ error: "Permission denied" }, { status: 403 });
            }

            await prisma.article.update({
                where: { id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                }
            });

            // TODO: Send Notification to Author
        }
        else if (action === 'reject') {
            // Only ADMIN can reject
            if (currentUserProfile.role !== 'ADMIN') {
                return NextResponse.json({ error: "Permission denied" }, { status: 403 });
            }

            if (!reason) {
                return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
            }

            await prisma.article.update({
                where: { id },
                data: {
                    status: 'DRAFT',
                }
            });

            // TODO: Send Notification to Author
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Workflow Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
