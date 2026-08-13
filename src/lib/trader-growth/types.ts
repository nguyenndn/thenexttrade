export type TraderMaturityStage =
    | "PROFILE_PENDING"
    | "NO_ACCOUNT"
    | "ACCOUNT_NO_DATA"
    | "DATA_BUILDING"
    | "INSIGHT_READY"
    | "ACTION_ACTIVE"
    | "ACTION_REVIEW_READY"
    | "IMPROVING";

export type TraderIntent = "LEARN_FIRST" | "ANALYZE_TRADES";

export type TraderMaturity = {
    stage: TraderMaturityStage;
    reasonCode: string;
    accountCount: number;
    usableClosedTradeCount: number;
    latestSyncAt: Date | null;
    onboardingDone: boolean;
    firstInsightReady: boolean;
    activeExperimentId: string | null;
    reviewReadyExperimentId: string | null;
};

export type SupportedSyncMethod = {
    id: string;
    enabled: boolean;
    label: string;
    setupHref: string;
    supportsMobileSetup: boolean;
    description: string;
};

export type DataConfidenceLevel = "INSUFFICIENT" | "LOW" | "MEDIUM" | "HIGH";

export type DataConfidenceView = {
    level: DataConfidenceLevel;
    score: number;
    sampleSize: number;
    reasons: string[];
    warnings: string[];
    lastSyncAt: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    accountScope: string[];
};

export type NextBestActionView = {
    id: string;
    priority: number;
    title: string;
    reason: string;
    ctaText: string;
    ctaHref: string;
    category: "SETUP" | "INSIGHT" | "EXPERIMENT" | "REVIEW" | "LEARNING" | "MAINTENANCE";
    evidenceId?: string;
    evidenceDetails?: {
        metric: string;
        sampleSize: number;
        confidence: DataConfidenceLevel;
    };
};

export type InsightSnapshotView = {
    id: string;
    insightType: string;
    title: string;
    summary: string;
    sampleSize: number;
    confidence: DataConfidenceLevel;
    evidence: Record<string, any>;
    createdAt: string;
};

export type ImprovementExperimentView = {
    id: string;
    title: string;
    hypothesis: string;
    instruction: string;
    primaryMetric: string;
    targetTradeCount: number;
    currentTradeCount: number;
    progressPercent: number;
    status: "ACTIVE" | "READY_FOR_REVIEW" | "COMPLETED" | "CANCELLED";
    outcome?: "IMPROVED" | "NO_CHANGE" | "WORSE" | "INCONCLUSIVE" | null;
    baselineSummary: string;
    currentSummary?: string;
    acceptedAt: string;
};

export type LearningRecommendation = {
    id: string;
    type: "LESSON" | "ARTICLE";
    title: string;
    slug: string;
    description: string;
    readTimeMinutes: number;
    weaknessCategory: string;
    reasonToRead: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "REVIEW";
    href: string;
};

export type NotificationCandidate = {
    eventType: string;
    dedupeKey: string;
    title: string;
    body: string;
    actionHref: string;
    cooldownHours: number;
};

export type DashboardSurfacePolicy = {
    showFilters: boolean;
    showSetupGuide: boolean;
    showPrimaryAction: boolean;
    showActivationChecklist: boolean;
    showExperimentProgress: boolean;
    showCoreMetrics: boolean;
    showCharts: boolean;
    showPositiveInsight: boolean;
};

export type TraderGrowthViewModel = {
    maturity: TraderMaturity;
    nextAction: NextBestActionView | null;
    firstInsight: InsightSnapshotView | null;
    activeExperiment: ImprovementExperimentView | null;
    completedExperiment?: ImprovementExperimentView | null;
    dataConfidence: DataConfidenceView;
    learningRecommendations: LearningRecommendation[];
    notificationCandidates: NotificationCandidate[];
    surfacePolicy: DashboardSurfacePolicy;
    flags?: GrowthFeatureFlags;
};

export type GrowthFeatureFlags = {
    GROWTH_ORCHESTRATOR_ENABLED: boolean;
    IMPROVEMENT_EXPERIMENTS_ENABLED: boolean;
    ADAPTIVE_DASHBOARD_ENABLED: boolean;
    ADMIN_IMPROVEMENT_FUNNEL_ENABLED: boolean;
};

export const DEFAULT_GROWTH_FEATURE_FLAGS: GrowthFeatureFlags = {
    GROWTH_ORCHESTRATOR_ENABLED: process.env.FEATURE_GROWTH_ORCHESTRATOR === "true",
    IMPROVEMENT_EXPERIMENTS_ENABLED: process.env.FEATURE_IMPROVEMENT_EXPERIMENTS === "true",
    ADAPTIVE_DASHBOARD_ENABLED: process.env.FEATURE_ADAPTIVE_DASHBOARD === "true",
    ADMIN_IMPROVEMENT_FUNNEL_ENABLED: process.env.FEATURE_ADMIN_IMPROVEMENT_FUNNEL === "true",
};
