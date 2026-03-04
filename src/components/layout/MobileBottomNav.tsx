"use client";

import { useState, useEffect } from "react";
import { List, Share2, MessageSquare, ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function MobileBottomNav({
    onOpenTOC,
    onScrollTop
}: {
    onOpenTOC?: () => void,
    onScrollTop?: () => void
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Auto-hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToComments = () => {
        document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1E2028] border-t border-gray-200 dark:border-white/10 px-6 py-3 transition-transform duration-300 transform lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex justify-between items-center max-w-md mx-auto">
                <Button variant="ghost" onClick={onOpenTOC} className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary active:text-primary active:scale-95 transition-all hover:bg-transparent">
                    <List size={20} />
                    <span className="text-[10px] font-bold uppercase">Contents</span>
                </Button>

                <Button variant="ghost" onClick={() => {
                    // Trigger simple native share if available
                    if (navigator.share) {
                        navigator.share({ title: document.title, url: window.location.href });
                    } else {
                        // Fallback or just ignore
                        alert("Use desktop or browser menu to share!");
                    }
                }} className="flex flex-col h-auto w-auto items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary active:text-primary active:scale-95 transition-all p-2 hover:bg-transparent">
                    <Share2 size={20} />
                    <span className="text-[10px] font-bold uppercase">Share</span>
                </Button>

                <Button variant="ghost" onClick={scrollToComments} className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary active:text-primary active:scale-95 transition-all hover:bg-transparent">
                    <MessageSquare size={20} />
                    <span className="text-[10px] font-bold uppercase">Discuss</span>
                </Button>

                <Button variant="ghost" onClick={scrollToTop} className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary active:text-primary active:scale-95 transition-all hover:bg-transparent">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                        <ArrowUp size={16} />
                    </div>
                </Button>
            </div>
        </div>
    );
}
