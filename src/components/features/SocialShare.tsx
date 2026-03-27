"use client";

import { Facebook, Linkedin, Twitter, Link as LinkIcon, Check, Send, ThumbsUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface SocialShareProps {
    title: string;
    slug: string;
    vertical?: boolean;
    articleId?: string;
}

export default function SocialShare({ title, slug, vertical = false, articleId }: SocialShareProps) {
    const [copied, setCopied] = useState(false);
    const [voted, setVoted] = useState(false);
    const [voteCount, setVoteCount] = useState(0);
    const [isToggling, setIsToggling] = useState(false);

    // Use env var for consistent URL on both server and client (avoids hydration mismatch)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thenexttrade.com';
    const url = `${baseUrl}/articles/${slug}`;

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // Fetch vote status
    useEffect(() => {
        if (!articleId) return;
        fetch(`/api/articles/${articleId}/vote`)
            .then(res => res.json())
            .then(data => { setVoted(data.voted); setVoteCount(data.count); })
            .catch(() => {});
    }, [articleId]);

    const handleVoteToggle = useCallback(async () => {
        if (!articleId || isToggling) return;
        const prev = { voted, count: voteCount };
        setVoted(!voted);
        setVoteCount(voted ? voteCount - 1 : voteCount + 1);
        setIsToggling(true);
        try {
            const res = await fetch(`/api/articles/${articleId}/vote`, { method: "POST" });
            if (!res.ok) {
                if (res.status === 401) {
                    setVoted(prev.voted); setVoteCount(prev.count);
                    toast.error("Please log in to mark articles as helpful");
                    return;
                }
                throw new Error();
            }
            const data = await res.json();
            setVoted(data.voted); setVoteCount(data.count);
        } catch {
            setVoted(prev.voted); setVoteCount(prev.count);
        } finally {
            setIsToggling(false);
        }
    }, [articleId, voted, voteCount, isToggling]);

    if (vertical) {
        return (
            <div className="bg-white dark:bg-[#1E2028] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-white/5 py-6 w-[52px] flex flex-col items-center gap-5">
                <a
                    href={shareLinks.facebook} target="_blank" rel="noopener noreferrer"
                    className="text-[#3b5998] hover:scale-125 transition-transform"
                    title="Share on Facebook"
                    aria-label="Share on Facebook"
                >
                    <Facebook size={20} strokeWidth={2.5} />
                </a>
                <a
                    href={shareLinks.twitter} target="_blank" rel="noopener noreferrer"
                    className="text-[#1da1f2] hover:scale-125 transition-transform"
                    title="Share on Twitter"
                    aria-label="Share on Twitter"
                >
                    <Twitter size={20} strokeWidth={2.5} />
                </a>
                <a
                    href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-[#0077b5] hover:scale-125 transition-transform"
                    title="Share on LinkedIn"
                    aria-label="Share on LinkedIn"
                >
                    <Linkedin size={20} strokeWidth={2.5} />
                </a>
                <a
                    href={shareLinks.telegram} target="_blank" rel="noopener noreferrer"
                    className="text-[#0088cc] hover:scale-125 transition-transform"
                    title="Share on Telegram"
                    aria-label="Share on Telegram"
                >
                    <Send size={20} strokeWidth={2.5} className="-ml-0.5 mt-0.5" />
                </a>
                <div className="w-6 h-[1px] bg-gray-100 dark:bg-white/10 my-1"></div>
                <button
                    onClick={copyToClipboard}
                    className="text-gray-400 hover:text-primary hover:scale-125 transition-transform"
                    title="Copy Link"
                    aria-label="Copy Link"
                >
                    {copied ? <Check size={20} strokeWidth={3} className="text-primary" /> : <LinkIcon size={20} strokeWidth={2.5} />}
                </button>
                {articleId && (
                    <>
                        <div className="w-6 h-[1px] bg-gray-100 dark:bg-white/10 my-1"></div>
                        <button
                            onClick={handleVoteToggle}
                            disabled={isToggling}
                            className={`relative hover:scale-125 transition-all duration-300 disabled:opacity-70 ${
                                voted ? "text-primary" : "text-gray-400 hover:text-primary"
                            }`}
                            title={voted ? "Remove your vote" : "Mark as helpful"}
                            aria-label={voted ? "Remove your vote" : "Mark as helpful"}
                        >
                            <ThumbsUp size={20} strokeWidth={2.5} className={voted ? "fill-primary" : ""} />
                            {voteCount > 0 && (
                                <span className={`absolute -top-2 -right-2.5 text-[9px] font-black tabular-nums min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 ${
                                    voted
                                        ? "bg-primary text-white"
                                        : "bg-gray-200 dark:bg-white/15 text-gray-500 dark:text-gray-400"
                                }`}>
                                    {voteCount}
                                </span>
                            )}
                        </button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-widest text-center">Share this</h4>
            <div className="flex justify-center gap-2">
                {/* Horizontal Layout (Existing) */}
                <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-[#3b5998] hover:text-white hover:border-[#3b5998] text-gray-400 transition-all rounded-full"
                    title="Share on Facebook"
                    aria-label="Share on Facebook"
                >
                    <Facebook size={16} />
                </a>
                <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-[#1da1f2] hover:text-white hover:border-[#1da1f2] text-gray-400 transition-all rounded-full"
                    title="Share on Twitter"
                    aria-label="Share on Twitter"
                >
                    <Twitter size={16} />
                </a>
                <a
                    href={shareLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] text-gray-400 transition-all rounded-full"
                    title="Share on LinkedIn"
                    aria-label="Share on LinkedIn"
                >
                    <Linkedin size={16} />
                </a>
                <a
                    href={shareLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-[#0088cc] hover:text-white hover:border-[#0088cc] text-gray-400 transition-all rounded-full"
                    title="Share on Telegram"
                    aria-label="Share on Telegram"
                >
                    <Send size={16} className="-ml-0.5" />
                </a>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-gray-800 hover:text-white hover:border-gray-800 dark:hover:bg-white dark:hover:text-black transition-all rounded-full"
                    aria-label="Copy Link"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
                </Button>
            </div>
        </div>
    );
}
