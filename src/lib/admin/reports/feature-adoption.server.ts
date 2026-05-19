import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange, FeatureAdoptionReport, FeatureAdoptionRow, TrackingStatus } from "./types";
import { pct, trendPct } from "./date-range";

interface FeatureConfig {
  feature: string;
  eventNames: string[];
  countModel?: "journalEntry" | "tradingReport" | "eADownload" | "userMissionProgress" | "edgeEvent" | "userProgress";
  nextConversion: string | null;
}

const FEATURE_CONFIGS: FeatureConfig[] = [
  { feature: "Trading Account Connect", eventNames: ["account_connect_started", "account_connect_completed"], nextConversion: "First trade synced" },
  { feature: "Trade Sync", eventNames: [], nextConversion: "Journal entry" },
  { feature: "Journal", eventNames: ["journal_entry_created"], countModel: "journalEntry", nextConversion: "Weekly report" },
  { feature: "Reports", eventNames: ["weekly_review_generate_clicked", "weekly_review_generate_succeeded"], countModel: "tradingReport", nextConversion: "Pro request" },
  { feature: "Missions", eventNames: ["mission_claimed"], countModel: "userMissionProgress", nextConversion: null },
  { feature: "Edge Progress", eventNames: [], countModel: "edgeEvent", nextConversion: null },
  { feature: "Academy", eventNames: ["academy_lesson_started", "academy_lesson_completed"], countModel: "userProgress", nextConversion: null },
  { feature: "Free vs Pro Modal", eventNames: ["free_vs_pro_opened"], nextConversion: "Pro request submitted" },
  { feature: "Pro Request", eventNames: ["pro_request_started", "pro_request_submitted", "partner_pro_requested"], nextConversion: null },
  { feature: "EA Download", eventNames: ["ea_download_clicked"], countModel: "eADownload", nextConversion: null },
];

export async function getFeatureAdoptionReport(range: DateRange): Promise<FeatureAdoptionReport> {
  const { since, previousSince, previousUntil } = range;
  const totalActiveUsers = await prisma.user.count({ where: { createdAt: { gte: since } } });

  const [currentEvents, prevEvents] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: since } }, _count: { id: true } }),
    prisma.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: previousSince, lt: previousUntil } }, _count: { id: true } }),
  ]);
  const currentMap = new Map(currentEvents.map((e) => [e.name, e._count.id]));
  const prevMap = new Map(prevEvents.map((e) => [e.name, e._count.id]));

  const uniqueUserEvents = await prisma.analyticsEvent.groupBy({
    by: ["name", "userId"],
    where: { createdAt: { gte: since }, userId: { not: null } },
  });
  const uniqueUsersByEvent = new Map<string, Set<string>>();
  for (const ue of uniqueUserEvents) {
    if (!ue.userId) continue;
    if (!uniqueUsersByEvent.has(ue.name)) uniqueUsersByEvent.set(ue.name, new Set());
    uniqueUsersByEvent.get(ue.name)!.add(ue.userId);
  }

  const [journalUsers, reportUsers, downloadUsers, missionUsers, edgeUsers, academyUsers] = await Promise.all([
    prisma.journalEntry.groupBy({ by: ["userId"], where: { createdAt: { gte: since } } }).then((r) => r.length),
    prisma.tradingReport.groupBy({ by: ["userId"], where: { createdAt: { gte: since } } }).then((r) => r.length),
    prisma.eADownload.groupBy({ by: ["userId"], where: { createdAt: { gte: since } } }).then((r) => r.length),
    prisma.userMissionProgress.groupBy({ by: ["userId"], where: { createdAt: { gte: since } } }).then((r) => r.length),
    prisma.edgeEvent.groupBy({ by: ["userId"], where: { createdAt: { gte: since } } }).then((r) => r.length),
    prisma.userProgress.groupBy({ by: ["userId"], where: { completedAt: { gte: since } } }).then((r) => r.length),
  ]);

  const modelUserCounts: Record<string, number> = {
    journalEntry: journalUsers, tradingReport: reportUsers, eADownload: downloadUsers,
    userMissionProgress: missionUsers, edgeEvent: edgeUsers, userProgress: academyUsers,
  };

  const features: FeatureAdoptionRow[] = FEATURE_CONFIGS.map((cfg) => {
    const totalActions = cfg.eventNames.reduce((s, name) => s + (currentMap.get(name) ?? 0), 0);
    const prevTotalActions = cfg.eventNames.reduce((s, name) => s + (prevMap.get(name) ?? 0), 0);
    let users = 0;
    for (const name of cfg.eventNames) { const set = uniqueUsersByEvent.get(name); if (set) users = Math.max(users, set.size); }
    if (cfg.countModel && modelUserCounts[cfg.countModel]) users = Math.max(users, modelUserCounts[cfg.countModel]);

    let trackingStatus: TrackingStatus = "Missing";
    if (cfg.countModel) trackingStatus = "Tracked";
    else if (cfg.eventNames.length > 0 && totalActions > 0) trackingStatus = "Tracked";
    else if (cfg.eventNames.length > 0) trackingStatus = "Partial";

    return { feature: cfg.feature, users, actions: totalActions || users, adoptionRate: pct(users, totalActiveUsers), trendPct: prevTotalActions > 0 ? trendPct(totalActions, prevTotalActions) : null, nextConversion: cfg.nextConversion, trackingStatus };
  });

  return { features, totalActiveUsers };
}
