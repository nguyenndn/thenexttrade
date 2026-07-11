import {
  GraduationCap, LineChart, FileText, Download, Monitor, Trophy
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { AdminNotes } from "./AdminNotes";

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
      status: string;
      platform: string;
      accountNumber: string | null;
      accountType: string | null;
      server: string | null;
      createdAt: Date | string;
    }>;
    eaDownloads: Array<{
      id: string;
      createdAt: Date | string;
      version: string;
      platform: string;
      product: { name: string; type: string } | null;
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
    badges: Array<{
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
      badges: number;
      sessions: number;
      journalEntries: number;
    };
  };
}

export function UserOverviewTab({ user }: UserOverviewTabProps) {
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
    <div className="space-y-6">
        <div className="space-y-6">
          {/* Activity Overview — Compact inline stats */}
          <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 overflow-hidden">
            <h3 className="text-base font-bold text-gray-700 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
              Activity Overview
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: GraduationCap, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20", label: "Academy", values: [`${user._count.progress} Lessons`, `${user._count.quizAttempts} Quizzes`] },
                { icon: LineChart, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-500/20", label: "Trading", values: [`${user._count.tradingAccounts} Accounts`, `${user._count.journalEntries} Trades`] },
                { icon: FileText, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/20", label: "Engagement", values: [`${user._count.comments} Comments`, `${user.streak} Day Streak`] },
                { icon: Download, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20", label: "Products", values: [`${user._count.eaDownloads} Downloads`, `${user._count.EALicenses} Licenses`] },
              ].map(stat => (
                <div key={stat.label} className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 p-3 text-center dark:bg-white/5">
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
              <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
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
                    <div key={ub.id} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/30 transition-colors group" title={ub.badge.description || ""}>
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
            <h3 className="text-base font-bold text-gray-700 dark:text-white border-b border-gray-200 dark:border-white/10 pb-3 mb-4">
              Recent Activity Timeline
            </h3>
            {timelineEvents.length > 0 ? (
              <div className="max-h-[290px] overflow-y-auto pr-1">
                <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-4 space-y-5 pl-5">
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
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                  <Monitor size={16} className="text-gray-500" /> Recent Sessions
                </h3>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {user._count.sessions}
                </span>
              </div>
              {user.sessions.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-white/10">
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
  );
}
