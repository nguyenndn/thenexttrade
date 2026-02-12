import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, Shield, ExternalLink, Activity } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { notFound } from "next/navigation";

interface UserDetailPageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserDetailPage(props: UserDetailPageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;

    let backHref = "/admin/users";
    let backLabel = "Back to Users";

    if (from?.includes("/admin/ea/accounts/pending")) {
        backHref = "/admin/ea/accounts/pending";
        backLabel = "Back to Pending Requests";
    } else if (from?.includes("/admin/ea/accounts")) {
        backHref = "/admin/ea/accounts";
        backLabel = "Back to Accounts";
    }

    const user = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
            profile: true,
            EALicenses: {
                orderBy: { createdAt: "desc" },
            },
            tradingAccounts: {
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    EALicenses: true,
                    tradingAccounts: true,
                },
            },
        },
    });

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-8">
            {/* Header / Navigation */}
            <div>
                <Link
                    href={backHref}
                    className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    {backLabel}
                </Link>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24 border-4 border-white dark:border-[#1E2028] shadow-lg">
                            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                {(user.name || user.email || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                {user.name || "Unnamed User"}
                            </h1>
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Mail size={14} />
                                    {user.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Calendar size={14} />
                                    Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-500/20">
                                    <Shield size={12} />
                                    {user.profile?.role || "USER"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Details */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-2">
                            Profile Details
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</p>
                                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{user.id}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.profile?.username || "Not set"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                    {user.profile?.bio || "No bio provided."}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Created</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {format(new Date(user.createdAt), "dd/MM/yyyy")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Updated</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {format(new Date(user.updatedAt), "dd/MM/yyyy")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 pb-2 mb-4">
                            Gamification
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                                <p className="text-xs text-amber-600 font-bold uppercase">Streak</p>
                                <p className="text-xl font-black text-amber-700 dark:text-amber-500">{user.streak}🔥</p>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                <p className="text-xs text-purple-600 font-bold uppercase">Level</p>
                                <p className="text-xl font-black text-purple-700 dark:text-purple-500">{user.level}</p>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                <p className="text-xs text-blue-600 font-bold uppercase">XP</p>
                                <p className="text-xl font-black text-blue-700 dark:text-blue-500">{user.xp}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Content Tabs */}
                    <div className="space-y-8">
                        {/* EA Licenses Column */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Activity className="text-primary" />
                                    EA Licenses
                                    <span className="text-gray-400 font-medium text-lg ml-1">
                                        ({user._count.EALicenses})
                                    </span>
                                </h2>
                            </div>

                            {user.EALicenses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {user.EALicenses.map((license) => (
                                        <div key={license.id} className="bg-white dark:bg-[#1E2028] p-2 rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm group flex items-center gap-3 relative overflow-hidden">
                                            <div className="shrink-0">
                                                <BrokerLogo broker={license.broker} size={60} />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-1 py-1">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="font-black text-gray-900 dark:text-white font-mono text-sm tracking-tight truncate">
                                                            {license.accountNumber}
                                                        </p>
                                                        <StatusBadge status={license.status} className="scale-90 origin-right" />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                                        {format(new Date(license.createdAt), "dd MMM yyyy")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5 p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                                    No EA licenses found.
                                </div>
                            )}
                        </div>

                        {/* Trading Accounts Column (Placeholder for now) */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Trading Accounts
                                <span className="text-gray-400 font-medium text-lg ml-2">
                                    ({user._count.tradingAccounts})
                                </span>
                            </h2>
                            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
                                No connected trading accounts.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
