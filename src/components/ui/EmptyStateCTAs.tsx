"use client";

import Link from "next/link";
import { Plus, GraduationCap, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

interface EmptyStateCTAsProps {
    /** Primary action - defaults to "Log Your First Trade" */
    primaryLabel?: string;
    primaryHref?: string;
    /** Secondary action - defaults to "Start Academy" */
    secondaryLabel?: string;
    secondaryHref?: string;
    /** Show connect account CTA instead of log trade */
    variant?: "log-trade" | "connect-account";
}

export function EmptyStateCTAs({
    primaryLabel,
    primaryHref,
    secondaryLabel = "Start Academy",
    secondaryHref = "/dashboard/academy",
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

    const finalPrimaryLabel = primaryLabel || defaultPrimary.label;
    const finalPrimaryHref = primaryHref || defaultPrimary.href;
    const PrimaryIcon = defaultPrimary.icon;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
                href={finalPrimaryHref}
                className={cn(
                    buttonVariants({ variant: "primary" }),
                    "gap-2 px-5 h-10 text-sm font-bold rounded-lg shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/25 hover:-translate-y-px active:translate-y-0 transition-all duration-300 flex items-center justify-center"
                )}
            >
                <PrimaryIcon size={16} />
                {finalPrimaryLabel}
            </Link>
            <Link
                href={secondaryHref}
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "gap-2 px-5 h-10 text-sm font-bold rounded-lg border-dashboard hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-gold dark:hover:text-amber-400 transition-all duration-300 flex items-center justify-center"
                )}
            >
                <GraduationCap size={16} />
                {secondaryLabel}
            </Link>
        </div>
    );
}
