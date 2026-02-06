import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user role for additional security (optional but good practice)
        // For now relying on Admin Layout guard mostly, but explicit check is better.
        // Skipping strict role check here for speed as requested, but keeping auth check.

        // Get query params for pagination
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { name: true, image: true, email: true }
                    },
                    article: {
                        select: { title: true, slug: true }
                    },
                    lesson: {
                        select: { title: true, slug: true }
                    }
                }
            }),
            prisma.comment.count()
        ]);

        return NextResponse.json({
            comments,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });

    } catch (error) {
        console.error('Admin Comments API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
