"use client";

import Link from "next/link";
import { Plus, GraduationCap, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
 const defaultPrimary = variant === "connect-account"
 ? { label: "Connect Account", href: "/dashboard/accounts?action=add", icon: Wallet }
 : { label: "Log Your First Trade", href: "/dashboard/journal?action=log-trade", icon: Plus };

 const finalPrimaryLabel = primaryLabel || defaultPrimary.label;
 const finalPrimaryHref = primaryHref || defaultPrimary.href;
 const PrimaryIcon = defaultPrimary.icon;

 return (
 <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
 <Link href={finalPrimaryHref}>
 <Button
 variant="primary"
 className="gap-2 px-5 h-10 text-sm font-bold rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 hover:-translate-y-px active:translate-y-0 transition-all duration-300"
 >
 <PrimaryIcon size={16} />
 {finalPrimaryLabel}
 </Button>
 </Link>
 <Link href={secondaryHref}>
 <Button
 variant="outline"
 className="gap-2 px-5 h-10 text-sm font-bold rounded-xl border-dashboard hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
 >
 <GraduationCap size={16} />
 {secondaryLabel}
 </Button>
 </Link>
 </div>
 );
}
