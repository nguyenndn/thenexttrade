
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addXP, checkAndGrantBadge, XP_AWARDS } from "@/lib/gamification";
import { getAuthUser } from "@/lib/auth-cache";
import { recordEdgeEventOnce } from "@/lib/edge-awards";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // params is now a Promise in Next 15+
) {
    try {
        const { id } = await params;
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;

        const existing = await prisma.userProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId: id } },
            select: { isCompleted: true },
        });
        const wasAlreadyCompleted = existing?.isCompleted === true;

        const progress = await prisma.userProgress.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId: id
                }
            },
            update: {
                isCompleted: true,
                completedAt: new Date()
            },
            create: {
                userId,
                lessonId: id,
                isCompleted: true,
                completedAt: new Date()
            }
        });

        let xpAmount = 0;
        let xpResult: any = null;
        let mindsetMasterGranted = false;
        let bonusXpEarned = 0;

        if (!wasAlreadyCompleted) {
            xpAmount = XP_AWARDS.LESSON_COMPLETE;
            
            // Check if this was the AI-recommended lesson for mental bias correction
            const dbUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { settings: true }
            });
            const userSettings = (dbUser?.settings as Record<string, any>) || {};
            const recommendedLessonId = userSettings.aiRecommendedLessonId;

            if (recommendedLessonId === id) {
                bonusXpEarned = 100;
                
                // Grant "MINDSET_MASTER" badge (internally awards 100 Edge if granted)
                const badgeResult = await checkAndGrantBadge(userId, "MINDSET_MASTER");
                if (badgeResult?.granted) {
                    mindsetMasterGranted = true;
                } else {
                    // Already has the badge, but still gets the +100 Edge points bonus!
                    await addXP(userId, bonusXpEarned);
                }

                // Record an EdgeEvent for this specific mindset correction
                await recordEdgeEventOnce({
                    userId,
                    eventType: "MINDSET_BIAS_CORRECTION",
                    sourceType: "Lesson",
                    sourceId: id,
                    xpAwarded: bonusXpEarned,
                });

                // Clear recommendation from settings to make it a one-time award
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        settings: {
                            ...userSettings,
                            aiRecommendedLessonId: null,
                            aiRecommendedLessonSlug: null,
                        }
                    }
                });
            }

            xpResult = await addXP(userId, xpAmount);
            await recordEdgeEventOnce({
                userId,
                eventType: "LESSON_COMPLETE",
                sourceType: "Lesson",
                sourceId: id,
                xpAwarded: xpAmount,
            });
        }

        // Check for 'STUDIOUS' Badge (Completed 5 lessons)
        const completedCount = await prisma.userProgress.count({
            where: {
                userId,
                isCompleted: true
            }
        });

        let newBadge = null;
        if (completedCount >= 5) {
            const badgeResult = await checkAndGrantBadge(userId, "STUDIOUS");
            if (badgeResult?.granted) {
                newBadge = badgeResult.badge;
            }
        }

        return NextResponse.json({
            success: true,
            progress,
            gamification: {
                xpEarned: xpAmount,
                newLevel: xpResult?.newLevel,
                leveledUp: xpResult?.leveledUp,
                newBadge: mindsetMasterGranted ? { name: "Mindset Master", icon: "Brain" } : newBadge,
                mindsetMasterGranted,
                bonusXpEarned
            }
        });
    } catch (error) {
        console.error("Error marking lesson complete:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
