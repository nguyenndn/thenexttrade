"use client";

import {
    Users,
    Sparkles,
    Crown,
    Activity,
    UserPlus,
    AtSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    type AudienceCountsMap,
    type CampaignSegmentId,
    parseCustomRecipientList,
} from "@/lib/emails/marketing-campaign-shared";

interface AudienceSegmentSelectorProps {
    selectedSegment: CampaignSegmentId;
    onSelectSegment: (segment: CampaignSegmentId) => void;
    counts: AudienceCountsMap;
    customEmailsRaw: string;
    onChangeCustomEmails: (value: string) => void;
}

interface SegmentMeta {
    id: CampaignSegmentId;
    label: string;
    description: string;
    icon: LucideIcon;
}

export const SEGMENT_OPTIONS: readonly SegmentMeta[] = [
    {
        id: "ALL_USERS",
        label: "All Subscribed Users",
        description: "Every registered trader opted in to updates",
        icon: Users,
    },
    {
        id: "FREE_TRIAL",
        label: "Free & Trial Users",
        description: "Users without active Pro entitlement",
        icon: Sparkles,
    },
    {
        id: "VIP_PRO",
        label: "VIP / Pro Members",
        description: "Users with active Pro membership",
        icon: Crown,
    },
    {
        id: "HAS_MT5",
        label: "Connected MT5",
        description: "Traders with at least 1 synced MT5 account",
        icon: Activity,
    },
    {
        id: "NO_MT5",
        label: "No MT5 Connected",
        description: "Signed up but 0 MT5 accounts (Activation)",
        icon: UserPlus,
    },
    {
        id: "CUSTOM_LIST",
        label: "Custom Email List",
        description: "Paste comma or line-separated addresses",
        icon: AtSign,
    },
];

export function AudienceSegmentSelector({
    selectedSegment,
    onSelectSegment,
    counts,
    customEmailsRaw,
    onChangeCustomEmails,
}: AudienceSegmentSelectorProps) {
    const customParsed = parseCustomRecipientList(customEmailsRaw);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    1. Target Audience Segment
                </label>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    Auto-respects marketing opt-out
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SEGMENT_OPTIONS.map((seg) => {
                    const Icon = seg.icon;
                    const isSelected = selectedSegment === seg.id;
                    const stat =
                        seg.id !== "CUSTOM_LIST" ? counts[seg.id] : null;
                    const badgeCount =
                        seg.id === "CUSTOM_LIST"
                            ? customParsed.validEmails.length
                            : stat?.optedIn ?? 0;

                    return (
                        <div
                            key={seg.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectSegment(seg.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onSelectSegment(seg.id);
                                }
                            }}
                            className={`p-3 rounded-lg border transition-colors flex items-start justify-between gap-2 ${
                                isSelected
                                    ? "border-gold/60 bg-gold/10 dark:bg-amber-500/15"
                                    : "border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20"
                            }`}
                        >
                            <div className="flex items-start gap-2.5 min-w-0">
                                <Icon
                                    size={15}
                                    className={`mt-0.5 shrink-0 ${
                                        isSelected
                                            ? "text-amber-600 dark:text-gold"
                                            : "text-gray-400"
                                    }`}
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                        {seg.label}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                                        {seg.description}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono tabular-nums font-bold shrink-0 ${
                                    isSelected
                                        ? "bg-gold text-white"
                                        : "bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                                }`}
                            >
                                {badgeCount}
                            </span>
                        </div>
                    );
                })}
            </div>

            {selectedSegment === "CUSTOM_LIST" && (
                <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="custom-emails-input"
                            className="text-xs font-bold uppercase tracking-wider text-gray-500"
                        >
                            Recipient Email Addresses
                        </label>
                        <span className="text-[11px] font-mono tabular-nums text-gray-500">
                            {customParsed.validEmails.length} valid
                            {customParsed.invalidEntries.length > 0
                                ? ` · ${customParsed.invalidEntries.length} invalid`
                                : ""}
                        </span>
                    </div>
                    <textarea
                        id="custom-emails-input"
                        rows={3}
                        value={customEmailsRaw}
                        onChange={(e) => onChangeCustomEmails(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#151925] border border-dashboard dark:border-white/10 text-xs font-mono text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Separate addresses by newline, comma, or semicolon. Duplicates are removed automatically.
                    </p>
                </div>
            )}
        </div>
    );
}
