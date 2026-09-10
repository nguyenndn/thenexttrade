"use client";

import { useState, useTransition } from "react";
import {
    ThumbsUp,
    ShieldAlert,
    Trash2,
    Loader2,
    X,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    Users,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import {
    getArticleVoteAudit,
    purgeArticleVotesAction,
    ArticleVoteAuditItem,
} from "@/actions/admin-article-votes";

export function ArticleVotesAuditModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<ArticleVoteAuditItem[]>([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [selectedArticle, setSelectedArticle] = useState<ArticleVoteAuditItem | null>(null);
    const [pendingPurgeArticle, setPendingPurgeArticle] = useState<ArticleVoteAuditItem | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleOpen = async () => {
        setIsOpen(true);
        setIsLoading(true);
        try {
            const res = await getArticleVoteAudit();
            if (res.success) {
                setItems(res.items);
                setTotalVotes(res.totalVotes);
            } else {
                toast.error(res.error || "Failed to load vote audit");
            }
        } catch (err) {
            toast.error("Error loading vote audit");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurgeArticle = (article: ArticleVoteAuditItem) => {
        setPendingPurgeArticle(article);
    };

    const confirmPurgeArticle = () => {
        if (!pendingPurgeArticle) return;
        startTransition(async () => {
            const res = await purgeArticleVotesAction({
                articleId: pendingPurgeArticle.articleId,
                purgeAllForArticle: true,
            });
            if (res.success) {
                toast.success(`Purged ${res.count || 0} votes for ${pendingPurgeArticle.articleTitle}`);
                setItems((prev) => prev.filter((i) => i.articleId !== pendingPurgeArticle.articleId));
                setTotalVotes((prev) => prev - (pendingPurgeArticle.voteCount || 0));
                if (selectedArticle?.articleId === pendingPurgeArticle.articleId) {
                    setSelectedArticle(null);
                }
            } else {
                toast.error(res.error || "Failed to purge votes");
            }
            setPendingPurgeArticle(null);
        });
    };

    const handleDeleteSingleVote = (articleId: string, voteId: string) => {
        startTransition(async () => {
            const res = await purgeArticleVotesAction({
                articleId,
                voteId,
            });
            if (res.success) {
                toast.success("Vote purged");
                setItems((prev) =>
                    prev
                        .map((a) => {
                            if (a.articleId !== articleId) return a;
                            const newVoters = a.voters.filter((v) => v.voteId !== voteId);
                            return {
                                ...a,
                                voteCount: newVoters.length,
                                voters: newVoters,
                            };
                        })
                        .filter((a) => a.voteCount > 0)
                );
                if (selectedArticle && selectedArticle.articleId === articleId) {
                    setSelectedArticle((prev) =>
                        prev
                            ? {
                                ...prev,
                                voteCount: prev.voteCount - 1,
                                voters: prev.voters.filter((v) => v.voteId !== voteId),
                            }
                            : null
                    );
                }
                setTotalVotes((prev) => prev - 1);
            } else {
                toast.error(res.error || "Failed to delete vote");
            }
        });
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={handleOpen}
                className="rounded-xl gap-1.5 text-xs font-semibold border-gray-200 dark:border-white/10"
            >
                <ThumbsUp size={14} className="text-primary" />
                Audit Helpful Votes
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <ThumbsUp size={18} className="text-primary" />
                                        Helpful Votes Radar & Anti-Spam
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Monitor article helpful votes, inspect burst velocity, and purge anomalous votes.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        {/* Summary Bar */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]">
                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Recorded Votes</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">
                                    {totalVotes}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]">
                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Voted Articles</span>
                                <span className="text-xl font-black text-primary mt-1 block">
                                    {items.length}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02] col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Spam Defense Status</span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block flex items-center gap-1">
                                    <CheckCircle2 size={14} /> One Vote Per User Enforced
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mt-4">
                            {isLoading ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <p className="text-xs text-gray-500">Auditing article votes...</p>
                                </div>
                            ) : items.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden divide-y divide-gray-200 dark:divide-white/10">
                                        {items.map((art) => (
                                            <div
                                                key={art.articleId}
                                                className="p-3.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                                            {art.articleTitle}
                                                        </h4>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                                                            {art.voteCount} {art.voteCount === 1 ? "Vote" : "Votes"}
                                                        </span>
                                                        {art.recentVoteCount24h > 3 && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                                                                <AlertTriangle size={12} /> High Velocity ({art.recentVoteCount24h} in 24h)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                                        /{art.articleSlug}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedArticle(art)}
                                                        className="rounded-lg h-7 px-2.5 text-xs font-semibold gap-1"
                                                    >
                                                        <Users size={12} /> Voters ({art.voters.length})
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePurgeArticle(art)}
                                                        disabled={isPending}
                                                        className="rounded-lg h-7 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/30 gap-1"
                                                    >
                                                        <Trash2 size={12} /> Purge All
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-gray-500">No article helpful votes recorded yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Voter Sub-Inspector Modal */}
                        {selectedArticle && (
                            <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                                        Voters for: <span className="text-primary">{selectedArticle.articleTitle}</span>
                                    </h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedArticle(null)}
                                        className="h-6 px-2 text-[10px] rounded-lg"
                                    >
                                        Close
                                    </Button>
                                </div>

                                <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-48 overflow-y-auto">
                                    {selectedArticle.voters.map((voter) => (
                                        <div
                                            key={voter.voteId}
                                            className="py-2 flex items-center justify-between text-xs"
                                        >
                                            <div>
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {voter.userName || voter.userEmail || "Anonymous User"}
                                                </span>
                                                <span className="text-[11px] text-gray-400 ml-2">
                                                    {format(new Date(voter.votedAt), "MMM d, yyyy HH:mm")}
                                                </span>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteSingleVote(selectedArticle.articleId, voter.voteId)
                                                }
                                                disabled={isPending}
                                                className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-md"
                                            >
                                                Purge Vote
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Purge All Dialog */}
            <ConfirmDialog
                isOpen={!!pendingPurgeArticle}
                title="Purge Article Helpful Votes?"
                description={`This will permanently remove all ${pendingPurgeArticle?.voteCount || 0} helpful votes recorded for "${pendingPurgeArticle?.articleTitle}". This action will be logged in the Admin Audit Log.`}
                confirmText="Purge Votes"
                variant="danger"
                isLoading={isPending}
                onConfirm={confirmPurgeArticle}
                onCancel={() => setPendingPurgeArticle(null)}
            />
        </>
    );
}
