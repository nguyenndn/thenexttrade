import { getVipRequestStats } from "@/actions/vip-request";
import { getPipelineQueueV2 } from "@/lib/admin/ib/pipeline.server-v2";
import { VipPipelineClient } from "./client";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = {
    title: "VIP Pipeline — Admin IB",
};

type PageProps = {
    searchParams?: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
};

export default async function VipPipelinePage({ searchParams }: PageProps) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const params = (await Promise.resolve(searchParams)) || {};
    const parseNumber = (value?: string) => {
        if (!value) return undefined;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    const [{ items, total }, stats] = await Promise.all([
        getPipelineQueueV2({
            status: params.status,
            stage: params.stage,
            broker: params.broker,
            search: params.q,
            product: params.product,
            accountHealth: params.accountHealth,
            capitalBand: params.capitalBand,
            minAgeHours: parseNumber(params.minAgeHours),
            maxAgeHours: parseNumber(params.maxAgeHours),
            page: params.page ? parseInt(params.page, 10) || 1 : 1,
            pageSize: 25,
        }),
        getVipRequestStats(),
    ]);

    return (
        <VipPipelineClient
            items={items}
            total={total}
            stats={stats}
            currentParams={params}
        />
    );
}
