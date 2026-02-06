import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        const commentId = params.id;

        // Fetch comment and user role to verify permissions
        const [comment, userProfile] = await Promise.all([
            prisma.comment.findUnique({
                where: { id: commentId },
                select: { userId: true }
            }),
            prisma.profile.findUnique({
                where: { userId: user.id },
                select: { role: true }
            })
        ]);

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        const isAuthor = comment.userId === user.id;
        const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'EDITOR'; // Editors effectively moderate content too

        if (!isAuthor && !isAdmin) {
            return NextResponse.json(
                { error: 'You do not have permission to delete this comment' },
                { status: 403 }
            );
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
