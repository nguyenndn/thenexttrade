import { getIbOverviewStats, getIbLeadStats } from "@/actions/ib-lead";
import { getVipRequestStats } from "@/actions/vip-request";
import { IbOverviewClient } from "./client";

export const metadata = {
  title: "IB Overview — Admin",
};

export default async function IbOverviewPage() {
  const [overview, leadStats, vipStats] = await Promise.all([
    getIbOverviewStats(),
    getIbLeadStats(),
    getVipRequestStats(),
  ]);

  return (
    <IbOverviewClient
      overview={overview}
      leadStats={leadStats}
      vipStats={vipStats}
    />
  );
}
