"use client";

import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

import { getBaseUrl } from "@/lib/url";

interface BreadcrumbShareButtonsProps {
    title: string;
    slug: string;
}

export function BreadcrumbShareButtons({
    title,
    slug,
}: BreadcrumbShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/articles/${slug}`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // User cancelled or share failed silently
            }
        } else {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
            window.open(
                twitterUrl,
                "_blank",
                "noopener,noreferrer,width=600,height=400"
            );
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link copied!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
                Share:
            </span>
            <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="w-8 h-8 rounded-xl border-dashboard dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gold hover:border-gold transition-colors p-0"
                title="Share via Social"
                aria-label="Share via Social"
            >
                <Share2 size={13} />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="w-8 h-8 rounded-xl border-dashboard dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gold hover:border-gold transition-colors p-0"
                title="Copy Link"
                aria-label="Copy Link"
            >
                {copied ? (
                    <Check size={13} className="text-gold" />
                ) : (
                    <LinkIcon size={13} />
                )}
            </Button>
        </div>
    );
}
