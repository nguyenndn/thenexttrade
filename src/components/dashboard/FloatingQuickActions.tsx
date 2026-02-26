"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import Link from "next/link";
import { Wallet, BarChart2, GraduationCap, X, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/Button";

const AnimatedGridIcon = ({ isOpen }: { isOpen: boolean }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.g
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "center" }}
            >
                {/* 4 rects of the grid */}
                <motion.rect rx="1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={false}
                    animate={{ x: isOpen ? 12 : 3.5, y: isOpen ? 12 : 3.5, width: isOpen ? 0 : 6.5, height: isOpen ? 0 : 6.5, opacity: isOpen ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />
                <motion.rect rx="1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={false}
                    animate={{ x: isOpen ? 12 : 14, y: isOpen ? 12 : 3.5, width: isOpen ? 0 : 6.5, height: isOpen ? 0 : 6.5, opacity: isOpen ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />
                <motion.rect rx="1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={false}
                    animate={{ x: isOpen ? 12 : 3.5, y: isOpen ? 12 : 14, width: isOpen ? 0 : 6.5, height: isOpen ? 0 : 6.5, opacity: isOpen ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />
                <motion.rect rx="1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={false}
                    animate={{ x: isOpen ? 12 : 14, y: isOpen ? 12 : 14, width: isOpen ? 0 : 6.5, height: isOpen ? 0 : 6.5, opacity: isOpen ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />

                {/* X lines */}
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
    )
}

export function FloatingQuickActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLeftAligned, setIsLeftAligned] = useState(false);
    const [isTopAligned, setIsTopAligned] = useState(false);
    
    // Save window dimensions in state to avoid hydration mismatch
    const [windowWidth, setWindowWidth] = useState(1000);
    const [windowHeight, setWindowHeight] = useState(1000);

    // Padding parameters
    const BUTTON_SIZE = 56; // 14 x 4px (w-14)
    const MARGIN = 24;      // bottom-6, right-6

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
        
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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

    const handleDragEnd = (event: any, info: any) => {
        const snapLeft = info.point.x < windowWidth / 2;
        const snapTop = info.point.y < windowHeight / 2;
        setIsLeftAligned(snapLeft);
        setIsTopAligned(snapTop);
        
        animate(x, snapLeft ? -(windowWidth - BUTTON_SIZE - MARGIN * 2) : 0, { type: "spring", stiffness: 300, damping: 20 });
    };

    if (!isMounted) return null;

    const actions = [
        {
            label: "Academy",
            icon: GraduationCap,
            href: "/academy",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            hoverBg: "hover:bg-purple-500/20",
        },
        {
            label: "Analytics",
            icon: BarChart2,
            href: "/dashboard/analytics",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            hoverBg: "hover:bg-blue-500/20",
        },
        {
            label: "Trading Accounts",
            icon: Wallet,
            href: "/dashboard/accounts",
            color: "text-primary",
            bg: "bg-primary/10",
            hoverBg: "hover:bg-primary/20",
        },
    ];

    return (
        <motion.div
            ref={containerRef}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={{ 
                left: -(windowWidth - BUTTON_SIZE - MARGIN * 2), // Max drag to the left
                right: 0, 
                top: -(windowHeight - BUTTON_SIZE - MARGIN * 2), // Max drag to the top
                bottom: 0 
            }}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.05, cursor: "grabbing" }}
            className={`fixed bottom-6 right-6 z-[9999] flex ${isTopAligned ? 'flex-col-reverse' : 'flex-col'} items-end gap-3 cursor-grab`}
            style={{ x, y, touchAction: "none" }} // Prevent scrolling while dragging on mobile
        >
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: isTopAligned ? -10 : 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: isTopAligned ? -10 : 10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isTopAligned ? 'flex-col-reverse' : 'flex-col'} gap-2 pointer-events-auto ${isLeftAligned ? 'items-start' : 'items-end'}`}
                    >
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.label}
                                initial={{ opacity: 0, x: isLeftAligned ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isLeftAligned ? -20 : 20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    href={action.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 rounded-2xl shadow-xl hover:shadow-2xl transition-all group ${isLeftAligned ? 'flex-row-reverse' : ''}`}
                                >
                                    <span className="font-bold text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        {action.label}
                                    </span>
                                    <div className={`p-2 rounded-xl ${action.bg} ${action.color} ${action.hoverBg} transition-colors`}>
                                        <action.icon size={18} />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                variant="primary"
                aria-label="Toggle Quick Actions"
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full !p-0 shadow-lg shadow-primary/30 flex items-center justify-center pointer-events-auto shrink-0"
            >
                <AnimatedGridIcon isOpen={isOpen} />
            </Button>
        </motion.div>
    );
}
