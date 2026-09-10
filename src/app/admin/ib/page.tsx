import { getIbOverviewStats, getIbLeadStats } from "@/actions/ib-lead";
import { type IbStatsFilter } from "@/lib/admin/ib/date-filter";
import { getVipRequestStats } from "@/actions/vip-request";
import { getPipelineQueueV2 } from "@/lib/admin/ib/pipeline.server-v2";
import { IbOverviewClient } from "./client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "IB Overview — Admin",
};

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{ range?: string; from?: string; to?: string }>;
};

export default async function IbOverviewPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const filter: IbStatsFilter = {
        range: params?.range,
        from: params?.from,
        to: params?.to,
    };

    const [overview, leadStats, vipStats, pendingQueue] = await Promise.all([
        getIbOverviewStats(filter),
        getIbLeadStats(filter),
        getVipRequestStats(filter),
        getPipelineQueueV2({ status: "PENDING", pageSize: 10 }),
    ]);

    return (
        <IbOverviewClient
            rangeFilter={filter}
            overview={overview}
            leadStats={leadStats}
            vipStats={vipStats}
            pendingRequests={pendingQueue.items}
        />
    );
}
