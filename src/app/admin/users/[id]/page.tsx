import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
    Mail,
    Clock,
    ShieldCheck,
    Globe,
    WalletCards,
    CircleDollarSign,
    RefreshCw,
    Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { QuickActions } from "./QuickActions";
import { AdminNotes } from "./AdminNotes";
import { UserIdCopyBadge } from "./UserIdCopyBadge";
import { UserAccountsList } from "./UserAccountsList";
import { UserLicensesList } from "./UserLicensesList";
import { getCountryName, normalizeCountryCode } from "@/lib/country-utils";
import { UserVipProTab } from "./UserVipProTab";
import { UserIbPerformanceTab } from "./UserIbPerformanceTab";
import { UserOverviewTab } from "./UserOverviewTab";
import { UserDetailTabsWrapper } from "./UserDetailTabsWrapper";
import { UserJournalTab } from "./UserJournalTab";
import { UserTradePlansTab } from "./UserTradePlansTab";
import { UserRulesGoalsTab } from "./UserRulesGoalsTab";
import { UserReportsNotesTab } from "./UserReportsNotesTab";
import {
    computeCapitalBreakdown,
    isDemoTradingAccount,
    isLiveCapitalAccount,
} from "@/lib/admin/ib/capital.server";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";
import { UserNarrativeSummary } from "@/components/admin/users/UserNarrativeSummary";
import { classifyUser } from "@/lib/admin/behavior/classify.server";
import { computeTraderSignals } from "@/lib/coach/signal-engine.server";
import { BehaviorClassification } from "@/lib/admin/behavior/types";

export const dynamic = "force-dynamic";

