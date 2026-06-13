import "server-only";
import type { ReportPeriod, AdminReportsData } from "./types";
import { getDateRange } from "./date-range";
import { getNorthStarReport } from "./north-star.server";
import { getActionQueueReport } from "./action-queue.server";
import { getAlertReport } from "./alerts.server";
import { getUserLifecycleReport } from "./user-lifecycle.server";
import { getUserQualityReport } from "./user-quality.server";
import { getFeatureAdoptionReport } from "./feature-adoption.server";
import { getRevenueOpportunityReport } from "./revenue-opportunity.server";
import { getContentRoiReport } from "./content-roi.server";
import { getFrictionReport } from "./friction.server";
import { getDataQualityReport } from "./data-quality.server";

export async function getAdminReportsData(period: ReportPeriod): Promise<AdminReportsData> {
 const range = getDateRange(period);

 const [
 actionQueue,
 northStar,
 userQuality,
 userLifecycle,
 featureAdoption,
 revenueOpportunity,
 contentRoi,
 friction,
 dataQuality,
 alerts,
 ] = await Promise.all([
 getActionQueueReport(range),
 getNorthStarReport(range),
 getUserQualityReport(range),
 getUserLifecycleReport(range),
 getFeatureAdoptionReport(range),
 getRevenueOpportunityReport(range),
 getContentRoiReport(range),
 getFrictionReport(range),
 getDataQualityReport(),
 getAlertReport(range),
 ]);

 return {
 period,
 generatedAt: new Date().toISOString(),
 actionQueue,
 northStar,
 userQuality,
 userLifecycle,
 featureAdoption,
 revenueOpportunity,
 contentRoi,
 friction,
 dataQuality,
 alerts,
 };
}
