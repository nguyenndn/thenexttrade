import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AccountsTable } from "@/components/admin/trading-systems/AccountsTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
    title: "All Accounts | Admin",
    description: "View all EA trading accounts",
};

export default async function AllAccountsPage() {
    let licenses: any[] = [];
    try {
        licenses = await prisma.eALicense.findMany({
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
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Failed to fetch all EA accounts:", error);
    }

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="All Accounts"
                description="View all EA trading accounts."
                backHref="/admin/trading-systems"
            >
                <span className="bg-white dark:bg-[#1E2028] text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl font-bold text-sm shadow-sm border border-gray-200 dark:border-white/10">
                    {licenses.length} Total
                </span>
            </AdminPageHeader>

            <AccountsTable licenses={licenses} />
        </div>
    );
}
