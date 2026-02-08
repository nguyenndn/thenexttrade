"use client";

import { useState } from "react";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { AuthUser } from "@/lib/auth-types";
import { User as UserIcon, Shield } from "lucide-react";

interface AccountSettingsTabsProps {
    user: AuthUser;
    profile: any;
}

// Tabs for switching between Profile and Security settings
export function AccountSettingsTabs({ user, profile }: AccountSettingsTabsProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    return (
        <div className="space-y-6">
            {/* Tabs Header */}
            <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit min-w-max">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'profile'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <UserIcon size={16} />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'security'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Shield size={16} />
                        Security
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'profile' ? (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <h2 className="text-xl font-bold border-b pb-4 mb-6 dark:border-white/10">Profile Information</h2>
                        <SettingsForm user={user} profile={profile} />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Security component handles its own internal title, but we can wrap or leave as is. 
                            SecuritySettings usually has 'Security' h2. We might want to visually align it.
                        */}
                        <SecuritySettings />
                    </div>
                )}
            </div>
        </div>
    );
}
