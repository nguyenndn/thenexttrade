"use client";

import { useState, useEffect } from "react";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface User {
 id: string;
 name: string | null;
 image: string | null;
}

interface CommentSectionProps {
 articleId: string;
 currentUser?: User | null;
 initialComments?: any[];
}

export function CommentSection({ articleId, currentUser: initialUser, initialComments = [] }: CommentSectionProps) {
 const [comments, setComments] = useState(initialComments);
 const [isLoading, setIsLoading] = useState(initialComments.length === 0);
 const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null);

 useEffect(() => {
 if (initialUser !== undefined) return;
 fetch("/api/profile")
 .then(res => res.ok ? res.json() : null)
 .then(data => {
 if (data?.id) {
 setCurrentUser({
 id: data.id,
 name: data.name,
 image: data.image
 });
 }
 })
 .catch(() => {});
 }, [initialUser]);

 const fetchComments = async () => {
 try {
 const res = await fetch(`/api/articles/${articleId}/comments`);
 if (res.ok) {
 const data = await res.json();
 setComments(data);
 }
 } catch (error) {
 console.error("Failed to fetch comments", error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 if (initialComments.length > 0) {
 setIsLoading(false);
 } else {
 fetchComments();
 }
 }, [articleId]);

 return (
 <section 
 id="comments" 
 className="py-12 px-6 sm:px-10 bg-white/70 dark:bg-[#12141c]/80 backdrop-blur-xl border border-dashboard rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden transition-all duration-300"
 >
 {/* Soft background glow */}
 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

 <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-dashboard">
 <div className="flex items-center gap-3.5">
 <div className="p-3 bg-gradient-to-tr from-primary/10 to-emerald-500/10 dark:from-primary/20 dark:to-emerald-500/20 text-primary rounded-2xl border border-primary/20 dark:border-primary/30 shadow-[0_4px_20px_rgba(16,185,129,0.08)]">
 <MessageSquare size={22} className="stroke-[2.5]" />
 </div>
 <div className="flex items-center gap-2">
 <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-800 dark:text-white font-sans">
 Discussion
 </h2>
 <span className="inline-flex items-center justify-center px-3 py-0.5 text-xs font-extrabold rounded-full bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 dark:border-primary/30">
 {comments.length}
 </span>
 </div>
 </div>
 
 {currentUser && (
 <Button 
 variant="ghost"
 onClick={() => document.getElementById('comment-form-box')?.scrollIntoView({ behavior: 'smooth' })}
 className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary hover:text-white px-4 py-2 rounded-full border border-primary/10 transition-all duration-300 self-start sm:self-auto"
 >
 Write a comment &darr;
 </Button>
 )}
 </div>

 {/* Comments List */}
 <div className="mb-12 relative z-10">
 {isLoading ? (
 <div className="flex flex-col items-center justify-center py-20 gap-3">
 <Loader2 className="animate-spin text-primary stroke-[2.5]" size={32} />
 <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 animate-pulse">Loading discussion...</span>
 </div>
 ) : (
 <CommentList
 comments={comments}
 articleId={articleId}
 currentUser={currentUser}
 onRefresh={fetchComments}
 />
 )}
 </div>

 {/* Main Comment Form */}
 <div 
 id="comment-form-box" 
 className="bg-gray-50/50 dark:bg-[#090b10]/40 border border-dashboard p-6 sm:p-8 rounded-2xl scroll-mt-32 relative z-10 transition-all duration-300 hover:border-dashboard dark:hover:border-white/10"
 >
 {currentUser ? (
 <CommentForm
 articleId={articleId}
 onSuccess={fetchComments}
 userName={currentUser.name}
 userImage={currentUser.image}
 />
 ) : (
 <div className="text-center py-8 px-4 flex flex-col items-center max-w-md mx-auto">
 <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 border border-dashboard flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
 <MessageSquare size={20} className="opacity-60" />
 </div>
 <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-2">Join the conversation</h3>
 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
 Share your trading insights, ask questions, and engage with the community.
 </p>
 <a
 href={`/auth/login?next=/articles/${articleId}#comment-form-box`}
 className="inline-flex items-center justify-center px-8 py-3 bg-primary hover:bg-[#00B078] text-white rounded-full font-bold text-sm transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
 >
 Log In to Comment
 </a>
 </div>
 )}
 </div>
 </section>
 );
}
