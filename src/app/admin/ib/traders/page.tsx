import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TraderMonitorClient } from "./client";
import {
    getPaginatedTraderMonitor,
    parseTraderFilters,
} from "@/lib/admin/ib/ib-monitor.server";

export const metadata = {
    title: "Trader Monitor — Admin IB",
};

type PageProps = {
    searchParams?: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
};

export default async function TraderMonitorPage({ searchParams }: PageProps) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const rawParams = (await Promise.resolve(searchParams)) || {};
    const filters = parseTraderFilters(rawParams);

    const result = await getPaginatedTraderMonitor(filters);

    return (
        <TraderMonitorClient
            initialData={result}
            currentFilters={filters}
        />
    );
}
