"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FeedbackPanel } from "./FeedbackPanel";

const AnimatedFeedbackIcon = ({ isOpen }: { isOpen: boolean }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.g
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "center" }}
            >
                {/* Chat bubble path (when closed) */}
                <motion.path
                    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={false}
                    animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.5 : 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />

                {/* X lines (when open) */}
                <motion.line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: isOpen ? 0.15 : 0, ease: "easeInOut" }}
                />
                <motion.line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    initial={false}
                    animate={{ pathLength: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: isOpen ? 0.15 : 0, ease: "easeInOut" }}
                />
            </motion.g>
        </svg>
    );
};

export function FloatingQuickActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [feedbackEnabled, setFeedbackEnabled] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
        fetch("/api/system/config")
            .then((res) => res.json())
            .then((data) => setFeedbackEnabled(data.feedbackEnabled ?? true))
            .catch(() => setFeedbackEnabled(true));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    if (!isMounted || !feedbackEnabled) return null;

    return (
        <div ref={containerRef}>
            <AnimatePresence>
                {isOpen && (
                    <FeedbackPanel
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-6 right-6 z-[9999]">
                <Button
                    variant="primary"
                    aria-label="Feedback & Support"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full !p-0 shadow-lg shadow-primary/30 flex items-center justify-center"
                >
                    <AnimatedFeedbackIcon isOpen={isOpen} />
                </Button>
            </div>
        </div>
    );
}
