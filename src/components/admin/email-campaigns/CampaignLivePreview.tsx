"use client";

import { useState } from "react";
import {
    Monitor,
    Smartphone,
    Mail,
    Send,
    Loader2,
    CheckCircle2,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";

interface CampaignLivePreviewProps {
    previewSubject: string;
    previewHtml: string;
    isLoadingPreview: boolean;
    testRecipient: string;
    onChangeTestRecipient: (val: string) => void;
    onSendTest: () => void;
    isSendingTest: boolean;
    eligibleCount: number;
    skippedCount: number;
    segmentLabel: string;
    isDispatching: boolean;
    onConfirmDispatch: () => void;
}

export function CampaignLivePreview({
    previewSubject,
    previewHtml,
    isLoadingPreview,
    testRecipient,
    onChangeTestRecipient,
    onSendTest,
    isSendingTest,
    eligibleCount,
    skippedCount,
    segmentLabel,
    isDispatching,
    onConfirmDispatch,
}: CampaignLivePreviewProps) {
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [confirmOpen, setConfirmOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
            {/* Top Preview Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-gray-50/70 dark:bg-[#151925]">
                <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Live Brand Preview (Sample: Alex Mercer)
                    </span>
                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate max-w-[320px]">
                        {previewSubject}
                    </p>
                </div>

                <div className="flex items-center p-0.5 bg-gray-200/70 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("desktop")}
                        aria-label="Desktop email preview"
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold ${
                            viewMode === "desktop"
                                ? "bg-white dark:bg-[#1E2028] text-amber-600 dark:text-gold shadow-xs"
                                : "text-gray-500"
                        }`}
                    >
                        <Monitor size={13} />
                        <span>Desktop</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("mobile")}
                        aria-label="Mobile email preview"
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold ${
                            viewMode === "mobile"
                                ? "bg-white dark:bg-[#1E2028] text-amber-600 dark:text-gold shadow-xs"
                                : "text-gray-500"
                        }`}
                    >
                        <Smartphone size={13} />
                        <span>Mobile</span>
                    </Button>
                </div>
            </div>

            {/* Iframe Canvas */}
            <div className="flex-1 min-h-[460px] bg-gray-100 dark:bg-[#0B0E14] p-3 sm:p-4 flex flex-col">
                <div
                    className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md flex-1 flex flex-col mx-auto transition-all duration-200 ${
                        viewMode === "desktop"
                            ? "w-full max-w-[640px]"
                            : "w-[375px] max-w-full"
                    }`}
                >
                    {isLoadingPreview ? (
                        <div className="flex-1 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <Loader2 size={18} className="animate-spin text-gold" />
                            <span>Updating preview...</span>
                        </div>
                    ) : (
                        <iframe
                            title="Marketing Campaign Preview"
                            srcDoc={previewHtml}
                            className="w-full flex-1 min-h-[430px] border-none bg-white"
                            sandbox="allow-same-origin"
                        />
                    )}
                </div>
            </div>

            {/* Test Send & Bulk Launch Bar */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-3 bg-white dark:bg-[#1E2028]">
                <div className="p-3 rounded-lg bg-gold/10 border border-gold/20 flex flex-col sm:flex-row sm:items-end gap-2.5">
                    <div className="flex-1">
                        <PremiumInput
                            id="test-recipient-email"
                            label="Send Test Copy First"
                            icon={Mail}
                            value={testRecipient}
                            onChange={(e) => onChangeTestRecipient(e.target.value)}
                            className="h-9 text-xs bg-white dark:bg-[#151925]"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onSendTest}
                        disabled={isSendingTest}
                        className="h-9 px-4 rounded-lg text-xs font-bold shrink-0"
                    >
                        {isSendingTest ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Send size={14} />
                        )}
                        <span>Send Test</span>
                    </Button>
                </div>

                {!confirmOpen ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                            <span>
                                Segment <strong>{segmentLabel}</strong>:{" "}
                                <strong className="font-mono tabular-nums text-gray-900 dark:text-white">
                                    {eligibleCount}
                                </strong>{" "}
                                opted-in
                                {skippedCount > 0
                                    ? ` (${skippedCount} unsubscribed skipped)`
                                    : ""}
                            </span>
                        </div>

                        <Button
                            type="button"
                            variant="primary"
                            disabled={isDispatching || eligibleCount === 0}
                            onClick={() => setConfirmOpen(true)}
                            className="h-10 px-5 rounded-lg bg-gold hover:bg-amber-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/20 whitespace-nowrap"
                        >
                            <Send size={15} />
                            <span className="font-mono tabular-nums">
                                Send Campaign ({eligibleCount})
                            </span>
                        </Button>
                    </div>
                ) : (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2 text-xs text-gray-800 dark:text-gray-200">
                            <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <span>
                                Confirm live dispatch to{" "}
                                <strong className="font-mono tabular-nums">
                                    {eligibleCount}
                                </strong>{" "}
                                recipients in <strong>{segmentLabel}</strong>?
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isDispatching}
                                onClick={() => setConfirmOpen(false)}
                                className="h-8 px-3 rounded-lg text-xs font-bold"
                            >
                                <span>Cancel</span>
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                isLoading={isDispatching}
                                onClick={() => {
                                    setConfirmOpen(false);
                                    onConfirmDispatch();
                                }}
                                className="h-8 px-4 rounded-lg bg-gold hover:bg-amber-600 text-white text-xs font-extrabold"
                            >
                                <span>Confirm & Dispatch</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
