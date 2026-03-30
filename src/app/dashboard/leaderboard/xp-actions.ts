"use server";

import { prisma } from "@/lib/prisma";
import { addXP, XP_AWARDS } from "@/lib/gamification";
import { checkAndGrantBadge } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Award XP for completing a lesson
export async function awardLessonXP(lessonId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Check if lesson was already completed (avoid double awarding)
  const progress = await prisma.userProgress.findFirst({
    where: { userId, lessonId, isCompleted: true },
  });

  if (!progress) return null;

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

  const result = await addXP(userId, XP_AWARDS.QUIZ_PASS);
  return result;
}

// Award XP for logging a journal entry
export async function awardJournalXP() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

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

