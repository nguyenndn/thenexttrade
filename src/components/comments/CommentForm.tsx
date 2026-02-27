"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
// import { useAuth } from "@/hooks/useAuth";
// Actually checking useAuth might be complex if not readily available.
// I'll stick to simple prop based 'user' or just check if submit fails.
// Better: Check if user passes in 'user' prop or handle unauth state.
// Since this is a client component, I might need a way to know if user is logged in.
// For now, I'll assume the parent passes `user` or handles auth check, OR just show login prompt if API 401s.

const schema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
});

type FormData = z.infer<typeof schema>;

interface CommentFormProps {
    articleId: string;
    parentId?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function CommentForm({
    articleId,
    parentId = null,
    onSuccess,
    onCancel,
    placeholder = "Add to the discussion...",
    autoFocus = false
}: CommentFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Quick auth check handled by API response mostly, but nice to disable if not logged in.
    // For now, let's allow typing and prompt on submit if needed or let API fail.

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/articles/${articleId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: data.content,
                    parentId
                }),
            });

            if (res.status === 401) {
                toast.error("Please login to comment");
                // TODO: Redirect to login
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
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="relative">
            <div className="relative">
                <textarea
                    {...register("content")}
                    className="w-full min-h-[100px] p-4 pr-12 rounded-xl bg-gray-50 dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    disabled={isLoading}
                />

                {isLoading ? (
                    <div className="absolute right-3 bottom-3 text-primary">
                        <Loader2 className="animate-spin" size={20} />
                    </div>
                ) : (
                    <button
                        type="submit"
                        className="absolute right-3 bottom-3 p-2 bg-primary hover:bg-[#00B078] text-white rounded-lg shadow-lg shadow-primary/30 transition-all active:translate-y-0"
                    >
                        <Send size={16} />
                    </button>
                )}
            </div>

            {(errors.content || onCancel) && (
                <div className="flex justify-between items-center mt-2">
                    <p className="text-red-500 text-xs">{errors.content?.message}</p>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}
        </form>
    );
}
