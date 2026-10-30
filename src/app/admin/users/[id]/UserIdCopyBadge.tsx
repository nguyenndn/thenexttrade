"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function UserIdCopyBadge({ userId }: { userId: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(userId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={handleCopy}
            title="Click to copy User ID"
            aria-label="Copy User ID"
            className="h-auto group inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-mono font-medium text-gray-600 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-primary"
        >
            <span className="truncate max-w-[140px]">{userId}</span>
            {copied ? (
                <Check size={12} className="text-emerald-500 shrink-0" />
            ) : (
                <Copy size={12} className="text-gray-400 group-hover:text-primary shrink-0" />
            )}
        </Button>
    );
}
