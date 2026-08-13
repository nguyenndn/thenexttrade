import { prisma } from "@/lib/prisma";
import { LearningRecommendation as SharedLearningRecommendation } from "@/lib/trader-growth/types";
import { TraderSignalInput } from "./signal-types";

export interface GetLearningRecommendationsOptions {
    userId: string;
    activeSignals?: TraderSignalInput[];
    tradingGoal?: string | null;
    limit?: number;
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
        reason: "You recently hit a losing streak. Learn how to construct a professional trading routine.",
    },
    SL_CLUSTER: {
        academyLessonSlugs: ["risk-management-foundations"],
        articleSlugs: [
            "stop-loss-strategies-forex",
            "risk-management-plan-template-traders",
        ],
        reason: "Multiple stop-loss triggers indicate tight placement or volatility friction. Review Stop Loss rules.",
    },
    REVENGE_SIZE_UP: {
        academyLessonSlugs: ["trading-psychology-discipline"],
        articleSlugs: ["revenge-trading-and-how-to-stop-it"],
        reason: "Increasing lot size immediately after a loss is high-risk revenge behavior.",
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
        reason: "Review rules on scaling and stop trail rules to prevent panic exits.",
    },
    WEAK_SYMBOL: {
        academyLessonSlugs: ["market-selection-basics"],
        articleSlugs: ["price-action-trading-for-beginners"],
        reason: "One specific symbol is underperforming. Review symbol consistency.",
    },
    WEAK_SESSION: {
        academyLessonSlugs: ["market-selection-basics"],
        articleSlugs: ["price-action-trading-for-beginners"],
        reason: "Win rate drops during a specific session. Refine your session playbook.",
    },
    RECURRING_MISTAKE: {
        academyLessonSlugs: ["trading-psychology-discipline"],
        articleSlugs: ["trading-rules-every-trader-needs"],
        reason: "You logged a recurring execution mistake. Review discipline rules.",
    },
};

export async function getLearningRecommendations(
    optionsOrUserId: GetLearningRecommendationsOptions | string,
    activeSignalsParam?: TraderSignalInput[],
    tradingGoalParam?: string | null
): Promise<SharedLearningRecommendation[]> {
    let userId: string;
    let activeSignals: TraderSignalInput[] = [];
    let tradingGoal: string | null = null;
    let limit = 2;

    if (typeof optionsOrUserId === "string") {
        userId = optionsOrUserId;
        activeSignals = activeSignalsParam || [];
        tradingGoal = tradingGoalParam || null;
    } else {
        userId = optionsOrUserId.userId;
        activeSignals = optionsOrUserId.activeSignals || [];
        tradingGoal = optionsOrUserId.tradingGoal || null;
        limit = optionsOrUserId.limit || 2;
    }

    const recommendations: SharedLearningRecommendation[] = [];

    // Find already completed lessons
    const completedProgress = await prisma.userProgress.findMany({
        where: {
            userId,
            isCompleted: true,
        },
        select: {
            lesson: {
                select: { slug: true },
            },
        },
    });

    const completedSlugs = new Set(completedProgress.map((p) => p.lesson.slug));

    // Batch query lessons and articles
    const targetLessonSlugs = new Set<string>();
    const targetArticleSlugs = new Set<string>();

    activeSignals.forEach((sig) => {
        const mapping = SIGNAL_CONTENT_MAP[sig.signalType];
        if (mapping) {
            mapping.academyLessonSlugs.forEach((s) => targetLessonSlugs.add(s));
            mapping.articleSlugs.forEach((s) => targetArticleSlugs.add(s));
        }
    });

    // Fallback defaults if no signal match
    if (targetLessonSlugs.size === 0) {
        targetLessonSlugs.add("risk-management-foundations");
        targetLessonSlugs.add("trading-psychology-discipline");
    }
    if (targetArticleSlugs.size === 0) {
        targetArticleSlugs.add("trading-rules-every-trader-needs");
    }

    // Batch DB queries
    const [dbLessons, dbArticles] = await Promise.all([
        prisma.lesson.findMany({
            where: {
                slug: { in: Array.from(targetLessonSlugs) },
            },
            select: {
                id: true,
                title: true,
                slug: true,
                duration: true,
                status: true,
            },
        }),
        prisma.article.findMany({
            where: {
                slug: { in: Array.from(targetArticleSlugs) },
            },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
            },
        }),
    ]);

    for (const lesson of dbLessons) {
        const isCompleted = completedSlugs.has(lesson.slug);
        recommendations.push({
            id: `lesson-${lesson.id}`,
            type: "LESSON",
            title: lesson.title,
            slug: lesson.slug,
            description: "Master risk management rules and execution discipline.",
            readTimeMinutes: lesson.duration || 10,
            weaknessCategory: "RISK_DISCIPLINE",
            reasonToRead: "Targeted to help improve execution consistency.",
            status: isCompleted ? "COMPLETED" : "NOT_STARTED",
            href: `/dashboard/academy/lessons/${lesson.slug}`,
        });
    }

    for (const article of dbArticles) {
        recommendations.push({
            id: `article-${article.id}`,
            type: "ARTICLE",
            title: article.title,
            slug: article.slug,
            description: article.excerpt || "Read key trading psychology insights.",
            readTimeMinutes: 5,
            weaknessCategory: "PSYCHOLOGY",
            reasonToRead: "Recommended article for risk rules.",
            status: "NOT_STARTED",
            href: `/articles/${article.slug}`,
        });
    }

    return recommendations.slice(0, limit);
}

export { SIGNAL_CONTENT_MAP };
