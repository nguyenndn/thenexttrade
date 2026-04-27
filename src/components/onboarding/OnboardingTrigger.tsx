"use client";

import { useOnborda } from "onborda";
import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { tourMap } from "./tours";

const ONBOARDING_PREFIX = "onboarding-done-";

export function OnboardingTrigger() {
    const { startOnborda, closeOnborda } = useOnborda();
    const pathname = usePathname();
    const [hasMounted, setHasMounted] = useState(false);

    // Resolve current tour based on URL
    const currentTour = tourMap[pathname] || null;

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Auto-start tour for first-time visitors on this specific page
    useEffect(() => {
        if (!hasMounted || !currentTour) return;

        const storageKey = ONBOARDING_PREFIX + currentTour;
        const done = localStorage.getItem(storageKey);

        if (!done) {
            const timer = setTimeout(() => {
                startOnborda(currentTour);
                localStorage.setItem(storageKey, "true");
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [hasMounted, currentTour, startOnborda]);

    const handleStart = () => {
        if (!currentTour) return;
        startOnborda(currentTour);
    };

    if (!currentTour) return null;

    return (
        <button
            onClick={handleStart}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            title="Start product tour"
        >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Tour</span>
        </button>
    );
}
