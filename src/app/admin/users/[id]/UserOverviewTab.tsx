import Link from "next/link";
import {
    GraduationCap,
    LineChart,
    FileText,
    Download,
    Monitor,
    Bot,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface UserOverviewTabProps {
    user: {
        id: string;
        email: string | null;
        name: string | null;
        image: string | null;
        createdAt: Date | string;
        level: number;
        xp: number;
        streak: number;
        profile: {
            username: string | null;
            role: string;
            country: string | null;
        } | null;
        tradingAccounts: Array<{
            id: string;
            name: string | null;
            broker: string | null;
            balance: number;
            equity?: number | null;
            currency?: string | null;
            status: string;
            platform: string;
            accountNumber: string | null;
            accountType: string | null;
            server: string | null;
            lastHeartbeat?: Date | string | null;
            lastSync?: Date | string | null;
            createdAt: Date | string;
        }>;
        eaDownloads: Array<{
            id: string;
            createdAt: Date | string;
            version: string;
            platform: string;
            product: {
                id?: string;
                name: string;
                slug?: string;
                type: string;
                version?: string;
            } | null;
        }>;
        eaProductAccesses?: Array<{
            id: string;
            productId: string;
            tradingAccountId: string | null;
            status: string;
            lastUsedAt?: Date | string | null;
            lastHeartbeatAt?: Date | string | null;
            product: {
                id: string;
                name: string;
                slug: string;
                version: string;
                type: string;
            } | null;
            tradingAccount?: {
                id: string;
                accountNumber: string | null;
                broker: string | null;
                server: string | null;
                platform: string | null;
                accountType: string | null;
                balance: number;
                equity: number | null;
                currency: string | null;
                status: string;
                lastHeartbeat: Date | string | null;
                lastSync: Date | string | null;
            } | null;
        }>;
        eaProductUsageEvents?: Array<{
            id: string;
            productId: string;
            tradingAccountId: string | null;
            eventType: string;
            occurredAt: Date | string;
            productVersion?: string | null;
            product: {
                id: string;
                name: string;
                slug: string;
                version: string;
            } | null;
            tradingAccount?: {
                id: string;
                accountNumber: string | null;
            } | null;
        }>;
        journalEntries: Array<{
            id: string;
            createdAt: Date | string;
            symbol: string;
            type: string;
            pnl: number | null;
            account: { name: string } | null;
        }>;
        progress: Array<{
            id: string;
            completedAt: Date | null;
            lesson: { title: string; module: { title: string } | null } | null;
        }>;
        comments: Array<{
            id: string;
            createdAt: Date | string;
            content: string;
        }>;
        EALicenses: Array<{
            id: string;
            broker: string;
            accountNumber: string;
            status: string;
            startDate: Date | string | null;
            expiryDate: Date | string | null;
            createdAt: Date | string;
        }>;
        badges?: Array<{
            id: string;
            badge: {
                name: string;
                description: string | null;
            };
        }>;
        sessions: Array<{
            id: string;
            device: string | null;
            ip: string | null;
            userAgent: string | null;
            lastActive: Date | string;
        }>;
        settings: any;
        _count: {
            tradingAccounts: number;
            EALicenses: number;
            progress: number;
            quizAttempts: number;
            comments: number;
            eaDownloads: number;
            badges?: number;
            sessions: number;
            journalEntries: number;
        };
    };
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function UserOverviewTab({ user }: UserOverviewTabProps) {
    // Build Unified Timeline (Key Milestones only - trade logs filtered to prevent drowning)
    const timelineEvents = [
        ...user.tradingAccounts.map((acc) => ({
            id: `acc-${acc.id}`,
            date: new Date(acc.createdAt),
            type: "account",
            title: `Connected new trading account: ${acc.name}`,
            description: `${acc.broker || "Unknown broker"} · ${acc.platform} ${acc.accountNumber ? `· #${acc.accountNumber}` : ""}`,
            icon: LineChart,
            color: "text-green-500",
            bg: "bg-green-500/10",
        })),
        ...user.eaDownloads.map((dl) => ({
            id: `dl-${dl.id}`,
            date: new Date(dl.createdAt),
            type: "download",
            title: `Downloaded product: ${dl.product?.name || "Unknown"}`,
            description: `v${dl.version} for ${dl.platform}`,
            icon: Download,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        })),
        ...user.progress.map((prog) => ({
            id: `prog-${prog.id}`,
            date: new Date(prog.completedAt || new Date()),
            type: "academy",
            title: `Completed lesson: ${prog.lesson?.title}`,
            description: prog.lesson?.module?.title || "Unknown module",
            icon: GraduationCap,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        })),
        ...user.comments.map((comment) => ({
            id: `comment-${comment.id}`,
            date: new Date(comment.createdAt),
            type: "comment",
            title: `Left a comment`,
            description:
                comment.content.length > 50
                    ? `${comment.content.substring(0, 50)}...`
                    : comment.content,
            icon: FileText,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        })),
    ]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 8);

    // Build consolidated EA allocations for this user
    const accountById = new Map(user.tradingAccounts.map((a) => [a.id, a]));
    const eaAllocationMap = new Map<
        string,
        {
            key: string;
            productId: string;
            productName: string;
            version: string;
            accountNumber: string | null;
            broker: string | null;
            platform: string | null;
            accountType: string | null;
            balance: number | null;
            equity: number | null;
            currency: string;
            lastSignal: string | null;
            isConfirmedAccount: boolean;
        }
    >();

    for (const ar of user.eaProductAccesses || []) {
        if (!ar.product) continue;
        const acc =
            ar.tradingAccount ||
            (ar.tradingAccountId
                ? accountById.get(ar.tradingAccountId)
                : null) ||
            null;
        const key = `${ar.product.id}:${acc?.id || "USER"}`;
        const sig =
            ar.lastHeartbeatAt ||
            ar.lastUsedAt ||
            acc?.lastHeartbeat ||
            acc?.lastSync ||
            null;

        eaAllocationMap.set(key, {
            key,
            productId: ar.product.id,
            productName: ar.product.name,
            version: ar.product.version,
            accountNumber: acc?.accountNumber || null,
            broker: acc?.broker || null,
            platform: acc?.platform || "MT5",
            accountType: acc?.accountType || null,
            balance: acc ? acc.balance : null,
            equity: acc ? (acc.equity ?? acc.balance) : null,
            currency: acc?.currency || "USD",
            lastSignal: sig ? new Date(sig).toISOString() : null,
            isConfirmedAccount: Boolean(acc),
        });
    }

    for (const ev of user.eaProductUsageEvents || []) {
        if (!ev.product) continue;
        const acc = ev.tradingAccountId
            ? accountById.get(ev.tradingAccountId)
            : null;
        const key = `${ev.product.id}:${acc?.id || ev.tradingAccountId || "USER"}`;
        const existing = eaAllocationMap.get(key);
        const evIso = new Date(ev.occurredAt).toISOString();

        if (!existing) {
            eaAllocationMap.set(key, {
                key,
                productId: ev.product.id,
                productName: ev.product.name,
                version: ev.productVersion || ev.product.version,
                accountNumber:
                    acc?.accountNumber ||
                    ev.tradingAccount?.accountNumber ||
                    null,
                broker: acc?.broker || null,
                platform: acc?.platform || "MT5",
                accountType: acc?.accountType || null,
                balance: acc ? acc.balance : null,
                equity: acc ? (acc.equity ?? acc.balance) : null,
                currency: acc?.currency || "USD",
                lastSignal: evIso,
                isConfirmedAccount: Boolean(acc || ev.tradingAccountId),
            });
        } else if (
            !existing.lastSignal ||
            new Date(evIso) > new Date(existing.lastSignal)
        ) {
            existing.lastSignal = evIso;
        }
    }

    const eaAllocations = Array.from(eaAllocationMap.values());

    // Parse user agent to get browser name
    const parseBrowser = (ua: string | null) => {
        if (!ua) return "Unknown";
        if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
        if (ua.includes("Edg")) return "Edge";
        return "Other";
    };

    return (
        <div className="space-y-6">
            {/* Compact user activity summary */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 overflow-hidden">
                <h3 className="text-base font-bold text-gray-700 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
                    User Activity
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        {
                            icon: GraduationCap,
                            color: "text-blue-600 dark:text-blue-400",
                            bg: "bg-blue-100 dark:bg-blue-500/20",
                            label: "Academy",
                            values: [
                                `${user._count.progress} Lessons`,
                                `${user._count.quizAttempts} Quizzes`,
                            ],
                        },
                        {
                            icon: Download,
                            color: "text-orange-600 dark:text-orange-400",
                            bg: "bg-orange-100 dark:bg-orange-500/20",
                            label: "Products & Licenses",
                            values: [
                                `${user._count.eaDownloads} Downloads`,
                                `${eaAllocations.length || user._count.EALicenses} Active EAs`,
                            ],
                        },
                        {
                            icon: FileText,
                            color: "text-indigo-600 dark:text-indigo-400",
                            bg: "bg-indigo-100 dark:bg-indigo-500/20",
                            label: "Engagement",
                            values: [
                                `${user._count.comments} Comments`,
                                `${user.streak} Day Streak`,
                            ],
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 p-3 text-center dark:bg-white/5"
                        >
                            <div
                                className={`p-1 ${stat.bg} ${stat.color} rounded-lg w-max mx-auto mb-1.5`}
                            >
                                <stat.icon size={14} />
                            </div>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                                {stat.label}
                            </p>
                            {stat.values.map((v) => (
                                <p
                                    key={v}
                                    className="text-[11px] font-medium text-gray-600 dark:text-gray-300"
                                >
                                    {v}
                                </p>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Trading Systems (EAs) & Account Telemetry */}
            {eaAllocations.length > 0 && (
                <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
                        <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2">
                            <Bot size={18} className="text-amber-500" />
                            Active Trading Systems (EAs)
                        </h3>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                            {eaAllocations.length}{" "}
                            {eaAllocations.length === 1
                                ? "deployment"
                                : "deployments"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {eaAllocations.map((alloc) => {
                            const isOnline =
                                alloc.lastSignal &&
                                Date.now() -
                                    new Date(alloc.lastSignal).getTime() <=
                                    TWENTY_FOUR_HOURS_MS;

                            return (
                                <div
                                    key={alloc.key}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-3.5"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={`/admin/trading-systems/${alloc.productId}`}
                                                className="text-xs font-bold text-gray-900 dark:text-white hover:text-amber-500 transition-colors"
                                            >
                                                {alloc.productName}
                                            </Link>
                                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                v{alloc.version}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                            {alloc.accountNumber
                                                ? `#${alloc.accountNumber} · ${alloc.broker || alloc.platform || "MT5"}`
                                                : "User-level license (Awaiting account link)"}
                                        </p>

                                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
                                            <span className="relative flex h-2 w-2 shrink-0">
                                                {isOnline && (
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                )}
                                                <span
                                                    className={`relative inline-flex rounded-full h-2 w-2 ${
                                                        isOnline
                                                            ? "bg-emerald-500"
                                                            : alloc.lastSignal
                                                              ? "bg-amber-500"
                                                              : "bg-gray-400"
                                                    }`}
                                                />
                                            </span>
                                            <span>
                                                {alloc.lastSignal
                                                    ? formatDistanceToNow(
                                                          new Date(
                                                              alloc.lastSignal
                                                          ),
                                                          { addSuffix: true }
                                                      )
                                                    : "No heartbeat yet"}
                                            </span>
                                        </div>
                                    </div>

                                    {alloc.balance !== null && (
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-black text-gray-900 dark:text-white font-mono">
                                                {new Intl.NumberFormat(
                                                    "en-US",
                                                    {
                                                        style: "currency",
                                                        currency:
                                                            alloc.currency,
                                                        maximumFractionDigits: 2,
                                                    }
                                                ).format(alloc.balance)}
                                            </p>
                                            {alloc.equity !== null && (
                                                <p className="text-[10px] text-gray-500 font-mono">
                                                    Eq:{" "}
                                                    {new Intl.NumberFormat(
                                                        "en-US",
                                                        {
                                                            style: "currency",
                                                            currency:
                                                                alloc.currency,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    ).format(alloc.equity)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ---- below: free-flowing content ---- */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                {/* Recent account activity */}
                <div className="xl:col-span-3 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base font-bold text-gray-700 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
                        Recent Account Activity
                    </h3>
                    {timelineEvents.length > 0 ? (
                        <div className="max-h-[290px] overflow-y-auto pr-1">
                            <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-4 space-y-5 pl-5">
                                {timelineEvents.map((evt) => (
                                    <div key={evt.id} className="relative">
                                        <div
                                            className={`absolute -left-[26px] top-1 w-7 h-7 rounded-full border-[3px] border-white dark:border-[#151925] flex items-center justify-center ${evt.bg} ${evt.color}`}
                                        >
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
                                                {format(
                                                    evt.date,
                                                    "MMM d, yyyy · HH:mm"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-600">
                                No recent activity found.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right mini-column: Sessions — 2/5 width */}
                <div className="xl:col-span-2">
                    {/* Recent Sessions */}
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <Monitor size={16} className="text-gray-500" />{" "}
                                Recent Sessions
                            </h3>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                                {user._count.sessions}
                            </span>
                        </div>
                        {user.sessions.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-white/10">
                                {user.sessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className="p-4 sm:px-6 space-y-1"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-700 dark:text-white">
                                                {parseBrowser(s.userAgent)}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                {formatDistanceToNow(
                                                    new Date(s.lastActive),
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-600">
                                            {s.ip || "Unknown IP"}{" "}
                                            {s.device ? `· ${s.device}` : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <p className="text-xs text-gray-600">
                                    No sessions recorded.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
