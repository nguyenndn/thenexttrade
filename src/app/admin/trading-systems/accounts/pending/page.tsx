import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { PendingAccountsList } from "@/components/admin/trading-systems/PendingAccountsList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const metadata: Metadata = {
    title: "Pending Requests | Admin",
    description: "Approve or reject EA license requests",
};

export const dynamic = "force-dynamic";

export default async function PendingAccountsPage() {
    await requireAdminPageAccess();
    let licenses: any[] = [];
    try {
        licenses = await prisma.eALicense.findMany({
            where: { status: AccountStatus.PENDING },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });
    } catch (error) {
        console.error("Failed to fetch pending EA requests:", error);
    }

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Pending Requests"
                description="Approve or reject EA license requests."
                backHref="/admin/trading-systems"
            >
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl font-bold text-sm">
                    {licenses.length} Requests
                </span>
            </AdminPageHeader>

            <PendingAccountsList licenses={licenses} />
        </div>
    );
}
