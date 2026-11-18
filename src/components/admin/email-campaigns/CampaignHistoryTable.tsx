"use client";

import { formatDistanceToNow } from "date-fns";
import { Copy, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CampaignHistoryEntry } from "@/app/admin/email-campaigns/actions";
import { SEGMENT_OPTIONS } from "./AudienceSegmentSelector";

interface CampaignHistoryTableProps {
    history: CampaignHistoryEntry[];
    onReuseCampaign: (entry: CampaignHistoryEntry) => void;
}

export function CampaignHistoryTable({
    history,
    onReuseCampaign,
}: CampaignHistoryTableProps) {
    const getSegmentLabel = (segId: string) =>
        SEGMENT_OPTIONS.find((s) => s.id === segId)?.label || segId;

    if (history.length === 0) {
        return (
            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center shadow-sm">
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gold/10 text-amber-600 dark:text-gold mb-4">
                    <Mail size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-white">
                    No Email Campaigns Dispatched Yet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                    Compose your first campaign, send a test email to your inbox, and launch a targeted broadcast to start tracking delivery metrics here.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider border-b border-gray-100 dark:border-white/5">
                        <tr>
                            <th className="px-5 py-3.5">Subject & Headline</th>
                            <th className="px-5 py-3.5">Segment</th>
                            <th className="px-5 py-3.5">Delivery Stats</th>
                            <th className="px-5 py-3.5">Dispatched</th>
                            <th className="px-5 py-3.5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {history.map((item) => (
                            <tr
                                key={item.id}
                                className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors"
                            >
                                <td className="px-5 py-4 max-w-[340px]">
                                    <div className="font-bold text-gray-800 dark:text-white truncate">
                                        {item.subject}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                        {item.heading}
                                    </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gold/10 text-amber-600 dark:text-gold border border-gold/20">
                                        {getSegmentLabel(item.segment)}
                                    </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 size={13} />
                                            {item.sentCount} sent
                                        </span>
                                        {item.failedCount > 0 && (
                                            <span className="inline-flex items-center gap-1 font-bold text-red-500">
                                                <AlertTriangle size={13} />
                                                {item.failedCount} failed
                                            </span>
                                        )}
                                        {item.skippedOptOutCount > 0 && (
                                            <span className="text-gray-400">
                                                {item.skippedOptOutCount} opt-out
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    <div className="font-semibold text-gray-700 dark:text-gray-200">
                                        {formatDistanceToNow(
                                            new Date(item.createdAtIso),
                                            { addSuffix: true }
                                        )}
                                    </div>
                                    <div className="text-[11px] text-gray-400">
                                        by {item.sentBy}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onReuseCampaign(item)}
                                        className="h-8 px-3 rounded-lg text-xs font-bold"
                                    >
                                        <Copy size={13} />
                                        <span>Reuse</span>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
