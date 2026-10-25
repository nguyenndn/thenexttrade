import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { getAdminMt5CloudMonitorData } from "./actions";
import { Mt5CloudAdminClient } from "./client";

export const metadata: Metadata = {
    title: "MT5 Cloud Direct Bridge Monitor — Admin",
    description:
        "Real-time monitoring of connected MT5 Cloud accounts, C# .NET Bridge telemetry, and 24/5 armed rules.",
};

export default async function AdminMt5CloudPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const initialData = await getAdminMt5CloudMonitorData();

    return <Mt5CloudAdminClient initialData={initialData} />;
}
