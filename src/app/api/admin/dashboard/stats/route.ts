import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parallel data fetching for performance
        const [
            usersCount,
            activeUsersCount,
            articlesCount,
            publishedArticlesCount,
            pendingArticlesCount,
            coursesCount,
            lessonsCount,
            quizzesCount,
            totalViews
        ] = await Promise.all([
            // User Stats
            prisma.user.count(),
            prisma.user.count({ // Active users logic (e.g., users with recent updates or just total for now)
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            }),

            // Article Stats
            prisma.article.count(),
            prisma.article.count({ where: { status: 'PUBLISHED' } }),
            prisma.article.count({ where: { status: 'PENDING' } }),

            // Academy Stats
            prisma.module.count(), // Using module as proxy for "courses" until Course model is separated if needed, or if Course model exists
            prisma.lesson.count(),
            prisma.quiz.count(),

            // Views
            prisma.article.aggregate({
                _sum: { views: true }
            })
        ]);

        return NextResponse.json({
            users: {
                total: usersCount,
                active: activeUsersCount,
                growth: 0 // TODO: Implement growth calculation
            },
            articles: {
                total: articlesCount,
                published: publishedArticlesCount,
                pending: pendingArticlesCount,
                totalViews: totalViews._sum.views || 0
            },
            academy: {
                courses: coursesCount, // Note: Currently we might be counting Modules as part of levels. Check schema.
                lessons: lessonsCount,
                quizzes: quizzesCount
            }
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
