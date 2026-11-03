"use client";

import { useState } from "react";
import {
    Mail,
    ShieldAlert,
    Info,
    Layers,
    Key,
    Sparkles,
    ShieldCheck,
    Crown,
    BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    sendEmailLabTest,
    renderEmailLabPreview,
    type EmailLabTemplateId,
} from "./actions";
import { EmailPreviewModal } from "@/components/admin/email-lab/EmailPreviewModal";
import {
    EmailTemplateCard,
    type TemplateCardInfo,
} from "@/components/admin/email-lab/EmailTemplateCard";

interface EmailLabClientProps {
    defaultRecipient: string;
    allowCustomRecipient: boolean;
}

export function EmailLabClient({
    defaultRecipient,
    allowCustomRecipient,
}: EmailLabClientProps) {
    const [customTo, setCustomTo] = useState(defaultRecipient);
    const [sending, setSending] = useState<Record<string, boolean>>({});
    const [loadingPreview, setLoadingPreview] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<"all" | "vip" | "reports" | "onboarding" | "ea_academy" | "auth">("all");
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

        // ── VIP & Retention Lifecycle ──
        {
            id: "vip_trial_ending_soon",
            title: "VIP Trial Ending Soon (Day 6)",
            description:
                "Sent 24h before trial expires. Encourages connecting a funded MT5 account ($200+) on partner broker to keep Pro free.",
            sourceFile: "src/lib/services/vip-email-templates.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "vip",
        },
        {
            id: "vip_trial_ended",
            title: "VIP Trial Expired (Day 7+)",
            description:
                "Sent when trial expires. Explains transition to Free tier & zero-cost Pro restore upon connecting funded account.",
            sourceFile: "src/lib/services/vip-email-templates.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "vip",
        },
        {
            id: "vip_inactivity_warning",
            title: "VIP Inactivity Warning (Day 8)",
            description:
                "Sent on day 8 without trades. Reminds trader that 14 days of inactivity will pause VIP Pro status.",
            sourceFile: "src/lib/services/vip-email-templates.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "vip",
        },
        {
            id: "vip_policy_paused",
            title: "VIP Policy Paused (>14d / Under-Volume)",
            description:
                "Sent when VIP is paused. Reassures data is safe and highlights 0s auto-restore upon reaching 2.0 lots in 30 days.",
            sourceFile: "src/lib/services/vip-email-templates.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "vip",
        },
        {
            id: "vip_funding_grace",
            title: "VIP Funding Grace (Balance < $200)",
            description:
                "Sent when 30-day periodic recheck finds balance below $200. Starts 7-day grace period to top up to $200.",
            sourceFile: "src/lib/services/vip-email-templates.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "vip",
        },
        {
            id: "vip_support_sync_success",
            title: "Support-Sync Batch Success (Saturday)",
            description:
                "Sent after Saturday concierge batch when Support successfully syncs closed trades to trader's journal.",
            sourceFile: "src/lib/services/vip-email-templates.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "vip",
        },
        {
            id: "vip_support_sync_failed",
            title: "Support-Sync Batch Failed (Action Req)",
            description:
                "Sent when Saturday batch fails (e.g. invalid investor password) with instructions to update credentials.",
            sourceFile: "src/lib/services/vip-email-templates.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "vip",
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

        // ── Reports & Reviews ──
        {
            id: "weekly_report_ready",
            title: "Weekly Trading Report Ready",
            description:
                "Dispatches weekly performance breakdown, win rate, net PnL, and behavioral review summary.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "reports",
        },
        {
            id: "monthly_report_ready",
            title: "Monthly Trading Report Ready",
            description:
                "Dispatches monthly performance recap, risk compliance metrics, and top trading pairs.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "reports",
        },
        {
            id: "weekly_no_trades",
            title: "Weekly No-Trades Nudge",
            description:
                "Sent when a trader has zero closed trades during the week to check sync status or encourage journaling.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "reports",
        },
        {
            id: "monthly_no_trades",
            title: "Monthly No-Trades Nudge",
            description:
                "Sent when a trader has zero closed trades during the month to re-engage account sync.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
            category: "reports",
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

    const vipCount = activeTemplates.filter((t) => t.category === "vip").length;
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

    const filterTabs = [
        { id: "all" as const, label: "All Templates", count: totalCount, icon: Layers },
        { id: "vip" as const, label: "VIP & Retention", count: vipCount, icon: Crown },
        { id: "ea_academy" as const, label: "EA & Systems", count: eaAcademyCount, icon: Key },
        { id: "reports" as const, label: "Reports & Reviews", count: reportsCount, icon: BarChart3 },
        { id: "onboarding" as const, label: "Onboarding", count: onboardingCount, icon: Sparkles },
        { id: "auth" as const, label: "Supabase Auth", count: authCount, icon: ShieldCheck },
    ];

    const filteredActiveTemplates = activeTemplates.filter((t) => {
        if (activeTab === "all") return true;
        if (activeTab === "vip") return t.category === "vip";
        if (activeTab === "reports") return t.category === "reports";
        if (activeTab === "onboarding") return t.category === "onboarding";
        if (activeTab === "ea_academy") return t.category === "ea_academy" || t.category === "system";
        return true;
    });

    const shouldShowAuth = activeTab === "all" || activeTab === "auth";
    const shouldShowActive = activeTab !== "auth";

    return (
        <div className="space-y-6">
            <PageHeader
                title="Email Lab"
                description="Test, preview, and verify system-generated transactional HTML email templates."
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E2028] border border-dashboard text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono tabular-nums font-bold text-gray-800 dark:text-white">
                        {totalCount}
                    </span>
                    <span>Templates Ready</span>
                </div>
            </PageHeader>

            {/* Unified Control Bar: Recipient Configuration + Sandbox Notice */}
            <div className="bg-white dark:bg-[#1E2028] border border-dashboard rounded-xl p-5 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-7 space-y-2">
                    <PremiumInput
                        label="Test Recipient Address"
                        icon={Mail}
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        disabled={!allowCustomRecipient}
                        aria-label="Default test recipient address"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                        <Info size={13} className="text-gold shrink-0" />
                        {!allowCustomRecipient ? (
                            <span>
                                Custom recipient locked by environment config. Dispatching to{" "}
                                <code className="font-mono tabular-nums text-gray-700 dark:text-gray-200 font-bold bg-gray-100 dark:bg-[#151925] px-1.5 py-0.5 rounded-lg text-[11px]">
                                    {defaultRecipient}
                                </code>
                            </span>
                        ) : (
                            <span>
                                Custom recipient unlocked. Dispatches will route to the sandbox address above.
                            </span>
                        )}
                    </p>
                </div>

                <div className="lg:col-span-5 bg-amber-500/[0.04] dark:bg-[#151925] border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                    <ShieldAlert
                        className="text-gold shrink-0 mt-0.5"
                        size={18}
                    />
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <p className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Sandbox Dispatch Notice
                        </p>
                        <p className="leading-relaxed">
                            Active SMTP triggers send live payloads via your configured relay host. Use a sandbox inbox (Mailtrap) in non-production environments.
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Filter Segmented Pill Bar */}
            <div className="overflow-x-auto scrollbar-hide flex">
                <div className="inline-flex items-center bg-[#F1F3F5] dark:bg-[#1A1D27] border border-dashboard rounded-xl p-1 gap-1 shrink-0">
                    {filterTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <Button
                                key={tab.id}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab(tab.id)}
                                className={`h-auto flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 whitespace-nowrap ${
                                    isActive
                                        ? "bg-gold hover:bg-gold text-white shadow-sm shadow-amber-500/20"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]"
                                }`}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                                <span
                                    className={`font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-lg ${
                                        isActive
                                            ? "bg-black/15 text-white"
                                            : "bg-gray-200/70 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Group 1: SMTP and System Generated Emails */}
            {shouldShowActive && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-dashboard pb-2.5">
                        <h2 className="text-base font-bold text-gray-800 dark:text-white">
                            App-Owned Transactional Templates (SMTP)
                        </h2>
                        <span className="text-xs font-mono tabular-nums font-semibold text-gray-500 dark:text-gray-400">
                            {filteredActiveTemplates.length} templates
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredActiveTemplates.map((template) => (
                            <EmailTemplateCard
                                key={template.id}
                                template={template}
                                isSending={sending[template.id] || false}
                                isPreviewLoading={loadingPreview[template.id] || false}
                                result={results[template.id]}
                                onPreview={handlePreview}
                                onSend={handleSend}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Group 2: Supabase Auth Emails */}
            {shouldShowAuth && (
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-dashboard pb-2.5">
                        <h2 className="text-base font-bold text-gray-800 dark:text-white">
                            Supabase Authentication Flows (Auth Hook)
                        </h2>
                        <span className="text-xs font-mono tabular-nums font-semibold text-gray-500 dark:text-gray-400">
                            {supabaseTemplates.length} templates
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {supabaseTemplates.map((template) => (
                            <EmailTemplateCard
                                key={template.id}
                                template={template}
                                isSending={sending[template.id] || false}
                                isPreviewLoading={loadingPreview[template.id] || false}
                                result={results[template.id]}
                                onPreview={handlePreview}
                                onSend={handleSend}
                            />
                        ))}
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
