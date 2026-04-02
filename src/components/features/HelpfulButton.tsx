"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

interface HelpfulButtonProps {
    articleId: string;
    vertical?: boolean;
}

export function HelpfulButton({ articleId, vertical = false }: HelpfulButtonProps) {
    const [voted, setVoted] = useState(false);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    // Fetch initial state
    useEffect(() => {
        fetch(`/api/articles/${articleId}/vote`)
            .then(res => res.json())
            .then(data => {
                setVoted(data.voted);
                setCount(data.count);
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [articleId]);

    const handleToggle = useCallback(async () => {
        if (isToggling) return;

        // Optimistic update
        const prevVoted = voted;
        const prevCount = count;
        setVoted(!voted);
        setCount(voted ? count - 1 : count + 1);
        setIsToggling(true);

        try {
            const res = await fetch(`/api/articles/${articleId}/vote`, {
                method: "POST"
            });

            if (!res.ok) {
                if (res.status === 401) {
                    // Revert + show login hint
                    setVoted(prevVoted);
                    setCount(prevCount);
                    toast.error("Please log in to mark articles as helpful");
                    return;
                }
                throw new Error("Failed to vote");
            }

            const data = await res.json();
            setVoted(data.voted);
            setCount(data.count);
        } catch {
            // Revert on error
            setVoted(prevVoted);
            setCount(prevCount);
            toast.error("Something went wrong");
        } finally {
            setIsToggling(false);
        }
    }, [articleId, voted, count, isToggling]);

    if (isLoading) {
        if (vertical) {
            return <div className="w-[52px] h-[52px] rounded-full bg-gray-100 dark:bg-white/5 animate-pulse" />;
        }
        return (
            <div className="flex items-center gap-2 h-10 px-5 rounded-full bg-gray-100 dark:bg-white/5 animate-pulse w-36" />
        );
    }

    // Vertical (sidebar) layout — compact circle matching SocialShare style
    if (vertical) {
        return (
            <div className="flex flex-col items-center gap-1.5">
                <Button
                    variant="ghost"
                    onClick={handleToggle}
                    disabled={isToggling}
                    className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-all duration-300 active:scale-90 disabled:opacity-70 p-0 ${
                        voted
                            ? "bg-primary/10 dark:bg-primary/15 border-primary/30 text-primary hover:bg-primary/15"
                            : "bg-white dark:bg-[#1E2028] border-gray-100 dark:border-white/5 text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-white"
                    }`}
                    title={voted ? "Remove your vote" : "Mark as helpful"}
                    aria-label={voted ? "Remove your vote" : "Mark as helpful"}
                >
                    <ThumbsUp
                        size={20}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 ${voted ? "fill-primary" : "hover:scale-110"}`}
                    />
                </Button>
                {count > 0 && (
                    <span className={`text-xs font-bold tabular-nums ${voted ? "text-primary" : "text-gray-600 dark:text-gray-300"}`}>
                        {count}
                    </span>
                )}
            </div>
        );
    }

    // Horizontal (inline) layout
    return (
        <Button
            variant="ghost"
            onClick={handleToggle}
            disabled={isToggling}
            className={`group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border-2 active:scale-95 disabled:opacity-70 ${
                voted
                    ? "bg-primary/10 dark:bg-primary/15 border-primary/30 text-primary hover:bg-primary/15 dark:hover:bg-primary/20"
                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
            }`}
            title={voted ? "Remove your vote" : "Mark as helpful"}
        >
            <ThumbsUp
                size={16}
                strokeWidth={2.5}
                className={`transition-transform duration-300 ${voted ? "fill-primary" : "group-hover:scale-110"}`}
            />
            <span>{voted ? "Helpful" : "Helpful"}</span>
            {count > 0 && (
                <>
                    <span className="w-px h-4 bg-current opacity-20" />
                    <span className="tabular-nums">{count}</span>
                </>
            )}
        </Button>
    );
}
