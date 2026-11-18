"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    CheckCircle2,
    Loader2,
    MailCheck,
    ShieldCheck,
    AlertTriangle,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UnsubscribeClientProps {
    token: string;
    verifiedEmail: string | null;
}

export function UnsubscribeClient({
    token,
    verifiedEmail,
}: UnsubscribeClientProps) {
    const [status, setStatus] = useState<
        "processing" | "unsubscribed" | "resubscribed" | "error"
    >(verifiedEmail ? "processing" : "error");
    const [isMutating, setIsMutating] = useState(false);

    useEffect(() => {
        if (!verifiedEmail || !token) return;
        let cancelled = false;
        fetch("/api/email/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, action: "unsubscribe" }),
        })
            .then((res) => {
                if (!cancelled) setStatus(res.ok ? "unsubscribed" : "error");
            })
            .catch(() => {
                if (!cancelled) setStatus("error");
            });
        return () => {
            cancelled = true;
        };
    }, [token, verifiedEmail]);

    const handleToggle = async (nextAction: "unsubscribe" | "resubscribe") => {
        setIsMutating(true);
        try {
            const res = await fetch("/api/email/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, action: nextAction }),
            });
            if (res.ok) {
                setStatus(
                    nextAction === "resubscribe" ? "resubscribed" : "unsubscribed"
                );
            }
        } finally {
            setIsMutating(false);
        }
    };

    const isUnsub = status === "unsubscribed";

    return (
        <div className="w-full max-w-md bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg p-6 sm:p-7 space-y-5">
            {status === "processing" && (
                <div className="text-center py-6 space-y-3">
                    <Loader2 size={28} className="animate-spin text-gold mx-auto" />
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        Updating marketing preferences...
                    </h1>
                </div>
            )}

            {status === "error" && (
                <div className="space-y-4 text-center">
                    <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                        <AlertTriangle size={20} className="text-rose-500" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        Invalid Unsubscribe Link
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        This unsubscribe link is invalid. Registered traders can manage email categories directly in Account Settings.
                    </p>
                    <Link href="/dashboard/settings" className="block">
                        <Button type="button" variant="outline" className="w-full rounded-lg">
                            <Settings size={15} />
                            <span>Open Email Settings</span>
                        </Button>
                    </Link>
                </div>
            )}

            {(isUnsub || status === "resubscribed") && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            {isUnsub ? (
                                <CheckCircle2 size={20} className="text-emerald-500" />
                            ) : (
                                <MailCheck size={20} className="text-emerald-500" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-white">
                                {isUnsub ? "Unsubscribed from Marketing Emails" : "Marketing Emails Re-enabled"}
                            </h1>
                            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">
                                {verifiedEmail}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {isUnsub
                            ? "You will no longer receive promotional campaigns or marketing broadcasts from TheNextTrade."
                            : "Your email address is subscribed again to product announcements and marketing updates."}
                    </p>

                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 flex items-start gap-2.5">
                        <ShieldCheck size={16} className="text-gold shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            <strong className="text-gray-900 dark:text-white">System notifications remain active:</strong>{" "}
                            Account security alerts, password resets, EA license keys, VIP approvals, and support replies will still arrive normally.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <Button
                            type="button"
                            variant={isUnsub ? "outline" : "gold"}
                            disabled={isMutating}
                            onClick={() => handleToggle(isUnsub ? "resubscribe" : "unsubscribe")}
                            className="flex-1 rounded-lg text-xs font-bold"
                        >
                            {isMutating && <Loader2 size={14} className="animate-spin" />}
                            <span>{isUnsub ? "Re-subscribe to Marketing" : "Unsubscribe Again"}</span>
                        </Button>
                        <Link href="/dashboard/settings" className="flex-1">
                            <Button type="button" variant="outline" className="w-full rounded-lg text-xs font-bold">
                                <Settings size={14} />
                                <span>Manage Preferences</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
