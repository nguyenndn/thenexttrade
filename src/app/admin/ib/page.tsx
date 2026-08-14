import {
    getIbOverviewStats,
    getIbLeadStats,
    type IbStatsRange,
} from "@/actions/ib-lead";
import { getVipRequestStats } from "@/actions/vip-request";
import { getPipelineQueueV2 } from "@/lib/admin/ib/pipeline.server-v2";
import { IbOverviewClient } from "./client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "IB Overview — Admin",
};

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{ range?: string }>;
};

function normalizeRange(range?: string): IbStatsRange {
    if (range === "7d" || range === "30d" || range === "all") return range;
    return "30d";
}

export default async function IbOverviewPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const range = normalizeRange(params?.range);

    const [overview, leadStats, vipStats, pendingQueue] = await Promise.all([
        getIbOverviewStats(range),
        getIbLeadStats(range),
        getVipRequestStats(range),
        getPipelineQueueV2({ status: "PENDING", pageSize: 10 }),
    ]);

    return (
        <IbOverviewClient
            range={range}
            overview={overview}
            leadStats={leadStats}
            vipStats={vipStats}
            pendingRequests={pendingQueue.items}
        />
    );
}
