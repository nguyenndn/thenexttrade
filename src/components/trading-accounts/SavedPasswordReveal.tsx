"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Check, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { revealTradingAccountPassword } from "@/actions/cloud-sync";
import { cn } from "@/lib/utils";

export interface SavedPasswordRevealProps {
    accountId: string;
    hasSavedPassword?: boolean;
    variant?: "bar" | "field";
    label?: string;
    showEmptyBadge?: boolean;
    className?: string;
}

export function SavedPasswordReveal({
    accountId,
    hasSavedPassword = true,
    variant = "bar",
    label,
    showEmptyBadge = false,
    className,
}: SavedPasswordRevealProps) {
    const [password, setPassword] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [loadingAction, setLoadingAction] = useState<"reveal" | "copy" | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setPassword(null);
        setIsVisible(false);
        setCopied(false);
        setLoadingAction(null);
    }, [accountId]);

    const fetchDecrypted = async (mode: "reveal" | "copy"): Promise<string | null> => {
        if (password) return password;
        setLoadingAction(mode);
        try {
            const res = await revealTradingAccountPassword(accountId);
            if (!res.success || !res.password) {
                toast.error(res.error || "Unable to retrieve saved password.");
                return null;
            }
            setPassword(res.password);
            return res.password;
        } catch {
            toast.error("Failed to retrieve saved password.");
            return null;
        } finally {
            setLoadingAction(null);
        }
    };

    const handleToggleReveal = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isVisible) return setIsVisible(false);
        const resolved = await fetchDecrypted("reveal");
        if (resolved) setIsVisible(true);
    };

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const resolved = await fetchDecrypted("copy");
        if (!resolved) return;
        await navigator.clipboard.writeText(resolved);
        setCopied(true);
        toast.success("MT5 password copied to clipboard.");
        setTimeout(() => setCopied(false), 2000);
    };

    const isField = variant === "field";

    if (!hasSavedPassword) {
        if (!showEmptyBadge) return null;
        return (
            <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    isField
                        ? "flex h-9 w-full items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] px-3 text-xs text-gray-400"
                        : "inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] px-2.5 text-xs font-medium text-gray-400",
                    className
                )}
            >
                <KeyRound size={14} className="shrink-0 opacity-60" />
                <span>No Saved Password</span>
            </div>
        );
    }

    const resolvedLabel = label ?? (isField ? "MT5 Password" : "Pass");

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
                isField
                    ? "flex min-h-9 w-full items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] px-3 py-1 shadow-2xs"
                    : "inline-flex h-8 items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] pl-2.5 pr-1.5 shadow-2xs",
                className
            )}
        >
            <div className="flex min-w-0 items-center gap-1.5">
                <KeyRound size={14} className="shrink-0 text-amber-500" />
                {resolvedLabel && (
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {resolvedLabel}:
                    </span>
                )}
                <span
                    className={cn(
                        "truncate font-mono tabular-nums font-bold select-all",
                        isVisible && password
                            ? "text-xs sm:text-[13px] text-gray-900 dark:text-white"
                            : "text-xs tracking-widest text-gray-500 dark:text-gray-400",
                        isField ? "max-w-[200px]" : "max-w-[140px]"
                    )}
                >
                    {isVisible && password ? password : "••••••••"}
                </span>
            </div>
            <div className="flex shrink-0 items-center gap-1 border-l border-gray-200/80 pl-1.5 dark:border-white/10">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={loadingAction !== null}
                    onClick={handleToggleReveal}
                    aria-label={isVisible ? "Hide MT5 password" : "View MT5 password"}
                    title={isVisible ? "Hide MT5 password" : "View MT5 password"}
                    className="h-6 w-6 rounded-lg p-0 text-gray-500 hover:bg-amber-500/10 hover:text-amber-600 dark:text-gray-400 dark:hover:text-gold"
                >
                    {loadingAction === "reveal" ? <RefreshCw size={13} className="animate-spin" /> : isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    disabled={loadingAction !== null}
                    onClick={handleCopy}
                    aria-label="Copy MT5 password"
                    title="Copy MT5 password"
                    className="h-6 gap-1 rounded-lg px-2 text-xs font-bold text-gray-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400"
                >
                    {loadingAction === "copy" ? <RefreshCw size={13} className="animate-spin" /> : copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
            </div>
        </div>
    );
}
