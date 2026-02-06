
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
    const licenses = await prisma.eALicense.findMany({
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/ea" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        All Accounts
                    </h1>
                </div>
                <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg font-bold">
                    {licenses.length} Total
                </span>
            </div>

            <AccountsTable licenses={licenses} />
        </div>
    );
}
