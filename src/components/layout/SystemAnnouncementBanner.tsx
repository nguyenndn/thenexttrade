'use client';

import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';

export function SystemAnnouncementBanner() {
    const [announcement, setAnnouncement] = useState('');
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        fetch('/api/system/config')
            .then((res) => res.json())
            .then((data) => {
                if (data.systemAnnouncement) {
                    setAnnouncement(data.systemAnnouncement);
                }
            })
            .catch(() => {});
    }, []);

    if (!announcement || dismissed) return null;

    return (
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-center text-sm font-medium shadow-sm z-50">
            <div className="flex items-center justify-center gap-2 max-w-5xl mx-auto">
                <Megaphone size={16} className="flex-shrink-0" />
                <span>{announcement}</span>
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Dismiss announcement"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
