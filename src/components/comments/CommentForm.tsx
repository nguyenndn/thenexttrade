"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { SendHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
// import { useAuth } from "@/hooks/useAuth";
// Actually checking useAuth might be complex if not readily available.
// I'll stick to simple prop based 'user' or just check if submit fails.
// Better: Check if user passes in 'user' prop or handle unauth state.
// Since this is a client component, I might need a way to know if user is logged in.
// For now, I'll assume the parent passes `user` or handles auth check, OR just show login prompt if API 401s.

const schema = z.object({
    content: z.string()
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
}

export function CommentForm({
    articleId,
    parentId = null,
    onSuccess,
    onCancel,
    placeholder = "Add to the discussion...",
    autoFocus = false,
    userName = null
}: CommentFormProps) {
    const [isLoading, setIsLoading] = useState(false);

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
            toast.error(error instanceof Error ? error.message : (error?.message || "Something went wrong"));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <textarea
                {...register("content")}
                className="w-full min-h-[140px] p-5 rounded-2xl bg-gray-100 dark:bg-white/5 border-0 focus:ring-2 focus:ring-primary/30 transition-all resize-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 text-[15px]"
                placeholder={parentId ? placeholder : "Share your thoughts..."}
                autoFocus={autoFocus}
                disabled={isLoading}
            />

            {!parentId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="Name"
                        defaultValue={userName || ""}
                        readOnly={!!userName}
                        className="w-full px-5 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 border-0 focus:ring-2 focus:ring-primary/30 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 text-[15px]"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-5 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 border-0 focus:ring-2 focus:ring-primary/30 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 text-[15px]"
                    />
                </div>
            )}

            {errors.content && (
                <p className="text-red-500 text-xs">{errors.content.message}</p>
            )}

            <div className="flex items-center justify-end gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        Cancel
                    </Button>
                )}

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full px-7 py-2.5 bg-primary hover:bg-[#00B078] text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                    ) : (
                        <>Send</>
                    )}
                </Button>
            </div>
        </form>
    );
}
