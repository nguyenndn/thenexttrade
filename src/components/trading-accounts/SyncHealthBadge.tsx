"use client";

import { Wifi, WifiOff, AlertCircle, Clock, CheckCircle2, HelpCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SyncHealth, SyncHealthStatus } from "@/lib/sync-health";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface SyncHealthBadgeProps {
 health: SyncHealth;
 compact?: boolean;
}

const STATUS_CONFIG: Record<SyncHealthStatus, {
 icon: React.ElementType;
 color: string;
 bgColor: string;
 borderColor: string;
 dotColor: string;
}> = {
 healthy: {
 icon: CheckCircle2,
 color: "text-emerald-500",
 bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
 borderColor: "border-emerald-100 dark:border-emerald-500/20",
 dotColor: "bg-emerald-500",
 },
 no_trades_yet: {
 icon: Radio,
 color: "text-blue-500",
 bgColor: "bg-blue-50 dark:bg-blue-500/10",
 borderColor: "border-blue-100 dark:border-blue-500/20",
 dotColor: "bg-blue-500",
 },
 stale: {
 icon: Clock,
 color: "text-amber-500",
 bgColor: "bg-amber-50 dark:bg-amber-500/10",
 borderColor: "border-amber-100 dark:border-amber-500/20",
 dotColor: "bg-amber-500",
 },
 disconnected: {
 icon: WifiOff,
 color: "text-red-500",
 bgColor: "bg-red-50 dark:bg-red-500/10",
 borderColor: "border-red-100 dark:border-red-500/20",
 dotColor: "bg-red-500",
 },
 missing_trade_data: {
 icon: AlertCircle,
 color: "text-orange-500",
 bgColor: "bg-orange-50 dark:bg-orange-500/10",
 borderColor: "border-orange-100 dark:border-orange-500/20",
 dotColor: "bg-orange-500",
 },
 sync_error: {
 icon: AlertCircle,
 color: "text-red-500",
 bgColor: "bg-red-50 dark:bg-red-500/10",
 borderColor: "border-red-100 dark:border-red-500/20",
 dotColor: "bg-red-500",
 },
 unsupported: {
 icon: HelpCircle,
 color: "text-gray-400",
 bgColor: "bg-gray-50 dark:bg-gray-500/10",
 borderColor: "border-dashboard dark:border-gray-500/20",
 dotColor: "bg-gray-400",
 },
};

const SOURCE_LABELS: Record<string, string> = {
 TNT_CONNECT: "TNT Connect",
 EA: "EA Sync",
 MANUAL: "Manual",
 UNKNOWN: "Unknown",
};

function timeAgo(dateStr: string | null): string {
 if (!dateStr) return "Never";
 const diff = Date.now() - new Date(dateStr).getTime();
 const minutes = Math.floor(diff / 60000);
 if (minutes < 1) return "Just now";
 if (minutes < 60) return `${minutes}m ago`;
 const hours = Math.floor(minutes / 60);
 if (hours < 24) return `${hours}h ago`;
 const days = Math.floor(hours / 24);
 return `${days}d ago`;
}

export function SyncHealthBadge({ health, compact = false }: SyncHealthBadgeProps) {
 const config = STATUS_CONFIG[health.status];
 const Icon = config.icon;

 if (compact) {
 return (
 <div className={cn(
 "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
 config.bgColor, config.borderColor, config.color
 )}>
 <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor,
 health.status === "healthy" && "animate-pulse"
 )} />
 {health.label}
 </div>
 );
 }

 return (
 <div className={cn(
 "flex items-center gap-3 p-3 rounded-xl border transition-colors",
 config.bgColor, config.borderColor
 )}>
 {/* Status icon */}
 <div className={cn(
 "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
 health.status === "healthy" ? "bg-emerald-500/20" :
 health.status === "disconnected" ? "bg-red-500/20" :
 health.status === "stale" ? "bg-amber-500/20" :
 "bg-gray-500/10"
 )}>
 <Icon size={16} className={config.color} />
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className={cn("text-xs font-bold", config.color)}>
 {health.label}
 </span>
 <span className="text-[10px] text-gray-500 font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 rounded">
 {SOURCE_LABELS[health.source]}
 </span>
 </div>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight truncate">
 {health.description}
 </p>
 </div>

 {/* Last sync time */}
 {health.lastSyncAt && (
 <div className="text-[10px] text-gray-400 font-mono shrink-0 hidden sm:block">
 {timeAgo(health.lastSyncAt)}
 </div>
 )}

 {/* Primary action */}
 {health.primaryAction.href ? (
 <Link href={health.primaryAction.href}>
 <Button
 variant="outline"
 className={cn(
 "h-8 px-3 rounded-lg text-xs font-bold shrink-0 transition-all",
 health.status === "no_trades_yet" && "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white",
 health.status === "disconnected" && "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white",
 )}
 >
 {health.primaryAction.label}
 </Button>
 </Link>
 ) : (
 <Button
 variant="outline"
 className={cn(
 "h-8 px-3 rounded-lg text-xs font-bold shrink-0 transition-all",
 health.status === "no_trades_yet" && "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white",
 health.status === "disconnected" && "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white",
 )}
 >
 {health.primaryAction.label}
 </Button>
 )}
 </div>
 );
}
