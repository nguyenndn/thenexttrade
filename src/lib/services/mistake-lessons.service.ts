import { prisma } from "@/lib/prisma";

// ============================================================================
// MISTAKE → LESSON MAPPING SERVICE
// ============================================================================

/**
 * Maps common trading mistake IDs to Academy lesson slugs.
 * Used by AI Weekly Coach and Edge Leak Detector to recommend
 * specific lessons based on detected patterns.
 */
const MISTAKE_LESSON_MAP: Record<string, {
  lessonSlugs: string[];
  description: string;
}> = {
  "revenge-trading": {
    lessonSlugs: [
      "revenge-trading-and-how-to-stop-it",
      "trading-routine-for-consistency",
    ],
    description: "You tend to enter trades impulsively after a loss.",
  },
  "overtrading-day": {
    lessonSlugs: [
      "trading-plan-how-to-create-one",
      "trading-rules-every-trader-needs",
    ],
    description: "You trade too frequently on certain days, leading to lower win rates.",
  },
  "weak-pair": {
    lessonSlugs: [
      "price-action-trading-for-beginners",
    ],
    description: "You have consistently poor results on specific pairs.",
  },
  "emotion-pattern": {
    lessonSlugs: [
      "trading-routine-for-consistency",
    ],
    description: "Certain emotional states correlate with losses in your trades.",
  },
  "plan-compliance": {
    lessonSlugs: [
      "trading-plan-how-to-create-one",
      "trading-rules-every-trader-needs",
    ],
    description: "You frequently deviate from your trading plan.",
  },
  "risk-discipline": {
    lessonSlugs: [
      "risk-management-plan-template-traders",
      "stop-loss-strategies-forex",
      "risk-reward-ratio-explained",
      "the-1-percent-rule-in-trading",
    ],
    description: "Many of your trades lack a proper stop loss.",
  },
  "max_daily_loss": {
    lessonSlugs: [
      "risk-management-plan-template-traders",
      "the-1-percent-rule-in-trading",
    ],
    description: "You exceeded your maximum daily loss limit.",
  },
  "max_daily_trades": {
    lessonSlugs: [
      "trading-rules-every-trader-needs",
      "trading-routine-for-consistency",
    ],
    description: "You placed more trades than your daily limit allows.",
  },
  "cooldown_after_losses": {
    lessonSlugs: [
      "revenge-trading-and-how-to-stop-it",
    ],
    description: "You continued trading immediately after hitting your loss streak threshold.",
  },
};

export interface LessonRecommendation {
  mistakeId: string;
  mistakeDescription: string;
  lessons: Array<{
    slug: string;
    title: string;
    url: string;
  }>;
}

/**
 * Given a list of detected mistake IDs (from smart-analytics insights or rule violations),
 * returns recommended Academy lessons.
 */
export async function getRecommendedLessons(
  mistakeIds: string[]
): Promise<LessonRecommendation[]> {
  const recommendations: LessonRecommendation[] = [];
  const allSlugs = new Set<string>();

  // Collect all lesson slugs
  for (const mistakeId of mistakeIds) {
    const normalized = mistakeId.replace(/^weak-pair-.*/, "weak-pair");
    const mapping = MISTAKE_LESSON_MAP[normalized];
    if (mapping) {
      mapping.lessonSlugs.forEach((s) => allSlugs.add(s));
    }
  }

  // Fetch article titles in one query
  const articles = allSlugs.size > 0
    ? await prisma.article.findMany({
        where: { slug: { in: Array.from(allSlugs) }, status: "PUBLISHED" },
        select: { slug: true, title: true },
      })
    : [];

  const articleMap = new Map(articles.map((a) => [a.slug, a.title]));

  // Build recommendations
  for (const mistakeId of mistakeIds) {
    const normalized = mistakeId.replace(/^weak-pair-.*/, "weak-pair");
    const mapping = MISTAKE_LESSON_MAP[normalized];
    if (!mapping) continue;

    const lessons = mapping.lessonSlugs
      .filter((slug) => articleMap.has(slug))
      .map((slug) => ({
        slug,
        title: articleMap.get(slug) || slug,
        url: `/articles/${slug}`,
      }));

    if (lessons.length > 0) {
      recommendations.push({
        mistakeId,
        mistakeDescription: mapping.description,
        lessons,
      });
    }
  }

  return recommendations;
}
