"use client";

import { Mail, Inbox, CheckCircle2, Archive } from "lucide-react";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import type { AdminMessagesStats } from "@/actions/admin/messages";

interface MessagesStatsGridProps {
  stats: AdminMessagesStats;
}

export function MessagesStatsGrid({ stats }: MessagesStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AnimatedStatCard
        title="Total Inquiries"
        value={stats.total}
        trendPercent={null}
        icon={Mail}
        color="blue"
        index={0}
      />
      <AnimatedStatCard
        title="New & Unread"
        value={stats.newCount}
        trendPercent={null}
        icon={Inbox}
        color="amber"
        index={1}
      />
      <AnimatedStatCard
        title="Replied"
        value={stats.repliedCount}
        trendPercent={null}
        icon={CheckCircle2}
        color="emerald"
        index={2}
      />
      <AnimatedStatCard
        title="Archived"
        value={stats.archivedCount}
        trendPercent={null}
        icon={Archive}
        color="cyan"
        index={3}
      />
    </div>
  );
}
