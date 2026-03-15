
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addXP, checkAndGrantBadge } from "@/lib/gamification";
import { getAuthUser } from "@/lib/auth-cache";

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

        // 2. Add XP for completing a lesson (e.g., 20 XP)
        const xpResult = await addXP(userId, 20);

        // 3. Check for 'STUDIOUS' Badge (Completed 5 lessons)
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

        // 4. Check for 'FIRST_LESSON' Badge (if we had one, logic here)
        // For now just STUDIOUS.

        return NextResponse.json({
            success: true,
            progress,
            gamification: {
                xpEarned: 20,
                newLevel: xpResult?.newLevel,
                leveledUp: xpResult?.leveledUp,
                newBadge
            }
        });
    } catch (error) {
        console.error("Error marking lesson complete:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
