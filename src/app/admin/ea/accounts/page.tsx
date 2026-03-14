
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AccountsTable } from "@/components/admin/ea/AccountsTable";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "All Accounts | Admin",
    description: "View all EA trading accounts",
};

export default async function AllAccountsPage() {
    let licenses: any[] = [];
    try {
        licenses = await prisma.eALicense.findMany({
            include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Failed to fetch all EA accounts:", error);
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                <div className="flex items-center gap-3">
                    <Link href="/admin/ea" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0" title="Back to EA Dashboard">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <div className="w-1.5 h-8 bg-primary rounded-full shrink-0" aria-hidden="true"></div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                        All Accounts
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-white dark:bg-[#1E2028] text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl font-bold text-sm shadow-sm border border-gray-200 dark:border-white/5">
                        {licenses.length} Total
                    </span>
                </div>
            </div>

            <AccountsTable licenses={licenses} />
        </div>
    );
}
