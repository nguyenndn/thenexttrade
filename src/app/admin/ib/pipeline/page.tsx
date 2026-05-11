import { getVipRequests, getVipRequestStats } from "@/actions/vip-request";
import { VipPipelineClient } from "./client";

export const metadata = {
  title: "VIP Pipeline — Admin",
};

export default async function VipPipelinePage() {
  const [{ requests, total }, stats] = await Promise.all([
    getVipRequests({ limit: 50 }),
    getVipRequestStats(),
  ]);

  return (
    <VipPipelineClient
      requests={requests as any}
      total={total}
      stats={stats}
    />
  );
}
