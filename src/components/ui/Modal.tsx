"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
    SPRING_SOFT,
    backdropVariants,
    panelVariants,
} from "@/lib/animations";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}

export function Modal({ isOpen, onClose, title, children, className, bodyClassName }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        // Cleanup removes only the keydown listener — NOT the scroll lock,
        // which is released by AnimatePresence onExitComplete (after exit).
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Safety net: never leak a locked body if this component unmounts while open.
    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const releaseLock = () => {
        document.body.style.overflow = "unset";
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence onExitComplete={releaseLock}>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className={cn(
                            "relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#151925] shadow-xl border border-dashboard cursor-default",
                            className
                        )}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-dashboard flex-shrink-0">
                            <h3 className="text-base sm:text-lg font-bold font-sans tracking-tight text-gray-700 dark:text-white">
                                {title}
                            </h3>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onClose}
                                aria-label="Close dialog"
                                className="rounded-lg w-8 h-8 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </Button>
                        </div>
                        <div className={cn("p-4 sm:p-5 overflow-y-auto", bodyClassName)}>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
