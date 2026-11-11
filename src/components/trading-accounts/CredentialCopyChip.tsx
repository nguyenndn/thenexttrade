"use client";

import { useState } from "react";
import { Copy, Check, LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface CredentialCopyChipProps {
    label?: string;
    value: string;
    displayValue?: string;
    icon?: LucideIcon;
    toastLabel?: string;
    className?: string;
}

export function CredentialCopyChip({
    label,
    value,
    displayValue,
    icon: Icon,
    toastLabel = "Value",
    className,
}: CredentialCopyChipProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(`${toastLabel} copied to clipboard.`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "inline-flex h-8 items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] pl-2.5 pr-1.5 shadow-2xs",
                className
            )}
        >
            <div className="flex min-w-0 items-center gap-1.5">
                {Icon && <Icon size={13} className="shrink-0 text-gray-400" />}
                {label && (
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {label}:
                    </span>
                )}
                <span className="max-w-[180px] truncate font-mono tabular-nums text-xs font-bold text-gray-800 dark:text-gray-200 select-all">
                    {displayValue ?? value}
                </span>
            </div>
            <div className="border-l border-gray-200/80 pl-1 dark:border-white/10">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCopy}
                    aria-label={`Copy ${toastLabel}`}
                    title={`Copy ${toastLabel}: ${value}`}
                    className="h-6 gap-1 rounded-lg px-1.5 text-[11px] font-bold text-gray-500 hover:bg-amber-500/10 hover:text-amber-600 dark:text-gray-400 dark:hover:text-gold"
                >
                    {copied ? (
                        <Check size={13} className="text-emerald-500" />
                    ) : (
                        <Copy size={12} />
                    )}
                </Button>
            </div>
        </div>
    );
}

