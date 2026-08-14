import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReportsDashboard } from "@/components/admin/reports/AdminReportsDashboard";
import { getAdminReportsData } from "@/lib/admin/reports/index.server";
import { parseReportPeriod } from "@/lib/admin/reports/date-range";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PERIODS = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
] as const;

interface Props {
    searchParams: Promise<{ period?: string }>;
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
    const period = parseReportPeriod(params.period);
    const data = await getAdminReportsData(period);

    return (
        <div className="space-y-6 pb-10">
            <AdminPageHeader
                title="Admin Reports"
                description="System-wide reports for user quality, activation, revenue opportunities, content ROI, and operational health."
            >
                {/* Period switcher */}
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-1 shadow-sm">
                    {PERIODS.map((p) => (
                        <Link
                            key={p.value}
                            href={`/admin/reports?period=${p.value}`}
                            className={`rounded-lg px-4 py-2 text-xs font-black transition-colors ${
                                period === p.value
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                            }`}
                        >
                            {p.label}
                        </Link>
                    ))}
                </div>
            </AdminPageHeader>

            <AdminReportsDashboard data={data} />
        </div>
    );
}
