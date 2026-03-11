
import { Metadata } from "next";
import Link from "next/link";
import {
    Users,
    Clock,
    CheckCircle,
    Download,
    Bot,
    ArrowRight,
    Briefcase,
    Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/admin/widgets/StatCard";

export const metadata: Metadata = {
    title: "EA Management | Admin",
    description: "Manage EA licenses and products",
};

async function getStats() {
    try {
        const [pendingCount, approvedCount, productsCount, downloadsAggregate] = await Promise.all([
            prisma.eALicense.count({ where: { status: AccountStatus.PENDING } }),
            prisma.eALicense.count({ where: { status: AccountStatus.APPROVED } }),
            prisma.eAProduct.count({ where: { isActive: true } }),
            prisma.eADownload.count()
        ]);

        return {
            pendingCount,
            approvedCount,
            productsCount,
            totalDownloads: downloadsAggregate,
        };
    } catch (error) {
        console.error("Error fetching EA stats:", error);
        return { pendingCount: 0, approvedCount: 0, productsCount: 0, totalDownloads: 0 };
    }
}

async function getRecentPending() {
    try {
        return await prisma.eALicense.findMany({
            where: { status: AccountStatus.PENDING },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { user: { select: { email: true, name: true } } },
        });
    } catch (error) {
        console.error("Error fetching recent pending EA licenses:", error);
        return [];
    }
}

async function getLicensesByBroker() {
    try {
        const data = await prisma.eALicense.groupBy({
            by: ['broker'],
            where: { status: AccountStatus.APPROVED },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });
        return data;
    } catch (error) {
        console.error("Error fetching broker stats:", error);
        return [];
    }
}

export default async function EADashboardPage() {
    // OPTIMIZED: Fetch stats and pending in parallel
    const [stats, recentPending, brokerStats] = await Promise.all([
        getStats(),
        getRecentPending(),
        getLicensesByBroker()
    ]);

    return (
        <div className="space-y-4 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full" aria-hidden="true"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            EA Management
                        </h1>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                        Overview of license requests and products
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/ea/products/create">
                        <Button variant="primary" className="shadow-primary/30">
                            <Bot size={18} aria-hidden="true" /> New Product
                        </Button>
                    </Link>
                    <Link href="/admin/ea/accounts/pending">
                        <Button variant="outline">
                            Manage Requests
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Pending Requests"
                    value={stats.pendingCount}
                    icon={Clock}
                    color="yellow"
                />
                <StatCard
                    title="Active Licenses"
                    value={stats.approvedCount}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="Active Products"
                    value={stats.productsCount}
                    icon={Bot}
                    color="cyan"
                />
                <StatCard
                    title="Total Downloads"
                    value={stats.totalDownloads}
                    icon={Download}
                    color="blue"
                />
            </div>

            {/* Recent Pending Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pending Requests */}
                <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-gray-200 dark:border-white/10 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="text-yellow-500" size={24} />
                            Recent Requests
                        </h2>
                        <Link
                            href="/admin/ea/accounts/pending"
                            className="text-sm font-bold text-primary hover:text-[#00B078] flex items-center gap-1"
                        >
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentPending.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <CheckCircle size={40} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                                <p>No pending requests</p>
                            </div>
                        ) : (
                            recentPending.map((license) => (
                                <div
                                    key={license.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex items-center gap-4">
                                        <BrokerLogo broker={license.broker} size={64} />
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white font-mono">
                                                {license.accountNumber}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {license.user.name || license.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block mb-1">
                                            {formatDistanceToNow(license.createdAt, { addSuffix: true, locale: enUS })}
                                        </span>
                                        <StatusBadge status={license.status} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Links / Info */}
                <div className="space-y-6 flex flex-col h-full">
                    {/* Navigation Card */}
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-gray-200 dark:border-white/10 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Navigation</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link href="/admin/ea/accounts" className="block">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition border border-gray-200 dark:border-white/10">
                                    <Users className="mb-3 text-blue-500" size={24} aria-hidden="true" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">All Licenses</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage user licenses</p>
                                </div>
                            </Link>
                            <Link href="/admin/ea/products" className="block">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition border border-gray-200 dark:border-white/10">
                                    <Bot className="mb-3 text-cyan-500" size={24} aria-hidden="true" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">EA Products</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage files and versions</p>
                                </div>
                            </Link>
                            <Link href="/admin/ea/brokers" className="block">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition border border-gray-200 dark:border-white/10">
                                    <Briefcase className="mb-3 text-amber-500" size={24} aria-hidden="true" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">EA Brokers</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage supported brokers</p>
                                </div>
                            </Link>
                            <Link href="/admin/ea/settings" className="block">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition border border-gray-200 dark:border-white/10">
                                    <Settings className="mb-3 text-slate-500" size={24} aria-hidden="true" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">System Settings</h3>
                                    <p className="text-sm text-gray-500 mt-1">Configure global EA options</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Active Licenses by Broker Widget */}
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-gray-200 dark:border-white/10 shadow-sm flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <Briefcase className="text-primary" size={24} aria-hidden="true" />
                            Active by Broker
                        </h2>
                        
                        <div className="space-y-5">
                            {brokerStats.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No active licenses found.</p>
                            ) : (
                                brokerStats.map((stat, index) => {
                                    // Calculate percentage for progress bar
                                    const maxCount = brokerStats[0]._count.id || 1;
                                    const percentage = (stat._count.id / maxCount) * 100;
                                    
                                    return (
                                        <div key={stat.broker} className="space-y-2 group">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <BrokerLogo broker={stat.broker} size={36} />
                                                    <span className="font-bold text-gray-900 dark:text-white capitalize group-hover:text-primary transition-colors text-base">
                                                        {stat.broker.toLowerCase()}
                                                    </span>
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 select-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    {stat._count.id} ACTIVE
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}

