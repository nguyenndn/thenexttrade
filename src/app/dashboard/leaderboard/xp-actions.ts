"use server";

import { prisma } from "@/lib/prisma";
import { addXP, XP_AWARDS } from "@/lib/gamification";
import { checkAndGrantBadge } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
}

// Award XP for completing a lesson
export async function awardLessonXP(lessonId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    if (!lessonId || typeof lessonId !== "string") return null;

    // Check if lesson is completed
    const progress = await prisma.userProgress.findFirst({
        where: { userId, lessonId, isCompleted: true },
    });

    if (!progress) return null;

    const { recordEdgeEventOnce } = await import("@/lib/edge-awards");
    const recordedEvent = await recordEdgeEventOnce({
        userId,
        eventType: "LESSON_COMPLETE",
        sourceType: "Lesson",
        sourceId: lessonId,
        xpAwarded: XP_AWARDS.LESSON_COMPLETE,
    });
    if (recordedEvent === null) return null;

    const result = await addXP(userId, XP_AWARDS.LESSON_COMPLETE);

    // Check badge milestones
    const completedCount = await prisma.userProgress.count({
        where: { userId, isCompleted: true },
    });

    if (completedCount >= 5) {
        await checkAndGrantBadge(userId, "STUDIOUS");
    }

    return result;
}

// Award XP for passing a quiz
export async function awardQuizXP(quizId: string) {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    if (!quizId || typeof quizId !== "string") return null;

    // 1. Verify that the quiz exists AND the user has actually passed it
    const passedAttempt = await prisma.userQuizAttempt.findFirst({
        where: {
            userId,
            quizId,
            passed: true,
        },
        orderBy: { score: "desc" },
        select: { id: true, score: true },
    });
    if (!passedAttempt) return null;

    // 2. Atomically record the quiz pass event once (prevents concurrent race condition)
    const { recordEdgeEventOnce } = await import("@/lib/edge-awards");
    const recordedEvent = await recordEdgeEventOnce({
        userId,
        eventType: "QUIZ_PASS",
        sourceType: "Quiz",
        sourceId: quizId,
        xpAwarded: XP_AWARDS.QUIZ_PASS,
        metadata: { score: passedAttempt.score },
    });
    if (recordedEvent === null) return null;

    const result = await addXP(userId, XP_AWARDS.QUIZ_PASS);

    return result;
}

// Award XP for logging a journal entry
export async function awardJournalXP() {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // 1. Verify that the user has created a trade or journal entry recently (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEntry = await prisma.journalEntry.findFirst({
        where: {
            userId,
            createdAt: { gte: oneDayAgo },
        },
        orderBy: { createdAt: "desc" },
    });
    if (!recentEntry) return null;

    // 2. Verify that journal XP was not already awarded today (daily cooldown)
    const recentAward = await prisma.edgeEvent.findFirst({
        where: {
            userId,
            eventType: "JOURNAL_ENTRY",
            createdAt: { gte: oneDayAgo },
        },
    });
    if (recentAward) return null;

    const { recordEdgeEventOnce } = await import("@/lib/edge-awards");
    const recordedEvent = await recordEdgeEventOnce({
        userId,
        eventType: "JOURNAL_ENTRY",
        sourceType: "JournalEntry",
        sourceId: recentEntry.id,
        xpAwarded: XP_AWARDS.JOURNAL_ENTRY,
    });
    if (recordedEvent === null) return null;

    const result = await addXP(userId, XP_AWARDS.JOURNAL_ENTRY);

    // Check first trade badge
    const tradeCount = await prisma.journalEntry.count({
        where: { userId },
    });

    if (tradeCount >= 1) {
        await checkAndGrantBadge(userId, "TRADER");
    }

    return result;
}
