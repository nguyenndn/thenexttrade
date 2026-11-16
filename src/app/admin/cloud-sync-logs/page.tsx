import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { getAdminSyncRequests } from "@/actions/admin-sync-requests";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SyncRequestsClient } from "./client";

export const metadata = {
    title: "Cloud Sync Logs — Admin",
    description:
        "Monitor automated MT5 Cloud Sync jobs, delivery outcomes, and connection diagnostics across trader accounts.",
};

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams?:
        | Promise<Record<string, string | undefined>>
        | Record<string, string | undefined>;
};

export default async function CloudSyncLogsPage({ searchParams }: PageProps) {
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
    const status = params.status || "ALL";
    const search = params.q || "";
    const dateRange = params.range || "all";

    const res = await getAdminSyncRequests({
        page,
        status,
        search,
        dateRange,
        limit,
    });

    return (
        <div className="space-y-6 pb-10">
            <AdminPageHeader
                title="Cloud Sync Logs"
                description="Monitor automated MT5 Cloud Sync jobs, delivery outcomes, and connection diagnostics across trader accounts."
                backHref="/admin"
            />

            <SyncRequestsClient
                initialData={res}
                currentParams={{
                    page: String(page),
                    limit: String(limit),
                    status,
                    q: search,
                    range: dateRange,
                }}
            />
        </div>
    );
}
