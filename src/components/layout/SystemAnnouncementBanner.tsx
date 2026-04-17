'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone, X } from 'lucide-react';
import { fetchSystemConfig } from '@/lib/cached-config';

const BANNER_HEIGHT = 40;

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

        fetchSystemConfig()
            .then((data) => {
                if (data.systemAnnouncement) {
                    setAnnouncement(data.systemAnnouncement);
                    setVisible(true);
                }
            });
    }, [isHiddenRoute]);

    // Set CSS variable so header knows to shift down
    useEffect(() => {
        const root = document.documentElement;
        const shouldShow = visible && !isHiddenRoute;
        root.style.setProperty('--banner-h', shouldShow ? `${BANNER_HEIGHT}px` : '0px');
        return () => root.style.setProperty('--banner-h', '0px');
    }, [visible, isHiddenRoute]);

    const dismiss = () => {
        setVisible(false);
    };

    if (!visible || !announcement || isHiddenRoute) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[70] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg shadow-amber-500/20"
            style={{ height: BANNER_HEIGHT }}
        >
            <div className="flex items-center justify-center gap-2.5 h-full max-w-6xl mx-auto px-12 relative">
                <Megaphone size={15} className="flex-shrink-0 animate-bounce" style={{ animationDuration: '2s' }} />
                <span className="text-sm font-semibold truncate">{announcement}</span>
                <button
                    onClick={dismiss}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Dismiss announcement"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
