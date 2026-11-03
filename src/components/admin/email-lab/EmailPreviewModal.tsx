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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-6xl h-[95vh] max-h-[960px] flex flex-col bg-white dark:bg-[#0D111C] border border-dashboard rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard bg-gray-50/90 dark:bg-[#151925]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-amber-500/10 text-gold">
                            <Mail size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-gold dark:text-amber-400 border border-amber-500/20">
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
                        <div className="flex items-center p-1 bg-[#F1F3F5] dark:bg-[#1A1D27] rounded-lg border border-dashboard">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setViewMode("desktop")}
                                className={`h-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 ${
                                    viewMode === "desktop"
                                        ? "bg-gold hover:bg-gold text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-transparent"
                                }`}
                                aria-label="Desktop Preview"
                            >
                                <Monitor size={14} />
                                <span>Desktop</span>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setViewMode("mobile")}
                                className={`h-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 ${
                                    viewMode === "mobile"
                                        ? "bg-gold hover:bg-gold text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-transparent"
                                }`}
                                aria-label="Mobile Preview"
                            >
                                <Smartphone size={14} />
                                <span>Mobile</span>
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="rounded-lg h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            aria-label="Close Preview"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                {/* ── Modal Body: Isolated iframe viewport (Expanded & Height Guaranteed) ── */}
                <div className="flex-1 min-h-0 bg-gray-100 dark:bg-[#090D16] p-3 sm:p-5 flex items-stretch justify-center overflow-hidden">
                    <div
                        className={`transition-all duration-200 bg-white rounded-xl shadow-xl border border-dashboard overflow-hidden h-full flex flex-col mx-auto ${
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-dashboard bg-white dark:bg-[#151925]">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {allowCustomRecipient ? (
                            <div className="w-full sm:w-72">
                                <PremiumInput
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    aria-label="Test recipient email address"
                                    className="h-9 text-xs"
                                />
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Recipient: <span className="font-mono tabular-nums font-semibold text-gray-700 dark:text-gray-300">{recipient || "Default System Inbox"}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Button
                            variant="outline"
                            size="smd"
                            onClick={onClose}
                            className="rounded-lg font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="smd"
                            onClick={handleSendTest}
                            disabled={sending}
                            className="rounded-lg font-bold flex items-center gap-2"
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
