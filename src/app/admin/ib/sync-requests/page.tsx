import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAdminSyncRequests } from "@/actions/admin-sync-requests";
import { SyncRequestsClient } from "./client";

export const metadata = {
    title: "Cloud Sync Requests — Admin IB",
    description: "Monitor, audit, and troubleshoot MT5 Cloud Sync worker requests across all trader accounts.",
};

type PageProps = {
    searchParams?: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
};

export default async function SyncRequestsPage({ searchParams }: PageProps) {
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
    const page = params.page ? parseInt(params.page, 10) || 1 : 1;
    const limit = params.limit ? parseInt(params.limit, 10) || 20 : 20;
    const type = (params.type as "ALL" | "CLOUD" | "SUPPORT") || "ALL";
    const status = params.status || "ALL";
    const search = params.q || "";
    const dateRange = params.range || "all";

    const res = await getAdminSyncRequests({
        page,
        type,
        status,
        search,
        dateRange,
        limit,
    });

    return (
        <SyncRequestsClient
            initialData={res}
            currentParams={{
                page: String(page),
                limit: String(limit),
                type,
                status,
                q: search,
                range: dateRange,
            }}
        />
    );
}
