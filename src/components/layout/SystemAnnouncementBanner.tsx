'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Only show on public pages + user dashboard, NOT on admin
const HIDDEN_PREFIXES = ['/admin', '/auth', '/onboarding'];

export function SystemAnnouncementBanner() {
    const pathname = usePathname();
    const [announcement, setAnnouncement] = useState('');
    const [visible, setVisible] = useState(false);

    // Hide on admin/auth pages
    const isHiddenRoute = HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix));

    useEffect(() => {
        if (isHiddenRoute) return;

        // Check if user already dismissed this specific announcement in this session
        const dismissedAnnouncement = sessionStorage.getItem('dismissed_announcement');

        fetch('/api/system/config')
            .then((res) => res.ok ? res.json() : { systemAnnouncement: '' })
            .then((data) => {
                if (data.systemAnnouncement && dismissedAnnouncement !== data.systemAnnouncement) {
                    setAnnouncement(data.systemAnnouncement);
                    setVisible(true);
                }
            })
            .catch(() => {});
    }, [isHiddenRoute, pathname]); // Re-check if it changes, but respect sessionStorage

    const dismiss = () => {
        setVisible(false);
        if (announcement) {
            sessionStorage.setItem('dismissed_announcement', announcement);
        }
    };

    if (!visible || !announcement || isHiddenRoute) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Decorative header */}
                <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
                
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Dismiss announcement"
                >
                    <X size={18} />
                </button>

                <div className="p-6 sm:p-8 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4">
                        <Megaphone size={24} className="text-amber-600 dark:text-amber-500 animate-pulse" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        System Announcement
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap">
                        {announcement}
                    </p>

                    <Button onClick={dismiss} className="w-full sm:w-auto px-8 bg-amber-500 hover:bg-amber-600 text-white">
                        Got it, thanks!
                    </Button>
                </div>
            </div>
        </div>
    );
}
