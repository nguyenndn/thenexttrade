"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
    Settings, 
    Save, 
    ShieldAlert, 
    Bell, 
    MessageCircle,
    Loader2,
    ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import axios from "axios";

const settingsSchema = z.object({
    maintenanceMode: z.boolean(),
    autoApproveLicenses: z.boolean(),
    adminAlertEmail: z.string().email("Invalid email address").or(z.literal("")),
    sendUserWelcomeEmail: z.boolean(),
    telegramEnabled: z.boolean(),
    telegramBotToken: z.string().optional(),
    telegramChatId: z.string().optional(),
}).refine(data => {
    // Require bot token and chat ID if telegram is enabled
    if (data.telegramEnabled) {
        return !!data.telegramBotToken && !!data.telegramChatId;
    }
    return true;
}, {
    message: "Bot Token and Chat ID are required when Telegram is enabled",
    path: ["telegramEnabled"], 
});

type EASettingsForm = z.infer<typeof settingsSchema>;

export default function EASettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors, isValid }
    } = useForm<EASettingsForm>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            maintenanceMode: false,
            autoApproveLicenses: false,
            adminAlertEmail: "",
            sendUserWelcomeEmail: true,
            telegramEnabled: false,
            telegramBotToken: "",
            telegramChatId: "",
        },
        mode: "onChange"
    });

    const isTelegramEnabled = watch("telegramEnabled");

    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data } = await axios.get("/api/admin/ea/settings");
                reset(data);
            } catch (error) {
                toast.error("Failed to load settings");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [reset]);

    const onSubmit = async (data: EASettingsForm) => {
        setIsSaving(true);
        try {
            await axios.put("/api/admin/ea/settings", data);
            toast.success("Settings saved successfully!");
        } catch (error) {
            toast.error("Failed to save settings");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/ea" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0" title="Back to EA Dashboard">
                            <ArrowLeft size={20} className="text-gray-500" />
                        </Link>
                        <div className="w-1.5 h-8 bg-primary rounded-full shrink-0" aria-hidden="true"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            System Settings
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isSaving || !isValid}
                        className="flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4 mb-6">
                    <ShieldAlert className="text-red-500" size={20} />
                    General Configuration
                </h2>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Maintenance Mode</h3>
                            <p className="text-sm text-gray-500">Temporarily disable EA registration and API access.</p>
                        </div>
                        <Controller
                            control={control}
                            name="maintenanceMode"
                            render={({ field }) => (
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                />
                            )}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Auto-Approve Licenses</h3>
                            <p className="text-sm text-gray-500">Automatically grant access without admin review.</p>
                        </div>
                        <Controller
                            control={control}
                            name="autoApproveLicenses"
                            render={({ field }) => (
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4 mb-6">
                    <Bell className="text-blue-500" size={20} />
                    Email Notifications
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Admin Alert Email
                        </label>
                        <Input 
                            {...register("adminAlertEmail")}
                            placeholder="admin@example.com"
                            className="max-w-md"
                        />
                        {errors.adminAlertEmail && (
                            <p className="text-red-500 text-xs mt-1">{errors.adminAlertEmail.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Where to send new pending request alerts.</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Send Welcome Emails</h3>
                            <p className="text-sm text-gray-500">Notify users automatically when approved.</p>
                        </div>
                        <Controller
                            control={control}
                            name="sendUserWelcomeEmail"
                            render={({ field }) => (
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Telegram Webhook */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-sm mb-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4 mb-6">
                    <MessageCircle className="text-sky-500" size={20} />
                    Telegram Webhook
                </h2>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Enable Telegram Alerts</h3>
                            <p className="text-sm text-gray-500">Push notifications to a Telegram group or channel.</p>
                        </div>
                        <Controller
                            control={control}
                            name="telegramEnabled"
                            render={({ field }) => (
                                <Switch 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange} 
                                />
                            )}
                        />
                    </div>

                    {isTelegramEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Bot Token
                                </label>
                                <Input 
                                    {...register("telegramBotToken")}
                                    placeholder="123456789:ABCdefGHIjklMNO..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Chat ID
                                </label>
                                <Input 
                                    {...register("telegramChatId")}
                                    placeholder="-1001234567890"
                                />
                            </div>
                        </div>
                    )}
                    {errors.telegramEnabled && isTelegramEnabled && (
                        <p className="text-red-500 text-sm mt-2">{errors.telegramEnabled.message}</p>
                    )}
                </div>
            </div>
            
                <div className="py-4"></div>
            </form>
        </div>
    );
}
