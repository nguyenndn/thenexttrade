import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Mail, Clock, ShieldCheck, Award, LineChart,
  Key, Globe
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { QuickActions } from "./QuickActions";
import { getCountryName, normalizeCountryCode } from "@/lib/country-utils";
import { UserVipProTab } from "./UserVipProTab";
import { UserIbPerformanceTab } from "./UserIbPerformanceTab";
import { UserOverviewTab } from "./UserOverviewTab";
import { UserDetailTabsWrapper } from "./UserDetailTabsWrapper";

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
      EALicenses: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, broker: true, accountNumber: true, status: true, startDate: true, expiryDate: true, createdAt: true }
      },
      badges: {
        orderBy: { earnedAt: 'desc' },
        include: { badge: true }
      },
      sessions: {
        take: 3,
        orderBy: { lastActive: 'desc' },
        select: { id: true, device: true, ip: true, userAgent: true, lastActive: true, createdAt: true }
      },
      vipRequests: {
        orderBy: { createdAt: 'desc' }
      },
      proEntitlements: {
        orderBy: { createdAt: 'desc' },
        include: {
          tradingAccount: {
            select: {
              name: true,
              accountNumber: true
            }
          }
        }
      },
      ibLeads: {
        orderBy: { clickedAt: 'desc' }
      },
      ibActivitySnapshots: {
        orderBy: { periodEnd: 'desc' }
      },
      tradingReports: {
        orderBy: { periodEnd: 'desc' }
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
          tradingReports: true
        }
      }
    }
  });

  if (!user) return notFound();

  const lastSession = user.sessions[0];
  const lastActive = lastSession?.lastActive ? new Date(lastSession.lastActive) : null;
  const countryCode = normalizeCountryCode(user.profile?.country);

  const licenseStatusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    EXPIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-500',
    SUSPENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  };

  const serializedUser = JSON.parse(JSON.stringify(user));

  return (
    <div className="space-y-6 pb-20">
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
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white shadow-sm dark:bg-[#151925]">
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
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 px-3 py-1 text-xs font-bold text-gray-700 shadow-sm dark:bg-white/5 dark:text-gray-200">
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

            <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50/70 p-4 dark:bg-[#1a1f2e] sm:px-6 sm:py-4">
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

            <QuickActions userId={user.id} userEmail={user.email || ""} userName={user.name || "User"} currentRole={user.profile?.role || "USER"} />
          </div>

          <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-700 dark:text-white">Trading Accounts</h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                {user._count.tradingAccounts} Total
              </span>
            </div>
            {user.tradingAccounts.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-white/10">
                {user.tradingAccounts.slice(0, 5).map(acc => (
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

          <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-700 dark:text-white flex items-center gap-2">
                <Key size={18} className="text-gray-500" /> EA Licenses
              </h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                {user._count.EALicenses} Total
              </span>
            </div>
            {user.EALicenses.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-white/10">
                {user.EALicenses.slice(0, 5).map(lic => (
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

        <div className="min-w-0">
          <UserDetailTabsWrapper
            overviewContent={<UserOverviewTab user={serializedUser} />}
            vipProContent={<UserVipProTab user={serializedUser} />}
            ibPerformanceContent={<UserIbPerformanceTab user={serializedUser} />}
          />
        </div>
      </div>
    </div>
  );
}
