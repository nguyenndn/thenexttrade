"use client";

import {
    CheckCircle2,
    XCircle,
    Eye,
    Send,
    FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EmailLabTemplateId } from "@/app/admin/email-lab/actions";

export interface TemplateCardInfo {
    id: EmailLabTemplateId | string;
    title: string;
    description: string;
    sourceFile: string;
    status: "active" | "supabase" | "needs_fix";
    statusLabel: string;
    category: "system" | "vip" | "reports" | "onboarding" | "ea_academy" | "auth";
}

interface EmailTemplateCardProps {
    template: TemplateCardInfo;
    isSending: boolean;
    isPreviewLoading: boolean;
    result?: {
        success: boolean;
        message: string;
        timestamp: string;
    };
    onPreview: (id: EmailLabTemplateId, title: string) => void;
    onSend: (id: EmailLabTemplateId) => void;
}

export function EmailTemplateCard({
    template,
    isSending,
    isPreviewLoading,
    result,
    onPreview,
    onSend,
}: EmailTemplateCardProps) {
    const renderStatusBadge = () => {
        switch (template.status) {
            case "active":
                return (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide border border-emerald-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {template.statusLabel}
                    </span>
                );
            case "supabase":
                return (
                    <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide border border-dashboard shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {template.statusLabel}
                    </span>
                );
            case "needs_fix":
                return (
                    <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide border border-red-500/20 shrink-0">
                        {template.statusLabel}
                    </span>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-[#1E2028] border border-dashboard rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-500/30 transition-colors duration-150 group">
            <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white leading-snug">
                        {template.title}
                    </h4>
                    {renderStatusBadge()}
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed min-h-[38px]">
                    {template.description}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-[#151925] px-2.5 py-1.5 rounded-lg border border-dashboard truncate">
                    <FileCode2 size={12} className="text-gold shrink-0" />
                    <span className="truncate">{template.sourceFile}</span>
                </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-dashboard space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="smd"
                        className="w-full text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                        isLoading={isPreviewLoading}
                        onClick={() =>
                            onPreview(
                                template.id as EmailLabTemplateId,
                                template.title
                            )
                        }
                    >
                        <Eye size={14} />
                        <span>Preview</span>
                    </Button>

                    <Button
                        type="button"
                        variant="primary"
                        size="smd"
                        className="w-full text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 bg-gold hover:bg-amber-600 text-white"
                        isLoading={isSending}
                        onClick={() =>
                            onSend(template.id as EmailLabTemplateId)
                        }
                    >
                        <Send size={13} />
                        <span>Send Test</span>
                    </Button>
                </div>

                {result && (
                    <div
                        className={`p-2.5 rounded-lg text-xs font-medium flex gap-2 items-start border ${
                            result.success
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        }`}
                    >
                        {result.success ? (
                            <CheckCircle2
                                size={14}
                                className="shrink-0 mt-0.5 text-emerald-500"
                            />
                        ) : (
                            <XCircle
                                size={14}
                                className="shrink-0 mt-0.5 text-red-500"
                            />
                        )}
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                            <p className="font-semibold truncate">
                                {result.message}
                            </p>
                            <span className="font-mono tabular-nums opacity-75 text-[10px] shrink-0">
                                {result.timestamp}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

