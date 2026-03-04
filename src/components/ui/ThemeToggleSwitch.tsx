"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function ThemeToggleSwitch() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-transparent" />;
    }

    const isDark = theme === "dark";

    return (
        <Button
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`
                relative w-9 h-9 p-0 flex items-center justify-center rounded-full transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-[#00C888]/50
                ${isDark 
                    ? 'bg-slate-800/80 border-2 border-slate-700 text-blue-400 hover:bg-slate-700/80 hover:text-blue-400' 
                    : 'bg-white border-2 border-gray-200 text-amber-500 hover:bg-gray-50 hover:text-amber-500'
                }
            `}
        >
            <div className={`absolute transition-all duration-300 ${isDark ? 'scale-0 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'}`}>
                {/* Sun Design - Visible in Light Mode */}
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            </div>

            <div className={`absolute transition-all duration-300 ${isDark ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'}`}>
                {/* Moon Design - Visible in Dark Mode */}
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
            </div>
        </Button>
    );
}
