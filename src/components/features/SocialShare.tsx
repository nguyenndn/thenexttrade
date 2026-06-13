"use client";

import { Facebook, Linkedin, Link as LinkIcon, Check, Send, ThumbsUp } from "lucide-react";

// X (formerly Twitter) icon - lucide doesn't have it yet
const XIcon = ({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) => (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
 </svg>
);

// Pinterest icon
const PinterestIcon = ({ size = 20 }: { size?: number }) => (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
 <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
 </svg>
);
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
 x: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
 linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
 telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
 pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
 };

 const copyToClipboard = async () => {
 try {
 await navigator.clipboard.writeText(url);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch {
 toast.error("Failed to copy link");
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
 <div className="bg-white dark:bg-[#1E2028] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-dashboard py-6 w-[52px] flex flex-col items-center gap-5">
 <a
 href={shareLinks.facebook} target="_blank" rel="noopener noreferrer"
 className="text-[#3b5998] hover:scale-125 transition-transform"
 title="Share on Facebook"
 aria-label="Share on Facebook"
 >
 <Facebook size={20} strokeWidth={2.5} />
 </a>
 <a
 href={shareLinks.x} target="_blank" rel="noopener noreferrer"
 className="text-gray-800 dark:text-gray-200 hover:scale-125 transition-transform"
 title="Share on X"
 aria-label="Share on X"
 >
 <XIcon size={18} />
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
 <a
 href={shareLinks.pinterest} target="_blank" rel="noopener noreferrer"
 className="text-[#E60023] hover:scale-125 transition-transform"
 title="Share on Pinterest"
 aria-label="Share on Pinterest"
 >
 <PinterestIcon size={18} />
 </a>
 <div className="w-6 h-[1px] bg-gray-100 dark:bg-white/10 my-1"></div>
 <button
 onClick={copyToClipboard}
 className="text-gray-500 hover:text-primary hover:scale-125 transition-transform"
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
 voted ? "text-primary" : "text-gray-500 hover:text-primary"
 }`}
 title={voted ? "Remove your vote" : "Mark as helpful"}
 aria-label={voted ? "Remove your vote" : "Mark as helpful"}
 >
 <ThumbsUp size={20} strokeWidth={2.5} className={voted ? "fill-primary" : ""} />
 {voteCount > 0 && (
 <span className={`absolute -top-2 -right-2.5 text-[9px] font-black tabular-nums min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 ${
 voted
 ? "bg-primary text-white"
 : "bg-gray-200 dark:bg-white/15 text-gray-600 dark:text-gray-300"
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
 <h4 className="font-bold text-gray-700 dark:text-white text-xs uppercase tracking-widest text-center">Share this</h4>
 <div className="flex justify-center gap-2">
 {/* Horizontal Layout (Existing) */}
 <a
 href={shareLinks.facebook}
 target="_blank"
 rel="noopener noreferrer"
 className="w-10 h-10 flex items-center justify-center border border-dashboard dark:border-slate-700 hover:bg-[#3b5998] hover:text-white hover:border-[#3b5998] text-gray-500 transition-all rounded-full"
 title="Share on Facebook"
 aria-label="Share on Facebook"
 >
 <Facebook size={16} />
 </a>
 <a
 href={shareLinks.x}
 target="_blank"
 rel="noopener noreferrer"
 className="w-10 h-10 flex items-center justify-center border border-dashboard dark:border-slate-700 hover:bg-black hover:text-white hover:border-black text-gray-500 transition-all rounded-full"
 title="Share on X"
 aria-label="Share on X"
 >
 <XIcon size={14} />
 </a>
 <a
 href={shareLinks.linkedin}
 target="_blank"
 rel="noopener noreferrer"
 className="w-10 h-10 flex items-center justify-center border border-dashboard dark:border-slate-700 hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] text-gray-500 transition-all rounded-full"
 title="Share on LinkedIn"
 aria-label="Share on LinkedIn"
 >
 <Linkedin size={16} />
 </a>
 <a
 href={shareLinks.telegram}
 target="_blank"
 rel="noopener noreferrer"
 className="w-10 h-10 flex items-center justify-center border border-dashboard dark:border-slate-700 hover:bg-[#0088cc] hover:text-white hover:border-[#0088cc] text-gray-500 transition-all rounded-full"
 title="Share on Telegram"
 aria-label="Share on Telegram"
 >
 <Send size={16} className="-ml-0.5" />
 </a>
 <a
 href={shareLinks.pinterest}
 target="_blank"
 rel="noopener noreferrer"
 className="w-10 h-10 flex items-center justify-center border border-dashboard dark:border-slate-700 hover:bg-[#E60023] hover:text-white hover:border-[#E60023] text-gray-500 transition-all rounded-full"
 title="Share on Pinterest"
 aria-label="Share on Pinterest"
 >
 <PinterestIcon size={14} />
 </a>
 <Button
 variant="ghost"
 size="icon"
 onClick={copyToClipboard}
 className="w-10 h-10 flex items-center justify-center border border-dashboard dark:border-slate-700 hover:bg-gray-800 hover:text-white hover:border-gray-800 dark:hover:bg-white dark:hover:text-black transition-all rounded-full"
 aria-label="Copy Link"
 >
 {copied ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
 </Button>
 </div>
 </div>
 );
}
