"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
    replyToName?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
    userName?: string | null;
    userImage?: string | null;
    isAuthenticated?: boolean;
}

export function CommentForm({
    articleId,
    parentId = null,
    replyToName = null,
    onSuccess,
    onCancel,
    autoFocus = false,
    userName = null,
    userImage = null,
    isAuthenticated = true,
}: CommentFormProps) {
    const router = useRouter();
    const pathname = usePathname();
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

    const redirectToLogin = () => {
        const nextTarget = encodeURIComponent(
            `${pathname || `/articles/${articleId}`}#comment-form-box`
        );
        router.push(`/auth/login?next=${nextTarget}`);
    };

    const onSubmit = async (data: FormData) => {
        if (!isAuthenticated) {
            redirectToLogin();
            return;
        }

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
                toast.error("Please log in to post a comment");
                redirectToLogin();
                return;
            }

            if (!res.ok) {
                const errPayload: { error?: string; message?: string } | null =
                    await res.json().catch(() => null);
                throw new Error(
                    errPayload?.error ||
                        errPayload?.message ||
                        "Failed to post comment"
                );
            }

            toast.success("Comment posted!");
            reset();
            onSuccess?.();
        } catch (error: unknown) {
            toast.error(
                error instanceof Error ? error.message : "Something went wrong"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="bg-white dark:bg-[#12141c] border border-dashboard rounded-xl shadow-sm focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/15 transition-all duration-200 overflow-hidden">
                {/* Header Bar: User Identity & Character Counter */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50/80 dark:bg-white/[0.02] border-b border-dashboard">
                    {userName ? (
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
                    ) : (
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {replyToName
                                ? `Reply to ${replyToName}`
                                : "Your Comment"}
                        </span>
                    )}

                    <span className="text-[11px] font-mono tabular-nums text-gray-400 dark:text-gray-500 shrink-0">
                        {contentVal.length} / 2000
                    </span>
                </div>

                {/* Textarea: Seamless inside card without double borders */}
                <div className="p-4 sm:p-5 space-y-1.5">
                    <label
                        htmlFor={`comment-input-${parentId || "root"}`}
                        className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400"
                    >
                        {replyToName
                            ? `Replying to ${replyToName}`
                            : "Share your trading perspective, risk math, or question"}
                    </label>
                    <textarea
                        id={`comment-input-${parentId || "root"}`}
                        {...register("content")}
                        className="w-full min-h-[90px] sm:min-h-[110px] bg-transparent border-0 resize-none outline-none focus:ring-0 text-sm text-gray-800 dark:text-gray-100 leading-relaxed"
                        autoFocus={autoFocus}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                e.preventDefault();
                                if (!isAuthenticated) {
                                    redirectToLogin();
                                    return;
                                }
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
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-white/5 border border-dashboard rounded-lg text-gray-500">
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

                        {isAuthenticated ? (
                            <Button
                                type="submit"
                                variant="gold"
                                size="smd"
                                disabled={
                                    isLoading || contentVal.trim().length < 2
                                }
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
                        ) : (
                            <Button
                                type="button"
                                variant="gold"
                                size="smd"
                                onClick={redirectToLogin}
                            >
                                <span>
                                    {parentId ? "Reply" : "Post Comment"}
                                </span>
                                <SendHorizontal
                                    size={14}
                                    className="stroke-[2.5]"
                                />
                            </Button>
                        )}
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
