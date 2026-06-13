import Link from "next/link";
import { cn } from "@/lib/utils";

interface ReportRankedListItem {
 label: string;
 sublabel?: string;
 value: number | string;
 percent?: number;
 href?: string;
 tone?: "default" | "good" | "warning" | "danger";
}

interface ReportRankedListProps {
 items: ReportRankedListItem[];
 title?: string;
 emptyMessage?: string;
}

const toneBarColors = {
 default: "bg-primary/60",
 good: "bg-emerald-500",
 warning: "bg-amber-500",
 danger: "bg-red-500",
};

export function ReportRankedList({ items, title, emptyMessage = "No data available." }: ReportRankedListProps) {
 if (items.length === 0) {
 return (
 <div className="text-center py-6 text-sm text-gray-400">{emptyMessage}</div>
 );
 }

 const maxPercent = Math.max(...items.map((i) => i.percent ?? 0), 1);

 return (
 <div>
 {title && <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{title}</h3>}
 <div className="space-y-2">
 {items.map((item, idx) => {
 const barWidth = item.percent ? (item.percent / maxPercent) * 100 : 0;
 const tone = item.tone ?? "default";

 const row = (
 <div
 key={idx}
 className={cn(
 "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
 item.href ? "hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" : ""
 )}
 >
 <span className="text-xs font-bold text-gray-400 w-5 text-right tabular-nums">
 {idx + 1}
 </span>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-gray-700 dark:text-white truncate">{item.label}</p>
 {item.sublabel && (
 <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
 )}
 {barWidth > 0 && (
 <div className="mt-1 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
 <div
 className={cn("h-full rounded-full transition-all", toneBarColors[tone])}
 style={{ width: `${barWidth}%` }}
 />
 </div>
 )}
 </div>
 <span className="text-sm font-bold text-gray-700 dark:text-white tabular-nums shrink-0">
 {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
 </span>
 {item.percent !== undefined && (
 <span className="text-xs text-gray-400 tabular-nums w-10 text-right">{item.percent}%</span>
 )}
 </div>
 );

 return item.href ? <Link key={idx} href={item.href}>{row}</Link> : row;
 })}
 </div>
 </div>
 );
}
