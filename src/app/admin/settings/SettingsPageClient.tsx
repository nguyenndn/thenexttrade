"use client";

import { useState, useTransition } from "react";
import { User, Bell, Lock, Globe, Save, Loader2, Camera, Upload, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, updateSystemConfig } from "./actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

const tabs = [
    { key: "profile", label: "Profile Settings", icon: User },
    { key: "security", label: "Security", icon: Lock },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "system", label: "System Config", icon: Globe },
];

export default function SettingsPageClient({ user, initialConfig }: SettingsPageClientProps) {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <div className="space-y-0 pb-10">
            <AdminPageHeader
                title="Settings"
                description="Manage account and system preferences."
            />

            {/* ── Horizontal Tab Nav ── */}
            <div className="mt-6 border-b border-gray-200 dark:border-white/10">
                <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* ── Content Area ── */}
            <div className="pt-6">
                {activeTab === "profile" && <ProfileSettings user={user} />}
                {activeTab === "security" && <SecuritySettings />}
                {activeTab === "system" && <SystemSettings initialConfig={initialConfig} />}
                {activeTab === "notifications" && (
                    <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
                        <div className="text-center py-20 text-gray-400">
                            <Bell size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Notification settings coming soon.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Profile Settings — Hero card + Personal info
   ───────────────────────────────────────────── */
function ProfileSettings({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user?.image || null
    );

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
        <form action={handleSubmit} className="space-y-5">
            {/* ── Profile Picture Card with gradient hero ── */}
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                {/* Gradient banner */}
                <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent dark:from-primary/30 dark:via-primary/15 dark:to-transparent relative">
                    <div className="absolute inset-0 opacity-30"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #00C888 0%, transparent 60%)' }} />
                </div>

                <div className="px-6 pb-5">
                    {/* Avatar overlapping banner */}
                    <div className="flex items-end gap-4 -mt-10 mb-4">
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0B0E14] border-4 border-white dark:border-[#151925] shadow-lg">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/80 text-white flex items-center justify-center text-3xl font-bold">
                                        {user.name?.[0] || "U"}
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors cursor-pointer">
                                <Camera size={13} className="text-white" />
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>
                        <div className="pb-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'Admin'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">JPG, PNG or GIF · Max 1MB · Recommended 400×400px</p>
                </div>
            </div>

            {/* ── Personal Info Card ── */}
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    </div>
                    <PremiumInput
                        label="Email Address"
                        type="email"
                        defaultValue={user.email}
                        disabled
                        className="cursor-not-allowed text-gray-500"
                    />
                </div>

                {/* Save Button */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-white/8 flex justify-end">
                    <Button
                        disabled={isPending}
                        isLoading={isPending}
                        type="submit"
                    >
                        <Save size={16} className="mr-2" /> Save Changes
                    </Button>
                </div>
            </div>
        </form>
    );
}

/* ─────────────────────────────────────────────
   Security Settings
   ───────────────────────────────────────────── */
function SecuritySettings() {
    return (
        <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <Lock size={14} className="text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Security</h2>
            </div>
            <div className="px-6 py-6">
                <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 p-4 rounded-xl text-sm font-medium">
                    Password change is currently managed via the Login provider (Supabase Auth). Direct password update here requires re-authentication logic which is in development.
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   System Settings
   ───────────────────────────────────────────── */
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
        <form key={JSON.stringify(initialConfig)} action={handleSubmit} className="space-y-5">
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <Globe size={14} className="text-primary" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">System Configuration</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10">
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Maintenance Mode</h4>
                            <p className="text-xs text-gray-500">Disable access for non-admin users.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input name="maintenanceMode" type="checkbox" className="sr-only peer" defaultChecked={initialConfig.maintenanceMode} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10">
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">User Registration</h4>
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

                <div className="px-6 py-4 border-t border-gray-100 dark:border-white/8 flex justify-end">
                    <Button
                        disabled={isPending}
                        isLoading={isPending}
                        type="submit"
                    >
                        <Save size={16} className="mr-2" /> Save Configuration
                    </Button>
                </div>
            </div>
        </form>
    );
}
