"use client";

import { useState } from "react";
import { Check, Copy, Server, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getMt5WebRequestServers } from "@/lib/sync/sync-urls";

interface Mt5WebRequestUrlListProps {
    className?: string;
    compact?: boolean;
}

export function Mt5WebRequestUrlList({
    className,
    compact = false,
}: Mt5WebRequestUrlListProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const servers = getMt5WebRequestServers();

    const handleCopy = (id: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success(`Copied ${url} to clipboard`);
        setTimeout(() => {
            setCopiedId((current) => (current === id ? null : current));
        }, 2000);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {servers.map((entry) => {
                const isMain = entry.role === "MAIN";
                const isCopied = copiedId === entry.id;

                return (
                    <div
                        key={entry.id}
                        className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2.5 rounded-lg border transition-colors",
                            compact
                                ? "px-2.5 py-2"
                                : "px-2.5 py-2 sm:px-3 sm:py-2.5",
                            isMain
                                ? "bg-amber-500/[0.05] dark:bg-gold/[0.06] border-amber-500/25 dark:border-gold/25"
                                : "bg-white dark:bg-[#151925] border-dashboard dark:border-white/10"
                        )}
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    {isMain ? (
                                        <Server
                                            size={12}
                                            className="text-amber-600 dark:text-gold shrink-0"
                                        />
                                    ) : (
                                        <ShieldCheck
                                            size={12}
                                            className="text-emerald-600 dark:text-emerald-400 shrink-0"
                                        />
                                    )}
                                    <span
                                        className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            isMain
                                                ? "text-amber-700 dark:text-gold"
                                                : "text-emerald-600 dark:text-emerald-400"
                                        )}
                                    >
                                        {isMain ? "Main Server" : "Backup Server"}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                        · {entry.label.replace(/^(Main Server|Backup Server \d+)\s*/, "")}
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    aria-label={`Copy ${entry.url}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(entry.id, entry.url);
                                    }}
                                    className="sm:hidden shrink-0 h-7 px-2 text-[11px] font-semibold gap-1 rounded-lg"
                                >
                                    {isCopied ? (
                                        <>
                                            <Check size={11} className="text-emerald-500" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={11} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </Button>
                            </div>

                            <code className="block mt-1 sm:mt-0.5 font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 break-all">
                                {entry.url}
                            </code>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`Copy ${entry.url}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(entry.id, entry.url);
                            }}
                            className="hidden sm:inline-flex shrink-0 h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg"
                        >
                            {isCopied ? (
                                <>
                                    <Check size={12} className="text-emerald-500" />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                </>
                            )}
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
