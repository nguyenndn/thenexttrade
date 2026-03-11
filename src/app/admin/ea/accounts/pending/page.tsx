
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { PendingAccountsList } from "@/components/admin/ea/PendingAccountsList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Pending Requests | Admin",
    description: "Approve or reject EA license requests",
};

export default async function PendingAccountsPage() {
    let licenses: any[] = [];
    try {
        licenses = await prisma.eALicense.findMany({
            where: { status: AccountStatus.PENDING },
            include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
            orderBy: { createdAt: "asc" }, // Oldest first for queue
        });
    } catch (error) {
        console.error("Failed to fetch pending EA requests:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/ea" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pending Requests
                    </h1>
                </div>
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-lg font-bold">
                    {licenses.length} Requests
                </span>
            </div>

            <PendingAccountsList licenses={licenses} />
        </div>
    );
}
