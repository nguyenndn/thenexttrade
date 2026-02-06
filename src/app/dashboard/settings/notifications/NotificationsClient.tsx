"use client";

import { Bell, Mail, Smartphone, Shield, Radio } from 'lucide-react';
import { useState } from 'react';

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
            <div className="bg-white dark:bg-[#0B0E14] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <Bell size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications Preferences</h2>
                        <p className="text-gray-500 text-sm">Manage how you receive updates and alerts.</p>
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

                    <div className="border-t border-gray-100 dark:border-white/5 my-4"></div>

                    {/* Push Notifications */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Smartphone size={16} /> Push Notifications
                        </h3>
                        <div className="space-y-4">
                            <ToggleItem
                                title="Trade Executions"
                                description="Instant alerts when your TP or SL is hit."
                                isOn={toggles.trade_notifications}
                                onToggle={() => handleToggle('trade_notifications')}
                            />
                            <ToggleItem
                                title="Enable All Push Notifications"
                                description="Turn on all push notifications for mobile devices."
                                isOn={toggles.push_all}
                                onToggle={() => handleToggle('push_all')}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button className="px-6 py-2 bg-[#00C888] hover:bg-[#00b078] text-white font-bold rounded-xl transition-all shadow-lg active:scale-95">
                        Save Preferences
                    </button>
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
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${isOn ? 'bg-[#00C888]' : 'bg-gray-200 dark:bg-white/10'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isOn ? 'left-6' : 'left-1'}`}></div>
            </div>
        </div>
    );
}
