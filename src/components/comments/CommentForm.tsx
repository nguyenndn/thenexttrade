"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
    content: z
        .string()
        .trim()
        .min(2, "Comment must be at least 2 characters long")
        .max(2000, "Comment cannot exceed 2000 characters"),
});

type FormData = z.infer<typeof schema>;

interface CommentFormProps {
    articleId: string;
    parentId?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    userName?: string | null;
    userImage?: string | null;
}

export function CommentForm({
    articleId,
    parentId = null,
    onSuccess,
    onCancel,
    placeholder = "Add to the discussion...",
    autoFocus = false,
    userName = null,
    userImage = null,
}: CommentFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            content: "",
        },
    });

    const contentVal = watch("content") || "";

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/articles/${articleId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: data.content,
                    parentId,
                }),
            });

            if (res.status === 401) {
                toast.error("Please login to comment");
                window.location.href = "/auth/login";
                return;
            }

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to post comment");
            }

            toast.success("Comment posted!");
            reset();
            onSuccess?.();
        } catch (error: any) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "Something went wrong"
            );
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="bg-white dark:bg-[#12141c] border border-dashboard rounded-2xl shadow-sm focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/15 transition-all duration-200 overflow-hidden">
                {/* Header Bar: User Identity & Character Counter */}
                {userName && (
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50/80 dark:bg-white/[0.02] border-b border-dashboard">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-gold/40 bg-gray-100 dark:bg-white/10 shrink-0">
                                {userImage ? (
                                    <Image
                                        src={userImage}
                                        alt={userName}
                                        fill
                                        className="object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gold font-bold text-xs bg-gold/10">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                    {userName}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Verified Trader</span>
                                </span>
                            </div>
                        </div>

                        <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 shrink-0">
                            {contentVal.length} / 2000
                        </span>
                    </div>
                )}

                {/* Textarea: Seamless inside card without double borders */}
                <div className="p-4 sm:p-5">
                    <textarea
                        {...register("content")}
                        className="w-full min-h-[90px] sm:min-h-[110px] bg-transparent border-0 resize-none outline-none focus:ring-0 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed"
                        placeholder={
                            parentId
                                ? placeholder
                                : "Share your trading perspective, risk analysis, or ask a question..."
                        }
                        autoFocus={autoFocus}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                e.preventDefault();
                                handleSubmit(onSubmit)();
                            }
                        }}
                    />
                </div>

                {/* Integrated Action Toolbar */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50/50 dark:bg-white/[0.015] border-t border-dashboard">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <span className="hidden sm:inline font-medium text-[11px]">
                            Press
                        </span>
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-white/5 border border-dashboard rounded-md text-gray-500">
                            Ctrl + Enter
                        </kbd>
                        <span className="hidden sm:inline text-[11px]">
                            to submit
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                size="smd"
                                onClick={onCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        )}

                        <Button
                            type="submit"
                            variant="gold"
                            size="smd"
                            disabled={isLoading || contentVal.trim().length < 2}
                            isLoading={isLoading}
                        >
                            <span>
                                {parentId ? "Reply" : "Post Comment"}
                            </span>
                            {!isLoading && (
                                <SendHorizontal
                                    size={14}
                                    className="stroke-[2.5]"
                                />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {errors.content && (
                <p className="mt-2 text-red-500 text-xs font-semibold px-1">
                    {errors.content.message}
                </p>
            )}
        </form>
    );
}
