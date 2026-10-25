"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    X,
} from "lucide-react";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FeedbackItem {
    id: number;
    imageSrc: string;
    title: string;
}

interface FeedbackCarouselProps {
    images?: string[];
}

export function FeedbackCarousel({ images = [] }: FeedbackCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR safety
    const [activeLightboxImage, setActiveLightboxImage] = useState<
        string | null
    >(null);
    const [activeLightboxTitle, setActiveLightboxTitle] = useState<string>("");

    // Detect screen width dynamic to toggle between 1-item and 3-item scrolling safely after mount
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Do not render carousel if no real feedback images are provided
    if (images.length === 0) {
        return null;
    }

    const feedbacks: FeedbackItem[] = images.map((img, index) => ({
        id: index + 1,
        imageSrc: img,
        title: `Feedback Screenshot #${index + 1}`,
    }));

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
    };

    const handlePrev = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + feedbacks.length) % feedbacks.length
        );
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    const handleImageError = (id: number) => {
        setImageErrors((prev) => ({ ...prev, [id]: true }));
    };

    const handleCardClick = (item: FeedbackItem) => {
        const title = `Feedback Screenshot #${item.id}`;
        setActiveLightboxImage(item.imageSrc);
        setActiveLightboxTitle(title);
    };

    const handleCloseLightbox = () => {
        setActiveLightboxImage(null);
    };

    const dotsCount = feedbacks.length;

    return (
        <section className="px-4 sm:px-6 mb-16 md:mb-24 max-w-6xl mx-auto text-center overflow-hidden">
            <div className="text-center mb-10 space-y-3">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-800 dark:text-white">
                    What Our Traders Say
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                    Real screenshots and feedback shared by traders in the
                    GoldScalperNinja Telegram community and VIP TraderRoom.
                </p>
            </div>

            <div className="relative flex items-center justify-center max-w-5xl mx-auto px-1 sm:px-6 min-h-[660px] sm:min-h-[790px]">
                {/* Navigation Buttons */}
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePrev}
                    className="absolute left-1 sm:-left-12 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-dashboard flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-white"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </Button>

                {/* 3D Stage Container */}
                <div className="w-full relative flex items-center justify-center h-[630px] sm:h-[760px] overflow-visible py-4 px-1 select-none">
                    {feedbacks.map((item, index) => {
                        const N = feedbacks.length;
                        let dist = index - currentIndex;
                        if (dist < -Math.floor(N / 2)) dist += N;
                        if (dist > Math.floor(N / 2)) dist -= N;

                        const isActive = dist === 0;
                        const isVisible = isMobile
                            ? isActive
                            : Math.abs(dist) <= 2;

                        const zIndex = 30 - Math.abs(dist) * 10;
                        const opacity = isActive
                            ? 1
                            : isMobile
                              ? 0
                              : Math.abs(dist) === 1
                                ? 0.65
                                : Math.abs(dist) === 2
                                  ? 0.2
                                  : 0;

                        // Calculate dynamic translate positions based on active index distance
                        let xOffset = 0;
                        let scale = 1;

                        if (!isMobile) {
                            if (dist === 1) {
                                xOffset = 250;
                                scale = 0.82;
                            } else if (dist === -1) {
                                xOffset = -250;
                                scale = 0.82;
                            } else if (dist === 2) {
                                xOffset = 430;
                                scale = 0.66;
                            } else if (dist === -2) {
                                xOffset = -430;
                                scale = 0.66;
                            } else if (Math.abs(dist) > 2) {
                                xOffset = dist * 350;
                                scale = 0.5;
                            }
                        } else {
                            scale = isActive ? 1 : 0.8;
                            xOffset = dist * 300;
                        }

                        return (
                            <div
                                key={item.id}
                                onClick={() =>
                                    dist !== 0
                                        ? setCurrentIndex(index)
                                        : handleCardClick(item)
                                }
                                className={`absolute transition-all duration-500 ease-out ${
                                    isVisible
                                        ? "opacity-100 pointer-events-auto"
                                        : "opacity-0 pointer-events-none"
                                }`}
                                style={{
                                    transform: `translateX(${xOffset}px) scale(${scale})`,
                                    zIndex: zIndex,
                                    opacity: opacity,
                                    width: "100%",
                                    maxWidth: isMobile ? "290px" : "340px",
                                    cursor: isActive ? "zoom-in" : "pointer",
                                }}
                            >
                                <div
                                    className={`w-full rounded-lg border bg-white dark:bg-[#131622] p-4 flex flex-col justify-between h-full group relative transition-all duration-500 ${
                                        isActive
                                            ? "border-gold/60 dark:border-gold/50 shadow-[0_0_35px_rgba(245,158,11,0.15)] dark:shadow-[0_0_40px_rgba(245,158,11,0.12)] scale-[1.02]"
                                            : "border-dashboard/80 shadow-md shadow-amber-500/[0.01]"
                                    }`}
                                >
                                    {/* Subtle active shadow */}
                                    {isActive && (
                                        <div className="absolute inset-0 -m-1 rounded-lg bg-gold/10 opacity-60 blur-md -z-10 pointer-events-none" />
                                    )}

                                    {imageErrors[item.id] ? (
                                        /* NEUTRAL PLACEHOLDER ON IMAGE LOAD ERROR */
                                        <div className="w-full aspect-[1290/2796] rounded-lg bg-gray-100 dark:bg-[#0B0E14] border border-dashboard dark:border-white/[0.04] flex flex-col items-center justify-center p-6 text-center">
                                            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-gold/20 flex items-center justify-center text-amber-500 mb-3">
                                                <MessageCircle size={22} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Feedback Screenshot
                                            </span>
                                            <span className="text-[11px] text-gray-400 mt-1">
                                                Verified Telegram Share
                                            </span>
                                        </div>
                                    ) : (
                                        /* ACTUAL IMAGE SCREENSHOT (Optimized for iPhone 15 Pro Max Aspect Ratio) */
                                        <div className="relative w-full aspect-[1290/2796] rounded-lg overflow-hidden bg-slate-900/50 dark:bg-slate-950 border border-gray-150/80 dark:border-white/[0.06] flex items-center justify-center">
                                            <img
                                                src={item.imageSrc}
                                                alt="Telegram feedback screenshot"
                                                className="w-full h-full object-contain bg-black dark:bg-[#06080c] transition-transform duration-500"
                                                onError={() =>
                                                    handleImageError(item.id)
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-4 text-left border-t border-dashboard dark:border-white/[0.04] pt-3 flex items-center justify-between shrink-0">
                                        <div>
                                            <div className="text-xs font-black text-gray-800 dark:text-white leading-tight">
                                                {`Feedback Screenshot #${item.id}`}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium">
                                                Verified Telegram Share
                                            </div>
                                        </div>
                                        <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-gold/20 text-[9px] font-bold text-gold uppercase tracking-wider">
                                            ★ Community Share
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    className="absolute right-1 sm:-right-12 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-dashboard flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-white"
                    aria-label="Next slide"
                >
                    <ChevronRight size={20} />
                </Button>
            </div>

            {/* Stepper Dots */}
            {dotsCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {Array.from({ length: dotsCount }).map((_, index) => (
                        <Button
                            key={index}
                            type="button"
                            variant="ghost"
                            onClick={() => handleDotClick(index)}
                            className={cn(
                                "p-0 min-h-0 border-0 rounded-full transition-all duration-300 cursor-pointer h-2.5",
                                index === currentIndex
                                    ? "w-6 bg-gold hover:bg-gold"
                                    : "w-2.5 bg-gray-300 dark:bg-slate-700 hover:bg-gold/50"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Feedback Lightbox Modal */}
            <FeedbackLightboxModal
                isOpen={activeLightboxImage !== null}
                onClose={handleCloseLightbox}
                imageSrc={activeLightboxImage}
                title={activeLightboxTitle}
            />
        </section>
    );
}

interface FeedbackLightboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    title: string;
}

function FeedbackLightboxModal({
    isOpen,
    onClose,
    imageSrc,
    title,
}: FeedbackLightboxModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Body scroll lock: lock while open, release on exit complete, safety net on unmount.
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"; // Prevent background scrolling
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const releaseLock = () => {
        document.body.style.overflow = "unset";
    };

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence onExitComplete={releaseLock}>
            {isOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6"
                    onClick={onClose}
                >
                    {/* Modal Card Wrapper - Expanded Size (At least twice the card width) */}
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className="relative my-auto w-full max-w-[440px] sm:max-w-[520px] aspect-[1290/2796] rounded-lg overflow-hidden bg-slate-950 border border-gold/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the card
                    >
                        {/* Close Button at top-right of the card */}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="absolute top-3 right-3 z-[10000] w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white shadow-md"
                            aria-label="Close preview"
                        >
                            <X size={16} />
                        </Button>

                        {imageSrc && (
                            <img
                                src={imageSrc}
                                alt={title}
                                className="w-full h-full object-contain bg-black"
                            />
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
