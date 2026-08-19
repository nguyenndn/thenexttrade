"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
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
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
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
                        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-[#151925] shadow-xl border border-dashboard cursor-default"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-dashboard flex-shrink-0">
                            <h3 className="text-xl font-bold text-gray-700 dark:text-white">
                                {title}
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </Button>
                        </div>
                        <div className="p-6 overflow-y-auto">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
