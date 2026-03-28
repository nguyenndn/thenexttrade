"use client";

import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface BreadcrumbShareButtonsProps {
    title: string;
    slug: string;
}

export function BreadcrumbShareButtons({ title, slug }: BreadcrumbShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";
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
            window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=400");
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
        <div className="flex items-center gap-2 shrink-0 bg-white/15 dark:bg-white/10 rounded-lg px-3 py-1.5">
            <span className="text-sm text-white font-semibold">Share:</span>
            <Button
                variant="ghost"
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors p-0"
                title="Share via Social"
                aria-label="Share via Social"
            >
                <Share2 size={14} />
            </Button>
            <Button
                variant="ghost"
                onClick={handleCopy}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors p-0"
                title="Copy Link"
                aria-label="Copy Link"
            >
                {copied ? <Check size={14} className="text-white" /> : <LinkIcon size={14} />}
            </Button>
        </div>
    );
}
