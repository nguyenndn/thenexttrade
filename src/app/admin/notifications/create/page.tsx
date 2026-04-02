
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2, Send, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { createBroadcast } from "@/app/admin/notifications/actions";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { z } from "zod";

const formSchema = z.object({
    title: z.string().min(1, "Required"),
    message: z.string().min(1, "Required"),
    type: z.nativeEnum(NotificationType),
    priority: z.nativeEnum(NotificationPriority),
    link: z.string().optional(),
    sendAt: z.string().optional(), // Date string from input
});

export default function CreateBroadcastPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: NotificationType.ANNOUNCEMENT,
            priority: NotificationPriority.NORMAL,
        }
    });

    const typeValue = watch("type");
    const priorityValue = watch("priority");

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                sendAt: data.sendAt ? new Date(data.sendAt) : undefined,
            };
            const result = await createBroadcast(payload);

            if (result.success) {
                toast.success("Broadcast created successfully");
                router.push("/admin/notifications");
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "An error occurred"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create Broadcast
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Send a system-wide notification to all users.
                </p>
            </div>

            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <PremiumInput
                            label="Title"
                            {...register("title")}
                            placeholder="System Maintenance"
                            error={errors.title ? "Required" : undefined}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Message</label>
                        <textarea
                            {...register("message")}
                            rows={4}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-3 text-sm text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                            placeholder="We will be performing scheduled maintenance on..."
                        />
                        {errors.message && <p className="text-xs text-red-500">Required</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-2.5 h-auto text-sm outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-900 dark:text-white font-medium capitalize"
                                    >
                                        <span>{typeValue.toLowerCase()}</span>
                                        <ChevronDown size={14} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                    {Object.values(NotificationType).map((t: string) => (
                                        <DropdownMenuItem key={t} onClick={() => setValue("type", t as any)} className="capitalize">
                                            {t.toLowerCase()}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Priority</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] p-2.5 h-auto text-sm outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-900 dark:text-white font-medium capitalize"
                                    >
                                        <span>{priorityValue.toLowerCase()}</span>
                                        <ChevronDown size={14} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                    {Object.values(NotificationPriority).map((p: string) => (
                                        <DropdownMenuItem key={p} onClick={() => setValue("priority", p as any)} className="capitalize">
                                            {p.toLowerCase()}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <PremiumInput
                            label="Link (Optional)"
                            {...register("link")}
                            placeholder="/dashboard/..."
                        />
                    </div>

                    <div className="space-y-2">
                        <PremiumInput
                            label="Schedule (Optional)"
                            type="datetime-local"
                            {...register("sendAt")}
                            icon={Calendar}
                        />
                        <p className="text-xs text-gray-400">Leave blank to send immediately.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" variant="primary" className="bg-primary hover:bg-[#00B078] text-white" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send className="mr-2" size={18} />}
                            {isSubmitting ? "Sending..." : "Send Broadcast"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
