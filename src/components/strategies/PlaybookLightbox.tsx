"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PlaybookLightboxProps {
    isOpen: boolean;
    images: string[];
    initialIndex?: number;
    title?: string;
    onClose: () => void;
}

export function PlaybookLightbox({
    isOpen,
    images,
    initialIndex = 0,
    title,
    onClose,
}: PlaybookLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setScale(1);
    }, [initialIndex, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentIndex, images.length]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setScale(1);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setScale(1);
    };

    if (!isOpen || images.length === 0) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Lightbox Container */}
                <div className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col items-center">
                    {/* Top Bar */}
                    <div className="w-full flex items-center justify-between text-white mb-3 px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tracking-wide">
                                {title || "Reference Chart"}
                            </span>
                            <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                                {currentIndex + 1} / {images.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                                className="h-8 w-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                aria-label="Zoom out"
                            >
                                <ZoomOut size={16} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}
                                className="h-8 w-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                aria-label="Zoom in"
                            >
                                <ZoomIn size={16} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full"
                                aria-label="Close preview"
                            >
                                <X size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Image Area */}
                    <div className="relative w-full aspect-video max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/50 border border-white/10">
                        <motion.img
                            key={images[currentIndex]}
                            src={images[currentIndex]}
                            alt={`Chart ${currentIndex + 1}`}
                            style={{ transform: `scale(${scale})` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="max-h-full max-w-full object-contain transition-transform duration-200 select-none"
                        />

                        {/* Prev / Next Controls */}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-colors shadow-lg"
                                    aria-label="Previous chart"
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-colors shadow-lg"
                                    aria-label="Next chart"
                                >
                                    <ChevronRight size={22} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AnimatePresence>
    );
}
