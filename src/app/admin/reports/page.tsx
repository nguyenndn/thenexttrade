import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReportsDashboard } from "@/components/admin/reports/AdminReportsDashboard";
import { AdminReportsDateFilter } from "@/components/admin/reports/AdminReportsDateFilter";
import { getAdminReportsData } from "@/lib/admin/reports/index.server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
    searchParams: Promise<{
        period?: string;
        range?: string;
        from?: string;
        to?: string;
    }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (!profile || !isAdminRole(profile.role)) redirect("/forbidden");

    const params = await searchParams;
    const filter = {
        period: params?.period,
        range: params?.range,
        from: params?.from,
        to: params?.to,
    };
    const data = await getAdminReportsData(filter);

    return (
        <div className="space-y-6 pb-10">
            <AdminPageHeader
                title="Admin Reports"
                description="System-wide reports for user quality, activation, revenue opportunities, content ROI, and operational health."
            >
                <AdminReportsDateFilter
                    filter={filter}
                    rangeLabel={data.range.label}
                />
            </AdminPageHeader>

            <AdminReportsDashboard data={data} />
        </div>
    );
}
