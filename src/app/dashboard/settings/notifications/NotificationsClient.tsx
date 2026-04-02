"use client";

import { Bell, Mail, Smartphone, Shield, Radio } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function NotificationsClient() {
    const [toggles, setToggles] = useState({
        marketing_emails: true,
        security_alerts: true,
        trade_notifications: true,
        push_all: false,
        academy_updates: true
    });

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <Bell size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications Preferences</h2>
                        <p className="text-gray-600 text-sm">Manage how you receive updates and alerts.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Email Notifications */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Mail size={16} /> Email Notifications
                        </h3>
                        <div className="space-y-4">
                            <ToggleItem
                                title="Marketing & News"
                                description="Receive updates about new features, promotions, and news."
                                isOn={toggles.marketing_emails}
                                onToggle={() => handleToggle('marketing_emails')}
                            />
                            <ToggleItem
                                title="Security Alerts"
                                description="Get notified about logins from new devices or suspicious activity."
                                isOn={toggles.security_alerts}
                                onToggle={() => handleToggle('security_alerts')}
                            />
                            <ToggleItem
                                title="Academy Updates"
                                description="Weekly digest of your learning progress and recommended courses."
                                isOn={toggles.academy_updates}
                                onToggle={() => handleToggle('academy_updates')}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 my-4"></div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button className="px-6 py-2 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 border-none" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                        Save Preferences
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ title, description, isOn, onToggle }: { title: string, description: string, isOn: boolean, onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#2F80ED] transition-colors">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${isOn ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isOn ? 'left-6' : 'left-1'}`}></div>
            </div>
        </div>
    );
}
