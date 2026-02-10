"use client";

import { Facebook, Linkedin, Twitter, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";

interface SocialShareProps {
    title: string;
    slug: string;
    vertical?: boolean;
}

export default function SocialShare({ title, slug, vertical = false }: SocialShareProps) {
    const [copied, setCopied] = useState(false);

    // Fallback for SSR/build time where window is undefined
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://thenexttrade.com';
    const url = `${baseUrl}/articles/${slug}`;

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
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

    if (vertical) {
        return (
            <div className="flex flex-col gap-3 sticky top-24">
                <a
                    href={shareLinks.facebook} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-[#3b5998] hover:bg-[#3b5998] hover:text-white shadow-lg shadow-gray-200 dark:shadow-none rounded-full transition-all border border-gray-100 dark:border-white/5"
                    title="Share on Facebook"
                >
                    <Facebook size={18} />
                </a>
                <a
                    href={shareLinks.twitter} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-[#1da1f2] hover:bg-[#1da1f2] hover:text-white shadow-lg shadow-gray-200 dark:shadow-none rounded-full transition-all border border-gray-100 dark:border-white/5"
                    title="Share on Twitter"
                >
                    <Twitter size={18} />
                </a>
                <a
                    href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-[#0077b5] hover:bg-[#0077b5] hover:text-white shadow-lg shadow-gray-200 dark:shadow-none rounded-full transition-all border border-gray-100 dark:border-white/5"
                    title="Share on LinkedIn"
                >
                    <Linkedin size={18} />
                </a>
                <button
                    onClick={copyToClipboard}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-gray-500 hover:text-primary shadow-lg shadow-gray-200 dark:shadow-none rounded-full transition-all border border-gray-100 dark:border-white/5"
                    title="Copy Link"
                >
                    {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                </button>
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
                >
                    <Facebook size={16} />
                </a>
                <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-[#1da1f2] hover:text-white hover:border-[#1da1f2] text-gray-400 transition-all rounded-full"
                    title="Share on Twitter"
                >
                    <Twitter size={16} />
                </a>
                <a
                    href={shareLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] text-gray-400 transition-all rounded-full"
                    title="Share on LinkedIn"
                >
                    <Linkedin size={16} />
                </a>
                <button
                    onClick={copyToClipboard}
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:bg-gray-800 hover:text-white hover:border-gray-800 dark:hover:bg-white dark:hover:text-black transition-all rounded-full"
                    title="Copy Link"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
                </button>
            </div>
        </div>
    );
}