function formatCurrencyBreakdown(values: Record<string, number>): string {
    const entries = Object.entries(values);
    if (entries.length === 0) return "No real account data";

    return entries
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currency, value]) => {
            if (currency === "UNKNOWN") {
                return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} (currency unknown)`;
            }

            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 2,
            }).format(value);
        })
        .join(" / ");
}

export default async function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireAdminPageAccess();
    const { id } = await params;

    if (!id) return notFound();

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            profile: true,
            tradingAccounts: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    broker: true,
                    balance: true,
                    equity: true,
                    currency: true,
                    status: true,
                    platform: true,
                    accountNumber: true,
                    accountType: true,
                    server: true,
                    lastHeartbeat: true,
                    lastSync: true,
                    totalTrades: true,
                    syncSource: true,
                    ibAttribution: true,
                    ibAttributionSource: true,
                    ibAttributionAt: true,
                    ibAttributionBy: true,
                    createdAt: true,
                },
            },
            eaDownloads: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { product: { select: { name: true, type: true } } },
            },
            journalEntries: {
                take: 100,
                orderBy: { entryDate: "desc" },
                select: {
                    id: true,
                    symbol: true,
                    type: true,
                    entryPrice: true,
                    exitPrice: true,
                    stopLoss: true,
                    takeProfit: true,
                    lotSize: true,
                    pnl: true,
                    commission: true,
                    swap: true,
                    status: true,
                    entryDate: true,
                    exitDate: true,
                    notes: true,
                    images: true,
                    result: true,
                    strategy: true,
                    confidenceLevel: true,
                    emotionBefore: true,
                    emotionAfter: true,
                    notesPsychology: true,
                    mistakes: true,
                    createdAt: true,
                    account: {
                        select: {
                            id: true,
                            name: true,
                            broker: true,
                        },
                    },
                    tradePlan: {
                        select: {
                            id: true,
                            setupName: true,
                            status: true,
                        },
                    },
                    ruleChecks: {
                        select: {
                            id: true,
                            status: true,
                            tradingRule: {
                                select: {
                                    title: true,
                                },
                            },
                        },
                    },
                },
            },
            progress: {
                take: 5,
                orderBy: { completedAt: "desc" },
                include: {
                    lesson: {
                        select: {
                            title: true,
                            module: { select: { title: true } },
                        },
                    },
                },
            },
            comments: {
                take: 5,
                orderBy: { createdAt: "desc" },
                select: { id: true, content: true, createdAt: true },
            },
            EALicenses: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    broker: true,
                    accountNumber: true,
                    status: true,
                    startDate: true,
                    expiryDate: true,
                    createdAt: true,
                },
            },
            badges: {
                orderBy: { earnedAt: "desc" },
                include: { badge: true },
            },
            sessions: {
                take: 3,
                orderBy: { lastActive: "desc" },
                select: {
                    id: true,
                    device: true,
                    ip: true,
                    userAgent: true,
                    lastActive: true,
                    createdAt: true,
                },
            },
            vipRequests: {
                orderBy: { createdAt: "desc" },
            },
            proEntitlements: {
                where: { status: { not: "REVOKED" } },
                orderBy: { createdAt: "desc" },
                include: {
                    tradingAccount: {
                        select: {
                            id: true,
                            name: true,
                            accountNumber: true,
                        },
                    },
                },
            },
            ibLeads: {
                orderBy: { clickedAt: "desc" },
            },
            ibActivitySnapshots: {
                orderBy: { periodEnd: "desc" },
            },
            tradingReports: {
                orderBy: { periodEnd: "desc" },
            },
            tradePlans: {
                take: 100,
                orderBy: { plannedAt: "desc" },
                include: {
                    account: { select: { id: true, name: true, broker: true } },
                    journalEntry: {
                        select: {
                            id: true,
                            entryPrice: true,
                            exitPrice: true,
                            lotSize: true,
                            pnl: true,
                            commission: true,
                            swap: true,
                            status: true,
                            result: true,
                            entryDate: true,
                            exitDate: true,
                        },
                    },
                },
            },
            strategies: {
                orderBy: { createdAt: "desc" },
                include: {
                    _count: { select: { tradingRules: true } },
                },
            },
            tradingRules: {
                orderBy: { sortOrder: "asc" },
                include: {
                    strategy: { select: { id: true, name: true } },
                    account: { select: { id: true, name: true, broker: true } },
                    _count: { select: { checks: true } },
                },
            },
            traderGoals: {
                orderBy: { startsAt: "desc" },
                include: {
                    account: { select: { id: true, name: true, broker: true } },
                },
            },
            ruleChecks: {
                take: 50,
                orderBy: { checkedAt: "desc" },
                include: {
                    tradingRule: {
                        select: {
                            id: true,
                            title: true,
                            severity: true,
                            category: true,
                        },
                    },
                    journalEntry: {
                        select: {
                            id: true,
                            symbol: true,
                            type: true,
                            pnl: true,
                            commission: true,
                            swap: true,
                            entryDate: true,
                        },
                    },
                },
            },
            tradingDayNotes: {
                take: 50,
                orderBy: { date: "desc" },
            },
            insightSnapshots: {
                take: 30,
                orderBy: { createdAt: "desc" },
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
                    vipRequests: true,
                    proEntitlements: true,
                    ibLeads: true,
                    ibActivitySnapshots: true,
                    tradingReports: true,
                    tradePlans: true,
                    strategies: true,
                    tradingRules: true,
                    traderGoals: true,
                    tradingDayNotes: true,
                },
            },
        },
    });

    if (!user) return notFound();

    const lastSession = user.sessions[0];
    const lastActive = lastSession?.lastActive
        ? new Date(lastSession.lastActive)
        : null;
    const countryCode = normalizeCountryCode(user.profile?.country);

    const serializedUser = JSON.parse(JSON.stringify(user));
    const capital = computeCapitalBreakdown(user.tradingAccounts);
    const realAccounts = user.tradingAccounts.filter(isLiveCapitalAccount);
    const demoAccountCount = user.tradingAccounts.filter(
        isDemoTradingAccount
    ).length;
    const latestRealAccountSignal = realAccounts
        .flatMap((account) => [account.lastHeartbeat, account.lastSync])
        .filter((value): value is Date => value !== null)
        .sort((left, right) => right.getTime() - left.getTime())[0];
    const isSyncCurrent = latestRealAccountSignal
        ? Date.now() - latestRealAccountSignal.getTime() <= 24 * 60 * 60 * 1000
        : false;

    // Safe executive narrative summary calculation (Doc #4)
    let narrativeClassification: BehaviorClassification | null = null;
    try {
        const signals = await computeTraderSignals(user.id, { persist: false });
        narrativeClassification = classifyUser({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
            tradingAccounts: user.tradingAccounts,
            journalEntries: user.journalEntries,
            totalJournalCount: user._count.journalEntries,
            activeSignals: signals.map((s) => ({
                signalType: s.signalType,
                severity: s.severity,
                title: s.title,
                summary: s.summary,
            })),
        });
    } catch (err) {
        console.error("Failed to compute narrative classification for user detail:", err);
    }

    return (
        <div className="space-y-6 pb-20">
            <AdminPageHeader
                title={`User Detail - ${user.email || "No email"}`}
                description={`${user.name || "Unnamed User"} · Joined ${format(new Date(user.createdAt), "MMM d, yyyy")}`}
                backHref="/admin/users"
            />

            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925]">
                <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-white/10 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
                    <div className="flex min-w-0 items-center gap-3 p-4 sm:p-5 sm:border-r sm:border-gray-200 sm:dark:border-white/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <WalletCards size={19} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Real Accounts
                            </p>
                            <p className="mt-0.5 text-lg font-black text-gray-800 dark:text-white">
                                {realAccounts.length}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Demo excluded{demoAccountCount > 0 ? ` / ${demoAccountCount} demo` : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3 p-4 sm:p-5 xl:border-r xl:border-gray-200 xl:dark:border-white/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <CircleDollarSign size={19} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Total Real Balance
                            </p>
                            <p className="mt-0.5 truncate text-lg font-black text-gray-800 dark:text-white" title={formatCurrencyBreakdown(capital.byCurrency)}>
                                {formatCurrencyBreakdown(capital.byCurrency)}
                            </p>
                            <p className="text-[11px] text-gray-500">Real accounts only</p>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3 p-4 sm:border-r sm:border-gray-200 sm:p-5 sm:dark:border-white/10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            <CircleDollarSign size={19} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Total Real Equity
                            </p>
                            <p className="mt-0.5 truncate text-lg font-black text-gray-800 dark:text-white" title={formatCurrencyBreakdown(capital.equityByCurrency)}>
                                {formatCurrencyBreakdown(capital.equityByCurrency)}
                            </p>
                            <p className="text-[11px] text-gray-500">No currency conversion</p>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3 p-4 sm:p-5">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isSyncCurrent ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"}`}>
                            <RefreshCw size={19} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Real Account Sync
                            </p>
                            <p className="mt-0.5 text-sm font-black text-gray-800 dark:text-white">
                                {!latestRealAccountSignal
                                    ? "Never synced"
                                    : isSyncCurrent
                                      ? "Up to date"
                                      : "Sync overdue"}
                            </p>
                            <p className="truncate text-[11px] text-gray-500">
                                {latestRealAccountSignal
                                    ? `Last signal ${formatDistanceToNow(latestRealAccountSignal, { addSuffix: true })}`
                                    : "No sync signal from a real account"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]">
                <div className="min-w-0 space-y-6">
                    <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-white shadow-sm dark:bg-[#151925]">
                        <div className="h-28 bg-gradient-to-br from-emerald-100 via-teal-50 to-white dark:from-primary/20 dark:via-primary/5 dark:to-transparent" />

                        <div className="px-6 pb-5 text-center">
                            <Avatar className="mx-auto -mt-14 mb-4 h-28 w-28 border-[6px] border-white shadow-xl dark:border-[#151925]">
                                <AvatarImage
                                    src={user.image || undefined}
                                    alt={user.name || "User"}
                                />
                                <AvatarFallback className="bg-gradient-to-tr from-primary to-blue-500 text-white font-bold text-3xl">
                                    {user.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="mt-2 text-xl font-black text-gray-800 dark:text-white">
                                {user.name || "Unnamed User"}
                            </h2>
                            <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                                {user.profile?.username
                                    ? `@${user.profile.username}`
                                    : "No username set"}
                            </p>

                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    user.profile?.role === "ADMIN"
                                        ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                                        : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                }`}
                            >
                                <ShieldCheck size={14} />{" "}
                                {user.profile?.role || "USER"}
                            </span>
                            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm dark:bg-white/5 dark:text-gray-200">
                                {countryCode ? (
                                    <>
                                        <img
                                            src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${countryCode.toLowerCase()}.svg`}
                                            alt={getCountryName(countryCode)}
                                            className="h-4 w-6 shrink-0 rounded-lg object-cover shadow-sm"
                                        />
                                        <span>
                                            {getCountryName(countryCode)}
                                        </span>
                                        <span className="text-gray-400">
                                            {countryCode}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Globe
                                            size={13}
                                            className="text-gray-500"
                                        />
                                        <span>Unknown country</span>
                                        <span className="font-medium text-gray-400">
                                            No country captured yet
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50/70 p-4 dark:bg-[#1a1f2e] sm:px-6 sm:py-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <Mail
                                        size={15}
                                        className="text-gray-500 shrink-0"
                                    />
                                    <span className="font-medium text-gray-700 dark:text-white truncate text-xs">
                                        {user.email || "No email"}
                                    </span>
                                </div>
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <Clock
                                        size={15}
                                        className="text-gray-500 shrink-0"
                                    />
                                    <span className="font-medium text-gray-700 dark:text-white text-xs">
                                        {format(
                                            new Date(user.createdAt),
                                            "MMM d, yyyy"
                                        )}
                                    </span>
                                </div>
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <ShieldCheck
                                        size={15}
                                        className="text-gray-500 shrink-0"
                                    />
                                    <span className="font-medium text-gray-700 dark:text-white text-xs">
                                        Role: {user.profile?.role || "USER"}
                                    </span>
                                </div>
                                <div className="flex min-w-0 items-center gap-2.5 text-sm">
                                    <Activity
                                        size={15}
                                        className="text-gray-500 shrink-0"
                                    />
                                    <span className="font-medium text-gray-700 dark:text-white text-xs">
                                        {lastActive
                                            ? `Active ${formatDistanceToNow(lastActive, {
                                                  addSuffix: true,
                                              })}`
                                            : "Never active"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-white/10 px-6 py-2.5 bg-gray-50/40 dark:bg-white/[0.02] flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                User ID
                            </span>
                            <UserIdCopyBadge userId={user.id} />
                        </div>

                        <QuickActions
                            userId={user.id}
                            userEmail={user.email || ""}
                            userName={user.name || "User"}
                            currentRole={user.profile?.role || "USER"}
                        />
                    </div>

                    <AdminNotes
                        userId={user.id}
                        initialNotes={
                            (user.settings as Record<string, string>)
                                ?.adminNotes || ""
                        }
                    />
                </div>

                <div className="min-w-0">
                    <UserNarrativeSummary classification={narrativeClassification} />
                    <UserDetailTabsWrapper
                        overviewContent={
                            <UserOverviewTab user={serializedUser} />
                        }
                        journalContent={
                            <UserJournalTab
                                entries={serializedUser.journalEntries || []}
                                totalCount={user._count.journalEntries}
                            />
                        }
                        accountsContent={
                            <UserAccountsList
                                accounts={serializedUser.tradingAccounts || []}
                                userId={user.id}
                            />
                        }
                        tradePlansContent={
                            <UserTradePlansTab
                                plans={serializedUser.tradePlans || []}
                                strategies={serializedUser.strategies || []}
                            />
                        }
                        vipProContent={<UserVipProTab user={serializedUser} />}
                        licensesContent={
                            <UserLicensesList
                                licenses={serializedUser.EALicenses || []}
                            />
                        }
                        ibPerformanceContent={
                            <UserIbPerformanceTab user={serializedUser} />
                        }
                        rulesGoalsContent={
                            <UserRulesGoalsTab
                                rules={serializedUser.tradingRules || []}
                                goals={serializedUser.traderGoals || []}
                                ruleChecks={serializedUser.ruleChecks || []}
                            />
                        }
                        reportsNotesContent={
                            <UserReportsNotesTab
                                reports={serializedUser.tradingReports || []}
                                dayNotes={serializedUser.tradingDayNotes || []}
                                insights={serializedUser.insightSnapshots || []}
                            />
                        }
                        counts={{
                            journal: user._count.journalEntries,
                            accounts: user._count.tradingAccounts,
                            plans: (user._count.tradePlans || 0) + (user._count.strategies || 0),
                            vip: user._count.vipRequests + (serializedUser.proEntitlements?.length || 0),
                            licenses: user._count.EALicenses,
                            ib: user._count.ibLeads,
                            rules: (user._count.tradingRules || 0) + (user._count.traderGoals || 0),
                            reports: (user._count.tradingReports || 0) + (user._count.tradingDayNotes || 0),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
