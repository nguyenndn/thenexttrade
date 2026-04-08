import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { TradingSystemsClient } from "@/components/dashboard/trading-systems/TradingSystemsClient";

export const metadata: Metadata = {
    title: "EA & Indicators | TheNextTrade",
    description: "Download professional trading indicators and EAs",
};

export default async function TradingSystemsPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // OPTIMIZED: Fetch all data in parallel
    const [licenses, products, downloadCount, eaBrokers] = await Promise.all([
        prisma.eALicense.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        }),
        prisma.eAProduct.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.eADownload.count({
            where: { userId: user.id },
        }),
        prisma.eABroker.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        }),
    ]);

    // Check for Approved License
    const hasApprovedLicense = licenses.some(
        (l) => l.status === AccountStatus.APPROVED && (!l.expiryDate || l.expiryDate >= new Date())
    );

    return (
        <div className="space-y-4">
            <TradingSystemsClient
                licenses={licenses}
                products={products}
                hasApprovedLicense={hasApprovedLicense}
                hasDownloaded={downloadCount > 0}
                eaBrokers={eaBrokers}
            />
        </div>
    );
}
