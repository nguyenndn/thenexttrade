"use client";

import { useState } from "react";
import {
    Mail,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Info,
    Eye,
    Send,
    Layers,
    Key,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import {
    sendEmailLabTest,
    renderEmailLabPreview,
    type EmailLabTemplateId,
} from "./actions";
import { EmailPreviewModal } from "@/components/admin/email-lab/EmailPreviewModal";

interface EmailLabClientProps {
    defaultRecipient: string;
    allowCustomRecipient: boolean;
}

interface TemplateCardInfo {
    id: EmailLabTemplateId | string;
    title: string;
    description: string;
    sourceFile: string;
    status: "active" | "supabase" | "needs_fix";
    statusLabel: string;
    category: "system" | "reports" | "onboarding" | "ea_academy" | "auth";
}

export function EmailLabClient({
    defaultRecipient,
    allowCustomRecipient,
}: EmailLabClientProps) {
    const [customTo, setCustomTo] = useState(defaultRecipient);
    const [sending, setSending] = useState<Record<string, boolean>>({});
    const [loadingPreview, setLoadingPreview] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<"all" | "reports" | "onboarding" | "ea_academy" | "auth">("all");
    const [results, setResults] = useState<
        Record<string, { success: boolean; message: string; timestamp: string }>
    >({});

    // Preview Modal State
    const [previewState, setPreviewState] = useState<{
        isOpen: boolean;
        templateId: string;
        title: string;
        subject: string;
        html: string;
    }>({
        isOpen: false,
        templateId: "",
        title: "",
        subject: "",
        html: "",
    });

    const handleSend = async (templateId: EmailLabTemplateId) => {
        setSending((prev) => ({ ...prev, [templateId]: true }));
        try {
            const res = await sendEmailLabTest({
                templateId,
                to: customTo || undefined,
            });
            setResults((prev) => ({
                ...prev,
                [templateId]: {
                    success: res.success,
                    message: res.message,
                    timestamp: new Date().toLocaleTimeString(),
                },
            }));
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        } catch (err: any) {
            const errorMsg = err?.message || "Failed to send email";
            setResults((prev) => ({
                ...prev,
                [templateId]: {
                    success: false,
                    message: errorMsg,
                    timestamp: new Date().toLocaleTimeString(),
                },
            }));
            toast.error(errorMsg);
        } finally {
            setSending((prev) => ({ ...prev, [templateId]: false }));
        }
    };

    const handlePreview = async (templateId: EmailLabTemplateId, title: string) => {
        setLoadingPreview((prev) => ({ ...prev, [templateId]: true }));
        try {
            const res = await renderEmailLabPreview({ templateId });
            if (res.success && res.html) {
                setPreviewState({
                    isOpen: true,
                    templateId,
                    title,
                    subject: res.subject || title,
                    html: res.html,
                });
            } else {
                toast.error(res.message || "Failed to render preview");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to render preview");
        } finally {
            setLoadingPreview((prev) => ({ ...prev, [templateId]: false }));
        }
    };

    const activeTemplates: TemplateCardInfo[] = [
        // ── System & Smoke ──
        {
            id: "smtp_smoke",
            title: "SMTP Smoke Test",
            description:
                "Sends a basic system validation email to verify credentials and SMTP relay host connectivity.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "system",
        },

        // ── EA & Academy Deliveries ──
        {
            id: "ea_license_delivery",
            title: "EA License & Download Delivery",
            description:
                "Sends the lifetime license key, MT5 account binding details, and instant EA download instructions.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "ea_academy",
        },
        {
            id: "ea_update_release",
            title: "EA Version Update Release Note",
            description:
                "Notifies existing EA license holders of a major algorithm upgrade, changelog highlights, and download links.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "ea_academy",
        },
        {
            id: "academy_certificate_issued",
            title: "Academy Graduation & Certificate",
            description:
                "Celebrates full 12-Level completion and issues a verifiable TheNextTrade Master Trader Certificate.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "ea_academy",
        },
        {
            id: "milestone_achievement",
            title: "Milestone Achievement (100 Trades)",
            description:
                "Celebrates disciplined trading milestones such as the 100-Trade Club with compliance badge.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "ea_academy",
        },



        // ── Streamlined 3-Step Onboarding Sequence ──
        {
            id: "welcome_d0_preview",
            title: "Onboarding D0: Welcome & Quickstart",
            description:
                "Sent immediately after registration. Welcomes trader and introduces 3 steps to unlock dashboard metrics.",
            sourceFile: "src/lib/emails/welcome-sequence.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "onboarding",
        },
        {
            id: "welcome_d1_preview",
            title: "Onboarding D1: MT5 Sync Guide (T+24h)",
            description:
                "Sent 24 hours after registration only if trader has not connected an MT4/MT5 account yet.",
            sourceFile: "src/lib/emails/welcome-sequence.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "onboarding",
        },
        {
            id: "welcome_d3_preview",
            title: "Onboarding D3: AI Coach & Academy Tour (T+72h)",
            description:
                "Sent 72 hours after registration if trader is still inactive. Highlights psychology tracker & AI Trade Score.",
            sourceFile: "src/lib/emails/welcome-sequence.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "onboarding",
        },
    ];

    const supabaseTemplates: TemplateCardInfo[] = [
        {
            id: "signup_otp",
            title: "Signup OTP / Verify Email",
            description:
                "Verification code or confirmation link sent during initial user registration.",
            sourceFile: "src/app/auth/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
            category: "auth",
        },
        {
            id: "resend_otp",
            title: "Resend Signup OTP",
            description: "Resent verification code for unconfirmed users.",
            sourceFile: "src/app/auth/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
            category: "auth",
        },
        {
            id: "magic_link",
            title: "Magic Link Login",
            description:
                "One-click authentication login email generating a temporary session token.",
            sourceFile: "src/app/auth/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
            category: "auth",
        },
        {
            id: "forgot_password",
            title: "Forgot Password Reset",
            description:
                "Email containing recovery token to allow user to reset their credentials.",
            sourceFile: "src/app/auth/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
            category: "auth",
        },
        {
            id: "admin_reset",
            title: "Admin Reset Password Link",
            description:
                "Admin panel trigger. Generates a password recovery link using Supabase Admin Auth API.",
            sourceFile: "src/app/admin/users/[id]/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
            category: "auth",
        },
    ];

    const getStatusBadge = (
        status: "active" | "supabase" | "needs_fix",
        label: string
    ) => {
        switch (status) {
            case "active":
                return (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border border-amber-500/20">
                        {label}
                    </span>
                );
            case "supabase":
                return (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border border-amber-500/20">
                        {label}
                    </span>
                );
            case "needs_fix":
                return (
                    <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border border-red-500/20">
                        {label}
                    </span>
                );
        }
    };

    const eaAcademyCount = activeTemplates.filter(
        (t) => t.category === "ea_academy" || t.category === "system"
    ).length;
    const reportsCount = activeTemplates.filter(
        (t) => t.category === "reports"
    ).length;
    const onboardingCount = activeTemplates.filter(
        (t) => t.category === "onboarding"
    ).length;
    const authCount = supabaseTemplates.length;
    const totalCount = activeTemplates.length + supabaseTemplates.length;

    const filteredActiveTemplates = activeTemplates.filter((t) => {
        if (activeTab === "all") return true;
        if (activeTab === "reports") return t.category === "reports";
        if (activeTab === "onboarding") return t.category === "onboarding";
        if (activeTab === "ea_academy") return t.category === "ea_academy" || t.category === "system";
        return true;
    });

    const shouldShowAuth = activeTab === "all" || activeTab === "auth";
    const shouldShowActive = activeTab !== "auth";

    return (
        <div className="space-y-6">
            {/* Header section with brand accent */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
                        <h1 className="text-2xl font-bold text-gray-700 dark:text-white tracking-tight">
                            Email Lab
                        </h1>
                    </div>
                    <p className="text-base text-gray-500 pl-4 font-medium">
                        Test, preview, and verify system-generated transactional HTML email templates.
                    </p>
                </div>
            </div>

            {/* Warning block */}
            <div className="bg-amber-500/[0.03] border border-amber-500/20 rounded-xl p-5 flex items-start gap-3.5">
                <ShieldAlert
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={20}
                />
                <div className="text-sm text-amber-600 dark:text-amber-500/90 space-y-1.5">
                    <p className="font-bold uppercase tracking-wider">
                        Internal Testing Environment Only
                    </p>
                    <p className="leading-relaxed">
                        Every active SMTP trigger will dispatch a real email
                        through the configured host server. Ensure you use local
                        sandbox environments (like Mailtrap) to prevent sending
                        mock data to production clients.
                    </p>
                </div>
            </div>

            {/* Recipient controller Card */}
            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
                    <Mail size={18} className="text-amber-500" />
                    Recipient Configuration
                </h3>
                <div className="max-w-xl">
                    <PremiumInput
                        label="Default Test Recipient Address"
                        icon={Mail}
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        disabled={!allowCustomRecipient}
                        placeholder="test@example.com"
                        className="text-sm"
                    />
                    {!allowCustomRecipient ? (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-medium">
                            <Info size={14} className="text-amber-500" />
                            Custom recipient is locked by environment config.
                            Sending only to default:{" "}
                            <code className="text-gray-700 dark:text-gray-300 font-bold bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-lg text-xs">
                                {defaultRecipient}
                            </code>
                            .
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-medium">
                            <Info size={14} className="text-amber-500" />
                            Custom recipient is enabled. You can direct emails to your custom sandbox inbox.
                        </p>
                    )}
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
                <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "all"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                >
                    <Layers size={14} />
                    <span>All Templates ({totalCount})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("ea_academy")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "ea_academy"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                >
                    <Key size={14} />
                    <span>EA & Systems ({eaAcademyCount})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("onboarding")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "onboarding"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                >
                    <Sparkles size={14} />
                    <span>Onboarding & Activation ({onboardingCount})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("auth")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "auth"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                >
                    <ShieldCheck size={14} />
                    <span>Supabase Auth ({authCount})</span>
                </button>
            </div>

            {/* Group 1: SMTP and System Generated Emails */}
            {shouldShowActive && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-white/10 pb-2 flex items-center justify-between">
                        <span>App-Owned Transactional Templates (SMTP)</span>
                        <span className="text-xs font-medium text-gray-400">
                            {filteredActiveTemplates.length} templates
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredActiveTemplates.map((template) => {
                            const loading = sending[template.id] || false;
                            const isPreviewLoading = loadingPreview[template.id] || false;
                            const res = results[template.id];

                            return (
                                <div
                                    key={template.id}
                                    className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="text-base font-bold text-gray-700 dark:text-white leading-tight">
                                                {template.title}
                                            </h4>
                                            {getStatusBadge(
                                                template.status,
                                                template.statusLabel
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed min-h-[48px]">
                                            {template.description}
                                        </p>
                                        <div className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-white/[0.02] p-2 rounded-lg truncate">
                                            {template.sourceFile}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                className="w-full text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5"
                                                isLoading={isPreviewLoading}
                                                onClick={() =>
                                                    handlePreview(
                                                        template.id as EmailLabTemplateId,
                                                        template.title
                                                    )
                                                }
                                            >
                                                <Eye size={14} />
                                                Live Preview
                                            </Button>

                                            <Button
                                                className="w-full text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-amber-500/20"
                                                isLoading={loading}
                                                onClick={() =>
                                                    handleSend(
                                                        template.id as EmailLabTemplateId
                                                    )
                                                }
                                            >
                                                <Send size={14} />
                                                Send Test
                                            </Button>
                                        </div>

                                        {res && (
                                            <div
                                                className={`p-2.5 rounded-xl text-xs font-medium flex gap-1.5 items-start ${res.success
                                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                                    }`}
                                            >
                                                {res.success ? (
                                                    <CheckCircle
                                                        size={15}
                                                        className="shrink-0 mt-0.5 text-amber-500"
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={15}
                                                        className="shrink-0 mt-0.5 text-red-500"
                                                    />
                                                )}
                                                <div className="space-y-0.5 leading-snug">
                                                    <p className="font-semibold">
                                                        {res.message}
                                                    </p>
                                                    <p className="opacity-60 text-[10px]">
                                                        {res.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Group 2: Supabase Auth Emails */}
            {shouldShowAuth && (
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-white/10 pb-2 flex items-center justify-between">
                        <span>Supabase Authentication Flows (Auth Hook)</span>
                        <span className="text-xs font-medium text-gray-400">
                            {supabaseTemplates.length} templates
                        </span>
                    </h2>
                    <div className="bg-amber-500/[0.02] border border-amber-500/15 rounded-xl p-5 flex items-start gap-3.5">
                        <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                            Auth emails are managed and dispatched directly by the{" "}
                            <strong>Supabase Auth microservice</strong>. In local
                            development or staging, configure Supabase Custom SMTP
                            settings to redirect auth emails to Mailtrap, or trigger
                            them manually from the login forms.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {supabaseTemplates.map((template) => {
                            const loading = sending[template.id] || false;
                            const isPreviewLoading = loadingPreview[template.id] || false;
                            const res = results[template.id];

                            return (
                                <div
                                    key={template.id}
                                    className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="text-base font-bold text-gray-700 dark:text-white leading-tight">
                                                {template.title}
                                            </h4>
                                            {getStatusBadge(
                                                template.status,
                                                template.statusLabel
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed min-h-[48px]">
                                            {template.description}
                                        </p>
                                        <div className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-white/[0.02] p-2 rounded-lg truncate">
                                            {template.sourceFile}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                className="w-full text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5"
                                                isLoading={isPreviewLoading}
                                                onClick={() =>
                                                    handlePreview(
                                                        template.id as EmailLabTemplateId,
                                                        template.title
                                                    )
                                                }
                                            >
                                                <Eye size={14} />
                                                Live Preview
                                            </Button>

                                            <Button
                                                className="w-full text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-amber-500/20"
                                                isLoading={loading}
                                                onClick={() =>
                                                    handleSend(
                                                        template.id as EmailLabTemplateId
                                                    )
                                                }
                                            >
                                                <Send size={14} />
                                                Send Test
                                            </Button>
                                        </div>

                                        {res && (
                                            <div
                                                className={`p-2.5 rounded-xl text-xs font-medium flex gap-1.5 items-start ${res.success
                                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                                    }`}
                                            >
                                                {res.success ? (
                                                    <CheckCircle
                                                        size={15}
                                                        className="shrink-0 mt-0.5 text-amber-500"
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={15}
                                                        className="shrink-0 mt-0.5 text-red-500"
                                                    />
                                                )}
                                                <div className="space-y-0.5 leading-snug">
                                                    <p className="font-semibold">
                                                        {res.message}
                                                    </p>
                                                    <p className="opacity-60 text-[10px]">
                                                        {res.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Live HTML Preview Modal ── */}
            <EmailPreviewModal
                isOpen={previewState.isOpen}
                onClose={() => setPreviewState((prev) => ({ ...prev, isOpen: false }))}
                templateId={previewState.templateId}
                title={previewState.title}
                subject={previewState.subject}
                html={previewState.html}
                defaultRecipient={customTo || defaultRecipient}
                allowCustomRecipient={allowCustomRecipient}
                onSendSuccess={() => {
                    setResults((prev) => ({
                        ...prev,
                        [previewState.templateId]: {
                            success: true,
                            message: `Sent test email to ${customTo || defaultRecipient}`,
                            timestamp: new Date().toLocaleTimeString(),
                        },
                    }));
                }}
            />
        </div>
    );
}
