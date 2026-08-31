"use client";

import { useState } from "react";
import {
    Monitor,
    Smartphone,
    Send,
    X,
    Loader2,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { sendEmailLabTest, type EmailLabTemplateId } from "@/app/admin/email-lab/actions";

interface EmailPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: EmailLabTemplateId | string;
    title: string;
    subject: string;
    html: string;
    defaultRecipient: string;
    allowCustomRecipient: boolean;
    onSendSuccess?: () => void;
}

export function EmailPreviewModal({
    isOpen,
    onClose,
    templateId,
    title,
    subject,
    html,
    defaultRecipient,
    allowCustomRecipient,
    onSendSuccess,
}: EmailPreviewModalProps) {
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
    const [recipient, setRecipient] = useState(defaultRecipient);
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    const handleSendTest = async () => {
        setSending(true);
        try {
            const res = await sendEmailLabTest({
                templateId: templateId as EmailLabTemplateId,
                to: recipient || undefined,
            });

            if (res.success) {
                toast.success(res.message);
                onSendSuccess?.();
            } else {
                toast.error(res.message);
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to send test email");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-6xl h-[95vh] max-h-[960px] flex flex-col bg-white dark:bg-[#121624] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/75 dark:bg-[#181E32]/75">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                            <Mail size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    HTML Preview
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-md sm:max-w-xl">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Subject:</span> {subject}
                            </p>
                        </div>
                    </div>

                    {/* Controls & Close */}
                    <div className="flex items-center gap-3">
                        {/* Device Viewport Toggle */}
                        <div className="flex items-center p-1 bg-gray-200/70 dark:bg-white/5 rounded-xl border border-gray-300/60 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setViewMode("desktop")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    viewMode === "desktop"
                                        ? "bg-white dark:bg-[#0C0F1B] text-amber-500 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                                aria-label="Desktop Preview"
                            >
                                <Monitor size={14} />
                                <span>Desktop</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("mobile")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    viewMode === "mobile"
                                        ? "bg-white dark:bg-[#0C0F1B] text-amber-500 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                                aria-label="Mobile Preview"
                            >
                                <Smartphone size={14} />
                                <span>Mobile</span>
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="rounded-xl h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            aria-label="Close Preview"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                {/* ── Modal Body: Isolated iframe viewport (Expanded & Height Guaranteed) ── */}
                <div className="flex-1 min-h-0 bg-gray-100 dark:bg-[#080B14] p-3 sm:p-5 flex items-stretch justify-center overflow-hidden">
                    <div
                        className={`transition-all duration-300 bg-white rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden h-full flex flex-col mx-auto ${
                            viewMode === "desktop"
                                ? "w-full max-w-[740px]"
                                : "w-[390px] max-w-full"
                        }`}
                    >
                        <iframe
                            title={`Email Preview - ${title}`}
                            srcDoc={html}
                            className="w-full h-full flex-1 border-none bg-white"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>

                {/* ── Modal Footer: Test Send Action ── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#121624]">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {allowCustomRecipient ? (
                            <div className="w-full sm:w-72">
                                <PremiumInput
                                    placeholder="Enter test recipient..."
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Recipient: <span className="font-semibold text-gray-700 dark:text-gray-300">{recipient || "Default System Inbox"}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl h-9 text-xs font-semibold"
                        >
                            Close Preview
                        </Button>
                        <Button
                            onClick={handleSendTest}
                            disabled={sending}
                            className="rounded-xl h-9 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-2 shadow-sm shadow-amber-500/20"
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={14} />
                                    <span>Send Live Test</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
