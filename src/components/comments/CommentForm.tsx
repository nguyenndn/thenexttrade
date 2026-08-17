"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SendHorizontal, Loader2, User, Mail, ShieldCheck } from "lucide-react";
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Premium User Information Bar */}
            {userName && (
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-dashboard">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20 dark:ring-primary/30 p-0.5 bg-gray-100 dark:bg-white/5 flex-shrink-0">
                            {userImage ? (
                                <Image
                                    src={userImage}
                                    alt={userName}
                                    fill
                                    className="object-cover rounded-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs bg-primary/10 rounded-full">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                Posting as
                            </span>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                {userName}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] uppercase font-extrabold tracking-wider border border-emerald-500/20">
                                <ShieldCheck
                                    size={10}
                                    className="stroke-[2.5]"
                                />
                                Authorized
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative group">
                <textarea
                    {...register("content")}
                    className="w-full min-h-[120px] p-5 rounded-2xl bg-white dark:bg-[#12141c] border border-dashboard focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none outline-none text-gray-700 dark:text-gray-100 placeholder:text-gray-500 text-[14px] leading-relaxed shadow-inner"
                    placeholder={
                        parentId
                            ? placeholder
                            : "Share your thoughts, analyze trends, or join the discussion..."
                    }
                    autoFocus={autoFocus}
                    disabled={isLoading}
                />

                {/* Character count floating tag */}
                <div className="absolute bottom-4 right-4 text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#161822] px-2 py-1 rounded-lg border border-dashboard">
                    {contentVal.length} / 2000
                </div>
            </div>

            {/* Render guest Name & Email inputs ONLY if they are not logged in and parentId is absent */}
            {!userName && !parentId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-gray-500 pointer-events-none">
                            <User size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Your Name"
                            disabled
                            className="w-full pl-11 pr-5 py-3 rounded-2xl bg-gray-50 dark:bg-[#12141c]/50 border border-dashboard outline-none text-gray-400 dark:text-gray-500 placeholder:text-gray-500 text-[14px] cursor-not-allowed"
                            value="Authenticated Session Required"
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-gray-500 pointer-events-none">
                            <Mail size={16} />
                        </span>
                        <input
                            type="email"
                            placeholder="Your Email Address"
                            disabled
                            className="w-full pl-11 pr-5 py-3 rounded-2xl bg-gray-50 dark:bg-[#12141c]/50 border border-dashboard outline-none text-gray-400 dark:text-gray-500 placeholder:text-gray-500 text-[14px] cursor-not-allowed"
                            value="Registered Accounts Only"
                        />
                    </div>
                </div>
            )}

            {errors.content && (
                <p className="text-red-500 text-xs font-semibold px-2">
                    {errors.content.message}
                </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-4 py-2 h-auto hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all duration-200"
                    >
                        Cancel
                    </Button>
                )}

                <Button
                    type="submit"
                    disabled={isLoading || contentVal.trim().length < 2}
                    className="rounded-full px-6 py-2.5 bg-primary hover:bg-[#00B078] disabled:bg-gray-100 disabled:dark:bg-white/5 disabled:text-gray-400 disabled:dark:text-gray-600 disabled:shadow-none text-white font-bold text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={14} />
                    ) : (
                        <>
                            <span>{parentId ? "Reply" : "Post Comment"}</span>
                            <SendHorizontal
                                size={13}
                                className="stroke-[2.5]"
                            />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
