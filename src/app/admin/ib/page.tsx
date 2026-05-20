import { getIbOverviewStats, getIbLeadStats, type IbStatsRange } from "@/actions/ib-lead";
import { getVipRequestStats } from "@/actions/vip-request";
import { IbOverviewClient } from "./client";

export const metadata = {
  title: "IB Overview — Admin",
};

type PageProps = {
  searchParams?: Promise<{ range?: string }> | { range?: string };
};

function normalizeRange(range?: string): IbStatsRange {
  if (range === "7d" || range === "30d" || range === "all") return range;
  return "30d";
}

export default async function IbOverviewPage({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams);
  const range = normalizeRange(params?.range);

  const [overview, leadStats, vipStats] = await Promise.all([
    getIbOverviewStats(range),
    getIbLeadStats(range),
    getVipRequestStats(range),
  ]);

  return (
    <IbOverviewClient
      range={range}
      overview={overview}
      leadStats={leadStats}
      vipStats={vipStats}
    />
  );
}
