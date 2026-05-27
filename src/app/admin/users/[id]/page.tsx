import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
    Mail, Clock, ShieldCheck, Award, GraduationCap, LineChart, FileText,
    Download, Key, Monitor, Globe, Trophy
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { QuickActions } from "./QuickActions";
import { AdminNotes } from "./AdminNotes";
import { getCountryName, normalizeCountryCode } from "@/lib/country-utils";

export default async function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!id) return notFound();

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            profile: true,
            tradingAccounts: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, broker: true, balance: true, status: true, platform: true, accountNumber: true, accountType: true, server: true, createdAt: true }
            },
            eaDownloads: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { product: { select: { name: true, type: true } } }
            },
            journalEntries: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, symbol: true, type: true, pnl: true, createdAt: true, account: { select: { name: true } } }
            },
            progress: {
                take: 5,
                orderBy: { completedAt: 'desc' },
                include: { lesson: { select: { title: true, module: { select: { title: true } } } } }
            },
            comments: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, content: true, createdAt: true }
            },
            // NEW: EA Licenses
            EALicenses: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, broker: true, accountNumber: true, status: true, startDate: true, expiryDate: true, createdAt: true }
            },
            // NEW: Badges
            badges: {
                take: 8,
                orderBy: { earnedAt: 'desc' },
                include: { badge: true }
            },
            // NEW: Sessions
            sessions: {
                take: 3,
                orderBy: { lastActive: 'desc' },
                select: { id: true, device: true, ip: true, userAgent: true, lastActive: true, createdAt: true }
            },
            _count: {
                select: {
                    progress: true,
                    quizAttempts: true,
                    tradingAccounts: true,
                    journalEntries: true,
                    eaDownloads: true,
                    EALicenses: true,
                    comments: true,
                    badges: true,
                    sessions: true,
                }
            }
        }
    });

    if (!user) return notFound();

    // Last Active
    const lastSession = user.sessions[0];
    const lastActive = lastSession?.lastActive ? new Date(lastSession.lastActive) : null;
    const countryCode = normalizeCountryCode(user.profile?.country);

    // Build Unified Timeline
    const timelineEvents = [
        ...user.tradingAccounts.map(acc => ({
            id: `acc-${acc.id}`,
            date: new Date(acc.createdAt),
            type: 'account',
            title: `Connected new trading account: ${acc.name}`,
            description: `${acc.broker || 'Unknown broker'} · ${acc.platform} ${acc.accountNumber ? `· #${acc.accountNumber}` : ''}`,
            icon: LineChart,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        })),
        ...user.eaDownloads.map(dl => ({
            id: `dl-${dl.id}`,
            date: new Date(dl.createdAt),
            type: 'download',
            title: `Downloaded product: ${dl.product?.name || 'Unknown'}`,
            description: `v${dl.version} for ${dl.platform}`,
            icon: Download,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        })),
        ...user.journalEntries.map(trade => ({
            id: `trade-${trade.id}`,
            date: new Date(trade.createdAt),
            type: 'trade',
            title: `Logged a ${trade.type} trade on ${trade.symbol}`,
            description: `Account: ${trade.account?.name || 'N/A'} · ${trade.pnl && trade.pnl > 0 ? 'Profit' : 'Loss'}: $${Math.abs(trade.pnl || 0).toFixed(2)}`,
            icon: LineChart,
            color: trade.pnl && trade.pnl > 0 ? 'text-green-500' : 'text-red-500',
            bg: trade.pnl && trade.pnl > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
        })),
        ...user.progress.map(prog => ({
            id: `prog-${prog.id}`,
            date: new Date(prog.completedAt || new Date()),
            type: 'academy',
            title: `Completed lesson: ${prog.lesson?.title}`,
            description: prog.lesson?.module?.title || 'Unknown module',
            icon: GraduationCap,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        })),
        ...user.comments.map(comment => ({
            id: `comment-${comment.id}`,
            date: new Date(comment.createdAt),
            type: 'comment',
            title: `Left a comment`,
            description: comment.content.length > 50 ? `${comment.content.substring(0, 50)}...` : comment.content,
            icon: FileText,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

    // License status styling
    const licenseStatusStyles: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
        APPROVED: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
        REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
        EXPIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-500',
        SUSPENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    };

    // Parse user agent to get browser name
    const parseBrowser = (ua: string | null) => {
        if (!ua) return 'Unknown';
        if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edg')) return 'Edge';
        return 'Other';
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <AdminPageHeader
                title={`User Detail - ${user.email || "No email"}`}
                description={`${user.name || "Unnamed User"} · Joined ${format(new Date(user.createdAt), "MMM d, yyyy")}`}
                backHref="/admin/users"
            >
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-500/20 dark:hover:bg-red-500/10">
                    Ban User
                </Button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                {/* ============================================================ */}
                {/* LEFT COLUMN: Identity & Assets                               */}
                {/* ============================================================ */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925]">
                        {/* Gradient Cover */}
                        <div className="h-28 bg-gradient-to-br from-emerald-100 via-teal-50 to-white dark:from-primary/20 dark:via-primary/5 dark:to-transparent" />
                        
                        <div className="px-6 pb-5 text-center">
                            <Avatar className="mx-auto -mt-14 mb-4 h-28 w-28 border-[6px] border-white shadow-xl dark:border-[#151925]">
                                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                                <AvatarFallback className="bg-gradient-to-tr from-primary to-blue-500 text-white font-bold text-3xl">
                                    {user.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="mt-2 text-xl font-black text-gray-800 dark:text-white">
                                {user.name || "Unnamed User"}
                            </h2>
                            <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                                {user.profile?.username ? `@${user.profile.username}` : "No username set"}
                            </p>
                            
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${user.profile?.role === 'ADMIN'
                                ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                : 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                                }`}>
                                <ShieldCheck size={14} /> {user.profile?.role || "USER"}
                            </span>
                            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                                {countryCode ? (
                                    <>
                                        <img
                                            src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${countryCode.toLowerCase()}.svg`}
                                            alt={getCountryName(countryCode)}
                                            className="h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm"
                                        />
                                        <span>{getCountryName(countryCode)}</span>
                                        <span className="text-gray-400">{countryCode}</span>
                                    </>
                                ) : (
                                    <>
                                        <Globe size={13} className="text-gray-500" />
                                        <span>Unknown country</span>
                                        <span className="font-medium text-gray-400">No country captured yet</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-[#1a1f2e] sm:px-6 sm:py-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <Mail size={15} className="text-gray-500 shrink-0" />
                                    <span className="font-medium text-gray-700 dark:text-white truncate text-xs">
                                        {user.email || "No email"}
                                    </span>
                                </div>
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <Clock size={15} className="text-gray-500 shrink-0" />
                                    <span className="font-medium text-gray-700 dark:text-white text-xs">
                                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </span>
                                </div>
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <Award size={15} className="text-gray-500 shrink-0" />
                                    <span className="font-medium text-gray-700 dark:text-white text-xs">
                                        Lv.{user.level} · {user.xp} Edge
                                    </span>
                                </div>
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <Globe size={15} className="text-gray-500 shrink-0" />
                                    <span className="font-medium text-gray-700 dark:text-white text-xs">
                                        {lastActive
                                            ? formatDistanceToNow(lastActive, { addSuffix: true })
                                            : "Never"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <QuickActions userId={user.id} userEmail={user.email || ""} userName={user.name || "User"} currentRole={user.profile?.role || "USER"} />
                    </div>

                    {/* Trading Accounts */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-700 dark:text-white">Trading Accounts</h3>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                {user._count.tradingAccounts} Total
                            </span>
                        </div>
                        {user.tradingAccounts.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {user.tradingAccounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] sm:px-6">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-600 max-sm:hidden">
                                                <LineChart size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-white">
                                                    <span className="truncate">{acc.name || "Unnamed Account"}</span>
                                                    {(acc.accountType === "DEMO" || acc.server?.toLowerCase().includes('demo')) ? (
                                                        <span className="shrink-0 text-[11px] font-bold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Demo</span>
                                                    ) : (
                                                        <span className="shrink-0 text-[11px] font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Real</span>
                                                    )}
                                                </p>
                                                <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-gray-600">
                                                    {acc.broker || "Unknown Broker"} · {acc.platform || "MT4"} {acc.accountNumber ? `· #${acc.accountNumber}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-black text-gray-700 dark:text-white">${acc.balance?.toFixed(2) || "0.00"}</p>
                                            <span className={`inline-block mt-0.5 text-[11px] font-bold uppercase tracking-wider ${acc.status === 'CONNECTED' ? 'text-green-500' : 'text-gray-500'
                                                }`}>
                                                {acc.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-600">No trading accounts linked yet.</p>
                            </div>
                        )}
                    </div>

                    {/* EA Licenses */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <Key size={18} className="text-gray-500" /> EA Licenses
                            </h3>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                                {user._count.EALicenses} Total
                            </span>
                        </div>
                        {user.EALicenses.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {user.EALicenses.map(lic => (
                                    <div key={lic.id} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] sm:px-6">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-600 max-sm:hidden">
                                                <Key size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-gray-700 dark:text-white">
                                                    {lic.broker} · #{lic.accountNumber}
                                                </p>
                                                <p className="mt-0.5 truncate text-[11px] text-gray-600">
                                                    {lic.startDate ? `Since ${format(new Date(lic.startDate), "MMM d, yyyy")}` : "Pending approval"}
                                                    {lic.expiryDate ? ` · Expires ${format(new Date(lic.expiryDate), "MMM d, yyyy")}` : " · Lifetime"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest ${licenseStatusStyles[lic.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {lic.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-600">No EA licenses registered.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================================ */}
                {/* RIGHT COLUMN: Activity & Management                          */}
                {/* ============================================================ */}
                <div className="min-w-0 space-y-6">
                    <div className="space-y-6">
                    {/* Activity Overview — Compact inline stats */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 overflow-hidden">
                        <h3 className="text-base font-bold text-gray-700 dark:text-white border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
                            Activity Overview
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                { icon: GraduationCap, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20", label: "Academy", values: [`${user._count.progress} Lessons`, `${user._count.quizAttempts} Quizzes`] },
                                { icon: LineChart, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-500/20", label: "Trading", values: [`${user._count.tradingAccounts} Accounts`, `${user._count.journalEntries} Trades`] },
                                { icon: FileText, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/20", label: "Engagement", values: [`${user._count.comments} Comments`, `${user.streak} Day Streak`] },
                                { icon: Download, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20", label: "Products", values: [`${user._count.eaDownloads} Downloads`, `${user._count.EALicenses} Licenses`] },
                            ].map(stat => (
                                <div key={stat.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center dark:border-white/5 dark:bg-white/5">
                                    <div className={`p-1 ${stat.bg} ${stat.color} rounded-md w-max mx-auto mb-1.5`}>
                                        <stat.icon size={14} />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
                                    {stat.values.map(v => (
                                        <p key={v} className="text-[11px] font-medium text-gray-600 dark:text-gray-300">{v}</p>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements & Admin Notes — side by side */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        {/* Achievements */}
                        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <Trophy size={16} className="text-amber-500" /> Achievements
                                </h3>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                    {user._count.badges}
                                </span>
                            </div>
                            {user.badges.length > 0 ? (
                                <div className="p-4 grid grid-cols-4 gap-2">
                                    {user.badges.map(ub => (
                                        <div key={ub.id} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-colors group" title={ub.badge.description}>
                                            <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-md group-hover:scale-110 transition-transform">
                                                <Trophy size={14} />
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-700 dark:text-gray-300 text-center leading-tight truncate w-full">
                                                {ub.badge.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-xs text-gray-600">No achievements yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Admin Notes — Interactive */}
                        <AdminNotes userId={user.id} initialNotes={(user.settings as Record<string, string>)?.adminNotes || ""} />
                    </div>
                    </div>

                    {/* ---- below: free-flowing content ---- */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                        {/* Recent Activity Timeline — 3/5 width */}
                        <div className="xl:col-span-3 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6">
                            <h3 className="text-base font-bold text-gray-700 dark:text-white border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
                                Recent Activity Timeline
                            </h3>
                            {timelineEvents.length > 0 ? (
                                <div className="max-h-[290px] overflow-y-auto pr-1">
                                    <div className="relative border-l-2 border-gray-100 dark:border-white/5 ml-4 space-y-5 pl-5">
                                    {timelineEvents.map((evt) => (
                                        <div key={evt.id} className="relative">
                                            <div className={`absolute -left-[26px] top-1 w-7 h-7 rounded-full border-[3px] border-white dark:border-[#151925] flex items-center justify-center ${evt.bg} ${evt.color}`}>
                                                <evt.icon size={11} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-700 dark:text-white mb-0.5">
                                                    {evt.title}
                                                </p>
                                                <p className="text-xs text-gray-600 font-medium mb-1">
                                                    {evt.description}
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    {format(evt.date, "MMM d, yyyy · HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-gray-600">No recent activity found.</p>
                                </div>
                            )}
                        </div>

                        {/* Right mini-column: Sessions — 2/5 width */}
                        <div className="xl:col-span-2">
                            {/* Recent Sessions */}
                            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        <Monitor size={16} className="text-gray-500" /> Recent Sessions
                                    </h3>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                        {user._count.sessions}
                                    </span>
                                </div>
                                {user.sessions.length > 0 ? (
                                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                                        {user.sessions.map(s => (
                                            <div key={s.id} className="p-4 sm:px-6 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-white">
                                                        {parseBrowser(s.userAgent)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {formatDistanceToNow(new Date(s.lastActive), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-600">
                                                    {s.ip || "Unknown IP"} {s.device ? `· ${s.device}` : ""}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center">
                                        <p className="text-xs text-gray-600">No sessions recorded.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
