// =============================================================================
// Admin System Reports — Type Definitions
// =============================================================================

export type ReportPeriod = "7d" | "30d" | "90d";

export interface DateRange {
  period: ReportPeriod;
  days: number;
  since: Date;
  previousSince: Date;
  previousUntil: Date;
}

// --- North Star ---
export interface NorthStarReport {
  activeTraders: number;
  previousActiveTraders: number;
  trendPct: number;
  newUsers: number;
  connectedAccountUsers: number;
  firstTradeUsers: number;
  weeklyReportUsers: number;
  proRequestUsers: number;
  proUnlockedUsers: number;
}

// --- Action Queue ---
export interface ActionQueueItem {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "pro" | "sync" | "activation" | "content" | "support" | "security" | "data";
  title: string;
  description: string;
  count: number;
  href: string;
  cta: string;
}

export interface ActionQueueReport {
  items: ActionQueueItem[];
  totalCritical: number;
  totalHigh: number;
}

// --- Alerts ---
export interface AdminAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  href: string;
}

export interface AlertReport {
  alerts: AdminAlert[];
}

// --- User Quality ---
export type QualityBand = "High Quality" | "Warm" | "Low Intent" | "Empty Signup";

export interface UserQualityRow {
  id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  qualityScore: number;
  qualityBand: QualityBand;
  accountCount: number;
  tradeJournalCount: number;
  balance: number;
  recommendedAction: string;
}

export interface UserQualityReport {
  averageScore: number;
  usersWithAccount: number;
  realAccountUsers: number;
  inactiveAfterSignup: number;
  newUsers: number;
  topUsers: UserQualityRow[];
}

// --- User Lifecycle ---
export type LifecycleStage =
  | "Signed Up"
  | "Profile Ready"
  | "Account Connected"
  | "First Trade"
  | "First Insight Viewed"
  | "Weekly Review"
  | "Pro Candidate"
  | "Pro User"
  | "At Risk"
  | "Churned";

export interface LifecycleStageStat {
  stage: LifecycleStage;
  count: number;
  percent: number;
}

export interface LifecycleDropoff {
  fromStage: LifecycleStage;
  toStage: LifecycleStage;
  dropCount: number;
  dropRate: number;
  suggestedAction: string;
}

export interface UserLifecycleReport {
  stages: LifecycleStageStat[];
  dropoffs: LifecycleDropoff[];
  totalUsers: number;
}

// --- Feature Adoption ---
export type TrackingStatus = "Tracked" | "Partial" | "Missing";

export interface FeatureAdoptionRow {
  feature: string;
  users: number;
  actions: number;
  adoptionRate: number;
  trendPct: number | null;
  nextConversion: string | null;
  trackingStatus: TrackingStatus;
}

export interface FeatureAdoptionReport {
  features: FeatureAdoptionRow[];
  totalActiveUsers: number;
}

// --- Revenue Opportunity ---
export interface RevenueOpportunityRow {
  id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  broker: string | null;
  balance: number;
  activitySummary: string;
  proStatus: string;
  opportunityReason: string;
  suggestedAction: string;
}

export interface RevenueOpportunityReport {
  proUsers: number;
  freeUsers: number;
  proCandidates: number;
  pendingProRequests: number;
  estimatedIbRevenue: number | null;
  opportunities: RevenueOpportunityRow[];
}

// --- Content ROI ---
export interface ContentRoiRow {
  articleId: string;
  title: string;
  slug: string;
  views: number;
  signupAssists: number;
  accountAssists: number;
  proAssists: number;
  roiScore: number;
  issues: string[];
}

export interface ContentRoiReport {
  topArticles: ContentRoiRow[];
  totalArticleViews: number;
  attributionPartial: boolean;
}

// --- Friction ---
export interface FrictionRow {
  area: string;
  count: number;
  affectedUsers: number;
  severity: "critical" | "high" | "medium" | "low";
  recommendedFix: string;
  href: string;
}

export interface FrictionReport {
  items: FrictionRow[];
  totalFrictionEvents: number;
}

// --- Data Quality ---
export interface DataQualityIssue {
  group: string;
  issue: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low";
  suggestedFix: string;
  href: string;
}

export interface DataQualityReport {
  healthScore: number;
  issues: DataQualityIssue[];
}

// --- Root ---
export interface AdminReportsData {
  period: ReportPeriod;
  generatedAt: string;
  actionQueue: ActionQueueReport;
  northStar: NorthStarReport;
  userQuality: UserQualityReport;
  userLifecycle: UserLifecycleReport;
  featureAdoption: FeatureAdoptionReport;
  revenueOpportunity: RevenueOpportunityReport;
  contentRoi: ContentRoiReport;
  friction: FrictionReport;
  dataQuality: DataQualityReport;
  alerts: AlertReport;
}
