"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { BookOpen, Hash } from "lucide-react";
import { useState } from "react";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    order: z.number().int().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateLevelModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateLevelModal({ isOpen, onClose }: CreateLevelModalProps) {
    const router = useRouter();
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
            const res = await fetch("/api/academy/levels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create level");

            toast.success("Level created successfully");
            router.refresh();
            reset();
            onClose();
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };



    // ... inside component

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Course Level">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <PremiumInput
                    label="Level Title"
                    {...register("title")}
                    placeholder="Level 1: Foundation"
                    error={errors.title?.message}
                    icon={BookOpen}
                    autoFocus
                />

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Description <span className="font-normal text-gray-400 normal-case">(Optional)</span>
                    </label>
                    <textarea
                        {...register("description")}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[100px] resize-none font-medium"
                        placeholder="Describe what students will learn in this level..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-bold rounded-xl px-6"
                    >Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="bg-primary hover:bg-[#00b078] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 font-bold hover:-translate-y-0.5 transition-all"
                    >
                        Create Level
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
