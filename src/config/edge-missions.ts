// ============================================================================
// EDGE MISSIONS CONFIG
// Static mission definitions — matched by missionId in UserMissionProgress
// ============================================================================

export type MissionCategory = "DAILY" | "ONBOARDING" | "WEEKLY" | "MASTERY";
export type MissionCadence = "ONCE" | "DAILY" | "WEEKLY";

export interface MissionDef {
    id: string;
    title: string;
    description: string;
    whyItMatters: string;
    icon: string; // Lucide icon name
    category: MissionCategory;
    target: number;
    xpReward: number;
    eventType: string; // Maps to EdgeEvent.eventType for progress tracking
    repeatable: boolean;
    cadence: MissionCadence;
    ctaLabel: string;
    ctaHref: string;
    priority: number;
}

export const EDGE_MISSIONS: MissionDef[] = [
    // ── ONBOARDING ──
    {
        id: "FIRST_JOURNAL",
        title: "Log Your First Trade",
        description: "Add one trade to start building your trading journal.",
        whyItMatters: "Your first trade unlocks performance stats, weekly reviews, and pattern detection.",
        icon: "file-text",
        category: "ONBOARDING",
        target: 1,
        xpReward: 50,
        eventType: "JOURNAL_ENTRY",
        repeatable: false,
        cadence: "ONCE",
        ctaLabel: "Log Trade",
        ctaHref: "/dashboard/journal",
        priority: 10,
    },
    {
        id: "FIRST_LESSON",
        title: "Complete Your First Lesson",
        description: "Finish one Academy lesson to build your foundation.",
        whyItMatters: "Lessons help turn random trading activity into a repeatable process.",
        icon: "graduation-cap",
        category: "ONBOARDING",
        target: 1,
        xpReward: 30,
        eventType: "LESSON_COMPLETE",
        repeatable: false,
        cadence: "ONCE",
        ctaLabel: "Start Learning",
        ctaHref: "/dashboard/academy",
        priority: 20,
    },
    // -- DAILY --
    {
        id: "DAILY_CHECKIN",
        title: "Daily Check-in",
        description: "Check in once today to keep your consistency streak alive.",
        whyItMatters: "Daily check-ins keep your trading rhythm visible and turn discipline into a measurable habit.",
        icon: "calendar-check",
        category: "DAILY",
        target: 1,
        xpReward: 20,
        eventType: "CHECKIN",
        repeatable: true,
        cadence: "DAILY",
        ctaLabel: "Check In",
        ctaHref: "/dashboard/settings/streak",
        priority: 5,
    },
    // -- ONBOARDING --
    {
        id: "FIRST_WEEKLY_REVIEW",
        title: "Generate Your First Weekly Review",
        description: "Create your first weekly review from your trading data.",
        whyItMatters: "Weekly reviews turn your trades into one strength, one leak, and one next focus.",
        icon: "bar-chart-3",
        category: "ONBOARDING",
        target: 1,
        xpReward: 60,
        eventType: "WEEKLY_REVIEW_GENERATED",
        repeatable: false,
        cadence: "ONCE",
        ctaLabel: "Open Reports",
        ctaHref: "/dashboard/reports?type=weekly-review",
        priority: 35,
    },

    // ── WEEKLY ──
    {
        id: "WEEKLY_5_TRADES",
        title: "Build This Week's Journal",
        description: "Log 5 trades this week.",
        whyItMatters: "A weekly sample gives your reports enough data to find your strongest setup and biggest leak.",
        icon: "trending-up",
        category: "WEEKLY",
        target: 5,
        xpReward: 100,
        eventType: "JOURNAL_ENTRY",
        repeatable: true,
        cadence: "WEEKLY",
        ctaLabel: "Log Trade",
        ctaHref: "/dashboard/journal",
        priority: 40,
    },
    {
        id: "WEEKLY_REVIEW",
        title: "Run This Week's Review",
        description: "Generate a weekly review for the current week.",
        whyItMatters: "A weekly review keeps your focus specific instead of letting mistakes blur together.",
        icon: "clipboard-check",
        category: "WEEKLY",
        target: 1,
        xpReward: 80,
        eventType: "WEEKLY_REVIEW_GENERATED",
        repeatable: true,
        cadence: "WEEKLY",
        ctaLabel: "Generate Review",
        ctaHref: "/dashboard/reports?type=weekly-review",
        priority: 45,
    },
    {
        id: "WEEKLY_3_LESSONS",
        title: "Study Week",
        description: "Complete 3 Academy lessons this week.",
        whyItMatters: "Short study streaks keep your execution rules fresh before the next trading session.",
        icon: "book-open",
        category: "WEEKLY",
        target: 3,
        xpReward: 80,
        eventType: "LESSON_COMPLETE",
        repeatable: true,
        cadence: "WEEKLY",
        ctaLabel: "Continue Academy",
        ctaHref: "/dashboard/academy",
        priority: 50,
    },

    // ── MASTERY ──
    {
        id: "QUIZ_MASTER",
        title: "Prove Your Playbook",
        description: "Pass 5 Academy quizzes with a score above 80%.",
        whyItMatters: "Quizzes confirm you understand the rules before risking capital.",
        icon: "brain",
        category: "MASTERY",
        target: 5,
        xpReward: 200,
        eventType: "QUIZ_PASS",
        repeatable: false,
        cadence: "ONCE",
        ctaLabel: "Take Quiz",
        ctaHref: "/dashboard/academy",
        priority: 60,
    },
];

export function getMissionDef(missionId: string): MissionDef | undefined {
    return EDGE_MISSIONS.find((m) => m.id === missionId);
}

export function getMissionsByCategory(
    category: MissionCategory
): MissionDef[] {
    return EDGE_MISSIONS.filter((m) => m.category === category);
}
