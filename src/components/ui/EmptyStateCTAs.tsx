"use client";

import Link from "next/link";
import { Plus, GraduationCap, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/lib/dashboard-context";

interface EmptyStateAction {
    label: string;
    href: string;
}

interface EmptyStateCTAsProps {
    /** Primary action - defaults to "Log Your First Trade" */
    primaryLabel?: string;
    primaryHref?: string;
    primary?: EmptyStateAction;
    /** Secondary action - defaults to "Start Academy" */
    secondaryLabel?: string;
    secondaryHref?: string;
    secondary?: EmptyStateAction;
    /** Show connect account CTA instead of log trade */
    variant?: "log-trade" | "connect-account";
}

export function EmptyStateCTAs({
    primaryLabel,
    primaryHref,
    primary,
    secondaryLabel = "Start Academy",
    secondaryHref = "/dashboard/academy",
    secondary,
    variant = "log-trade",
}: EmptyStateCTAsProps) {
    const defaultPrimary =
        variant === "connect-account"
            ? {
                  label: "Connect Account",
                  href: "/dashboard/accounts?action=add",
                  icon: Wallet,
              }
            : {
                  label: "Log Your First Trade",
                  href: "/dashboard/journal?action=log-trade",
                  icon: Plus,
              };

    const resolvedSecondaryLabel = secondary?.label || secondaryLabel;
    const resolvedSecondaryHref = secondary?.href || secondaryHref;

    const { isEnabled } = useFeatureFlags();
    const academyEnabled = isEnabled("feature_academy");
    const isAcademySecondary =
        resolvedSecondaryHref.startsWith("/dashboard/academy") ||
        resolvedSecondaryHref.startsWith("/academy");
    const showSecondary = academyEnabled || !isAcademySecondary;

    const finalPrimaryLabel =
        primary?.label || primaryLabel || defaultPrimary.label;
    const finalPrimaryHref =
        primary?.href || primaryHref || defaultPrimary.href;
    const PrimaryIcon = defaultPrimary.icon;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
                href={finalPrimaryHref}
                className={cn(
                    buttonVariants({ variant: "primary" }),
                    "gap-2 px-5 h-10 text-sm font-bold rounded-lg shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/25 transition-all duration-300 flex items-center justify-center"
                )}
            >
                <PrimaryIcon size={16} />
                {finalPrimaryLabel}
            </Link>
            {showSecondary && (
                <Link
                    href={resolvedSecondaryHref}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "gap-2 px-5 h-10 text-sm font-bold rounded-lg border-dashboard hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-gold dark:hover:text-amber-400 transition-all duration-300 flex items-center justify-center"
                    )}
                >
                    <GraduationCap size={16} />
                    {resolvedSecondaryLabel}
                </Link>
            )}
        </div>
    );
}
