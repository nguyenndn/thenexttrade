"use client";

import { useState, useTransition } from "react";
import { User, Bell, Lock, Globe, Save, Loader2, Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, updateSystemConfig } from "./actions";

interface SettingsPageClientProps {
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    };
    initialConfig: {
        maintenanceMode: boolean;
        userRegistration: boolean;
        siteTitle: string;
    };
}

export default function SettingsPageClient({ user, initialConfig }: SettingsPageClientProps) {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div className="flex flex-col gap-2">
                    <h1 className="sr-only">Settings</h1>
                <p className="text-base text-primary font-bold">
                        Manage account and system preferences.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    <NavButton
                        icon={User}
                        label="Profile Settings"
                        active={activeTab === "profile"}
                        onClick={() => setActiveTab("profile")}
                    />
                    <NavButton
                        icon={Lock}
                        label="Security"
                        active={activeTab === "security"}
                        onClick={() => setActiveTab("security")}
                    />
                    <NavButton
                        icon={Bell}
                        label="Notifications"
                        active={activeTab === "notifications"}
                        onClick={() => setActiveTab("notifications")}
                    />
                    <div className="my-4 h-[1px] bg-gray-200 dark:bg-white/10 mx-2"></div>
                    <NavButton
                        icon={Globe}
                        label="System Config"
                        active={activeTab === "system"}
                        onClick={() => setActiveTab("system")}
                    />
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-8 shadow-sm min-h-[500px]">
                        {activeTab === "profile" && <ProfileSettings user={user} />}
                        {activeTab === "security" && <SecuritySettings />}
                        {activeTab === "system" && <SystemSettings initialConfig={initialConfig} />}
                        {activeTab === "notifications" && (
                            <div className="text-center py-20 text-gray-400">
                                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Notification settings coming soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavButton({ icon: Icon, label, active, onClick }: any) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm h-auto ${active
                ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
        >
            <Icon size={18} />
            {label}
        </Button>
    );
}

import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";

function ProfileSettings({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user?.image || null
    );

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate File Size (1MB)
            if (file.size > 1 * 1024 * 1024) {
                toast.error('File size must be less than 1MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
                toast.success('Image selected!');
            };
            reader.readAsDataURL(file);
        }
    };

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await updateProfile(formData);
            if (result.success) {
                toast.success("Profile updated successfully!");
            } else {
                toast.error(result.error);
            }
        });
    }

    const [firstName, lastName] = (user.name || "").split(" ", 2);

    return (
        <form action={handleSubmit} className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Details</h3>
                <p className="text-sm text-gray-500">Update your personal information.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group cursor-pointer shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#0B0E14] border-2 border-dashed border-gray-300 dark:border-[#2F80ED]/30 flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors relative">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar Preview"
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full bg-indigo-500 text-white flex items-center justify-center text-3xl font-bold">
                                {user.name?.[0] || "U"}
                            </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="text-white" size={20} />
                        </div>
                    </div>
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleImageChange}
                    />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Profile Picture</h3>
                    <p className="text-xs text-gray-500">
                        Upload a high-quality image. <br className="hidden sm:block" />
                        JPG, GIF or PNG. Max size of 1MB.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <PremiumInput
                    label="First Name"
                    name="firstName"
                    defaultValue={firstName}
                />
                <PremiumInput
                    label="Last Name"
                    name="lastName"
                    defaultValue={lastName}
                />
                <div className="col-span-2">
                    <PremiumInput
                        label="Email Address"
                        type="email"
                        defaultValue={user.email}
                        disabled
                        className="cursor-not-allowed text-gray-500"
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <Button
                    disabled={isPending}
                    isLoading={isPending}
                    type="submit"
                    className="px-8 py-3 h-auto text-base"
                >
                    <Save size={20} className="mr-2" /> Save Changes
                </Button>
            </div>
        </form>
    );
}

function SecuritySettings() {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Security</h3>
                <p className="text-sm text-gray-500">Manage your password (Coming Soon).</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 p-4 rounded-xl text-sm font-medium">
                Password change is currently managed via the Login provider (Supabase Auth). Direct password update here requires re-authentication logic which is in development.
            </div>
        </div>
    );
}

function SystemSettings({ initialConfig }: { initialConfig: any }) {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        const config = {
            maintenanceMode: formData.get("maintenanceMode") === "on",
            userRegistration: formData.get("userRegistration") === "on",
            siteTitle: formData.get("siteTitle")
        };

        startTransition(async () => {
            const result = await updateSystemConfig(config);
            if (result.success) {
                toast.success("System configuration saved!");
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <form key={JSON.stringify(initialConfig)} action={handleSubmit} className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">System Configuration</h3>
                <p className="text-sm text-gray-500">Global settings for the platform.</p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Maintenance Mode</h4>
                        <p className="text-xs text-gray-500">Disable access for non-admin users.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input name="maintenanceMode" type="checkbox" className="sr-only peer" defaultChecked={initialConfig.maintenanceMode} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">User Registration</h4>
                        <p className="text-xs text-gray-500">Allow new users to sign up.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input name="userRegistration" type="checkbox" className="sr-only peer" defaultChecked={initialConfig.userRegistration} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="max-w-md">
                    <PremiumInput
                        label="Site Title"
                        name="siteTitle"
                        defaultValue={initialConfig.siteTitle}
                    />
                </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <Button
                    disabled={isPending}
                    isLoading={isPending}
                    type="submit"
                    className="px-8 py-3 h-auto text-base"
                >
                    <Save size={20} className="mr-2" /> Save Configuration
                </Button>
            </div>
        </form>
    );
}
