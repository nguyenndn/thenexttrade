"use client";

import { useState } from "react";
import {
    Mail,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Info,
    RefreshCw,
    AlertTriangle,
    Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { sendEmailLabTest, type EmailLabTemplateId } from "./actions";

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
}

export function EmailLabClient({
    defaultRecipient,
    allowCustomRecipient,
}: EmailLabClientProps) {
    const [customTo, setCustomTo] = useState(defaultRecipient);
    const [sending, setSending] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<
        Record<string, { success: boolean; message: string; timestamp: string }>
    >({});

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

    const activeTemplates: TemplateCardInfo[] = [
        {
            id: "smtp_smoke",
            title: "SMTP Smoke Test",
            description:
                "Sends a basic system validation email to verify credentials and SMTP relay host connectivity.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "weekly_report_ready",
            title: "Weekly Report Ready",
            description:
                "Sends a weekly trading report summary with positive performance data and gold/green accent badges.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "monthly_report_ready",
            title: "Monthly Report Ready",
            description:
                "Sends a monthly trading report summary displaying a negative performance scenario with red accents.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "weekly_no_trades",
            title: "Weekly No-Trades Nudge",
            description:
                "Sends a weekly warning notification advising the user to stay consistent even if no trades are placed.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "monthly_no_trades",
            title: "Monthly No-Trades Nudge",
            description:
                "Sends a monthly warning notification advising the user to stay consistent even if no trades are placed.",
            sourceFile: "src/lib/services/email.service.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "activation_no_account_24h",
            title: "Onboarding: No Account (T+24h)",
            description:
                "Reminder notification sent to users who registered but haven't connected any accounts after 24 hours.",
            sourceFile: "src/lib/emails/activation-reminders.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "activation_no_first_data_24h",
            title: "Onboarding: No Trade Data (T+24h)",
            description:
                "Notification sent 24 hours after sync onboarding if the user connected an account but logged no trades.",
            sourceFile: "src/lib/emails/activation-reminders.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "activation_still_no_first_value_72h",
            title: "Onboarding: Inactive (T+72h)",
            description:
                "Final activation reminder prompting the user to explore the academy or link their trading accounts.",
            sourceFile: "src/lib/emails/activation-reminders.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "mobile_sync_fallback_tnt",
            title: "Sync Fallback: Trade Manager",
            description:
                "Email with a setup link prompting the user to complete their Trade Manager EA installation.",
            sourceFile: "src/lib/emails/activation-reminders.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "mobile_sync_fallback_ea",
            title: "Sync Fallback: Trade Manager (Alt)",
            description:
                "Email with a setup link prompting the user to complete their Trade Manager EA installation.",
            sourceFile: "src/lib/emails/activation-reminders.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "welcome_d0_preview",
            title: "Welcome D0 Onboarding",
            description:
                "Sent immediately after registration. Highlights the first 3 steps to unlock dashboard metrics.",
            sourceFile: "src/lib/emails/welcome-sequence.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "welcome_d1_preview",
            title: "Welcome D1 Onboarding",
            description:
                "Sent 24 hours after registration if the user has no trade data. Prompts MT5 connection details.",
            sourceFile: "src/lib/emails/welcome-sequence.ts",
            status: "active",
            statusLabel: "Active SMTP",
        },
        {
            id: "welcome_d3_preview",
            title: "Welcome D3 Onboarding",
            description:
                "Sent 72 hours after registration if the user has no trade data. Explains features they are missing.",
            sourceFile: "src/lib/emails/welcome-sequence.ts",
            status: "active",
            statusLabel: "Active SMTP",
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
        },
        {
            id: "resend_otp",
            title: "Resend Signup OTP",
            description: "Resent verification code for unconfirmed users.",
            sourceFile: "src/app/auth/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
        },
        {
            id: "magic_link",
            title: "Magic Link Login",
            description:
                "One-click authentication login email generating a temporary session token.",
            sourceFile: "src/app/auth/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
        },
        {
            id: "forgot_password",
            title: "Forgot Password Reset",
            description:
                "Email containing recovery token to allow user to reset their credentials.",
            sourceFile: "src/app/auth/actions.ts",
            status: "supabase",
            statusLabel: "Supabase Auth",
        },
        {
            id: "admin_reset",
            title: "Admin Reset Password Link",
            description:
                "Admin panel trigger. Generates a password recovery link using Supabase Admin Auth API.",
            sourceFile: "src/app/admin/users/[id]/actions.ts",
            status: "needs_fix",
            statusLabel: "Needs SMTP Wiring",
        },
    ];

    const getStatusBadge = (
        status: "active" | "supabase" | "needs_fix",
        label: string
    ) => {
        switch (status) {
            case "active":
                return (
                    <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border border-emerald-500/20">
                        {label}
                    </span>
                );
            case "supabase":
                return (
                    <span className="bg-sky-500/10 text-sky-500 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border border-sky-500/20">
                        {label}
                    </span>
                );
            case "needs_fix":
                return (
                    <span className="bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border border-amber-500/20">
                        {label}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section with brand accent */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-bold text-gray-700 dark:text-white tracking-tight">
                            Email Lab
                        </h1>
                    </div>
                    <p className="text-base text-gray-500 pl-4 font-medium">
                        Test and verify system-generated transactional HTML
                        email templates.
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
                    <Mail size={18} className="text-primary" />
                    Recipient Configuration
                </h3>
                <div className="max-w-xl">
                    <PremiumInput
                        label="Recipient Email Address"
                        icon={Mail}
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        disabled={!allowCustomRecipient}
                        placeholder="test@example.com"
                        className="text-sm"
                    />
                    {!allowCustomRecipient ? (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-medium">
                            <Info size={14} className="text-sky-500" />
                            Custom recipient is locked by environment config.
                            Sending only to default:{" "}
                            <code className="text-gray-700 dark:text-gray-300 font-bold bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-lg text-xs">
                                {defaultRecipient}
                            </code>
                            .
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-medium">
                            <Info size={14} className="text-emerald-500" />
                            Custom recipient is enabled. You can direct emails
                            to your custom inbox.
                        </p>
                    )}
                </div>
            </div>

            {/* Group 1: SMTP and System Generated Emails */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-white/10 pb-2">
                    App-Owned Transactional Templates (SMTP)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTemplates.map((template) => {
                        const loading = sending[template.id] || false;
                        const res = results[template.id];

                        return (
                            <div
                                key={template.id}
                                className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
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
                                    <Button
                                        variant="primary"
                                        className="w-full text-sm font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2"
                                        isLoading={loading}
                                        onClick={() =>
                                            handleSend(
                                                template.id as EmailLabTemplateId
                                            )
                                        }
                                    >
                                        <Mail size={15} />
                                        Send Test Email
                                    </Button>

                                    {res && (
                                        <div
                                            className={`p-2.5 rounded-lg text-xs font-medium flex gap-1.5 items-start ${res.success ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}
                                        >
                                            {res.success ? (
                                                <CheckCircle
                                                    size={15}
                                                    className="shrink-0 mt-0.5"
                                                />
                                            ) : (
                                                <XCircle
                                                    size={15}
                                                    className="shrink-0 mt-0.5"
                                                />
                                            )}
                                            <div className="space-y-0.5 leading-snug">
                                                <p className="font-semibold">
                                                    {res.message}
                                                </p>
                                                <p className="opacity-60 text-xs">
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

            {/* Group 2: Supabase Auth Emails */}
            <div className="space-y-4 pt-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-white/10 pb-2">
                    Supabase Authentication Flows (Auth Hook)
                </h2>
                <div className="bg-sky-500/[0.02] border border-sky-500/15 rounded-xl p-5 flex items-start gap-3.5">
                    <Info className="text-sky-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-sky-700 dark:text-sky-400 leading-relaxed font-medium">
                        Auth emails are managed and dispatched directly by the{" "}
                        <strong>Supabase Auth microservice</strong>. In local
                        development or staging, configure Supabase Custom SMTP
                        settings to redirect auth emails to Mailtrap, or trigger
                        them manually from the login forms.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supabaseTemplates.map((template) => {
                        return (
                            <div
                                key={template.id}
                                className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm flex flex-col justify-between"
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

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2.5">
                                    {template.id === "admin_reset" ? (
                                        <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg text-xs text-amber-600 dark:text-amber-500/90 leading-normal font-medium">
                                            <p className="font-bold flex items-center gap-1.5">
                                                <AlertTriangle size={14} className="shrink-0" />
                                                Integration Gap Detected
                                            </p>
                                            <p className="mt-1">
                                                The link generation works, but
                                                the system currently only
                                                generates a recovery URL and
                                                does not dispatch it through
                                                SMTP. Treat this as an
                                                unfinished flow.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-sky-500/5 border border-sky-500/10 p-2.5 rounded-lg text-xs text-sky-700 dark:text-sky-400 leading-normal font-medium">
                                            <p className="font-bold flex items-center gap-1.5">
                                                <Lightbulb size={14} className="shrink-0" />
                                                How to Trigger &amp; Test:
                                            </p>
                                            <p className="mt-1">
                                                Trigger this flow by submitting
                                                the actual forms at{" "}
                                                <code className="bg-sky-500/10 px-1 py-0.5 rounded-lg">
                                                    /auth/login
                                                </code>{" "}
                                                or{" "}
                                                <code className="bg-sky-500/10 px-1 py-0.5 rounded-lg">
                                                    /auth/signup
                                                </code>{" "}
                                                views.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
