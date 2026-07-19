import { prisma } from "@/lib/prisma";
import { TraderSignalInput } from "./signal-types";

export interface LearningRecommendation {
    id: string;
    type: "ACADEMY_LESSON" | "ARTICLE";
    slug: string;
    title: string;
    url: string;
    reason: string;
    signalType: string;
    priority: number;
    estimatedMinutes?: number;
    completed?: boolean;
}

const SIGNAL_CONTENT_MAP: Record<
    string,
    { academyLessonSlugs: string[]; articleSlugs: string[]; reason: string }
> = {
    LOSS_STREAK: {
        academyLessonSlugs: ["trading-routine-for-consistency"],
        articleSlugs: [
            "revenge-trading-and-how-to-stop-it",
            "what-to-do-after-a-losing-streak",
        ],
        reason: "You recently hit a losing streak. Learn how to construct a professional trading routine, manage emotions, and pause safely.",
    },
    SL_CLUSTER: {
        academyLessonSlugs: ["risk-management-foundations"],
        articleSlugs: [
            "stop-loss-strategies-forex",
            "risk-management-plan-template-traders",
        ],
        reason: "Multiple stop-loss triggers in a single day indicate tight placement or volatility friction. Review Stop Loss sizing and risk rules.",
    },
    REVENGE_SIZE_UP: {
        academyLessonSlugs: ["trading-psychology-discipline"],
        articleSlugs: ["revenge-trading-and-how-to-stop-it"],
        reason: "Increasing lot size immediately after a loss is high-risk revenge behavior. Study trading psychology and how to prevent revenge trades.",
    },
    LOW_PLAN_COMPLIANCE: {
        academyLessonSlugs: ["build-your-trading-plan"],
        articleSlugs: [
            "trading-plan-how-to-create-one",
            "trading-rules-every-trader-needs",
        ],
        reason: "Several trades violated your trading plan. Strengthen your pre-trade verification checklist.",
    },
    BE_HEAVY: {
        academyLessonSlugs: ["trade-management-basics"],
        articleSlugs: ["risk-reward-ratio-explained"],
        reason: "Overexposing yourself to break-evens might be defensive exit panic. Review rules on scaling and stop trail rules.",
    },
    WEAK_SYMBOL: {
        academyLessonSlugs: ["market-selection-basics"],
        articleSlugs: ["price-action-trading-for-beginners"],
        reason: "One specific symbol is underperforming. Review whether this symbol aligns with your consistency framework.",
    },
    WEAK_SESSION: {
        academyLessonSlugs: ["market-selection-basics"],
        articleSlugs: ["price-action-trading-for-beginners"],
        reason: "Your win rate drops during a specific session. Refine your session playbook or restrict hours.",
    },
    RECURRING_MISTAKE: {
        academyLessonSlugs: ["trading-psychology-discipline"],
        articleSlugs: ["trading-rules-every-trader-needs"],
        reason: "You logged a recurring execution mistake. Review discipline rules to stop repeated leaks.",
    },
};

export async function getLearningRecommendations(
    userId: string,
    activeSignals: TraderSignalInput[],
    tradingGoal?: string | null
): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];

    // Find already completed lessons to filter them out
    const completedProgress = await prisma.userProgress.findMany({
        where: {
            userId,
            isCompleted: true,
        },
        select: {
            lesson: {
                select: {
                    slug: true,
                },
            },
        },
    });

    const completedSlugs = new Set(completedProgress.map((p) => p.lesson.slug));

    // Evaluate signals
    for (const sig of activeSignals) {
        const mapping = SIGNAL_CONTENT_MAP[sig.signalType];
        if (!mapping) continue;

        // 1. Resolve Academy Lessons
        const uncompletedAcademySlugs = mapping.academyLessonSlugs.filter(
            (slug) => !completedSlugs.has(slug)
        );
        if (uncompletedAcademySlugs.length > 0) {
            const dbLessons = await prisma.lesson.findMany({
                where: {
                    slug: { in: uncompletedAcademySlugs },
                    status: "published",
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    duration: true,
                },
            });

            for (const lesson of dbLessons) {
                recommendations.push({
                    id: `lesson-${lesson.id}`,
                    type: "ACADEMY_LESSON",
                    slug: lesson.slug,
                    title: lesson.title,
                    url: `/dashboard/academy/lessons/${lesson.slug}`,
                    reason: mapping.reason,
                    signalType: sig.signalType,
                    priority: sig.severity === "HIGH" ? 1 : 2,
                    estimatedMinutes: lesson.duration || 10,
                    completed: false,
                });
            }
        }

        // 2. Resolve Articles (always support uncompleted lessons)
        const dbArticles = await prisma.article.findMany({
            where: {
                slug: { in: mapping.articleSlugs },
                status: "PUBLISHED",
            },
            select: {
                id: true,
                title: true,
                slug: true,
            },
        });

        for (const article of dbArticles) {
            recommendations.push({
                id: `article-${article.id}`,
                type: "ARTICLE",
                slug: article.slug,
                title: article.title,
                url: `/articles/${article.slug}`,
                reason: mapping.reason,
                signalType: sig.signalType,
                priority: 3,
                completed: false,
            });
        }
    }

    // Goal-based fallback: when no signal-based recommendations exist,
    // surface lessons based on the user's chosen trading goal
    if (recommendations.length === 0 && tradingGoal) {
        const { GOAL_LESSON_MAP } = await import("./goal-content-map");
        const goalMapping = GOAL_LESSON_MAP[tradingGoal];
        if (goalMapping) {
            const uncompletedGoalSlugs = goalMapping.lessonSlugs.filter(
                (slug) => !completedSlugs.has(slug)
            );
            if (uncompletedGoalSlugs.length > 0) {
                const dbLessons = await prisma.lesson.findMany({
                    where: {
                        slug: { in: uncompletedGoalSlugs },
                        status: "published",
                    },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        duration: true,
                    },
                });

                for (const lesson of dbLessons) {
                    recommendations.push({
                        id: `goal-lesson-${lesson.id}`,
                        type: "ACADEMY_LESSON",
                        slug: lesson.slug,
                        title: lesson.title,
                        url: `/dashboard/academy/lessons/${lesson.slug}`,
                        reason: goalMapping.reason,
                        signalType: "GOAL_RECOMMENDATION",
                        priority: 4,
                        estimatedMinutes: lesson.duration || 10,
                        completed: false,
                    });
                }
            }
        }
    }

    // Sort by priority (1 is highest) and return top 3
    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
export { SIGNAL_CONTENT_MAP };
