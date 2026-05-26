"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, MessageCircle, Shield, CheckCircle2, X } from "lucide-react";

interface FeedbackItem {
    id: number;
    imageSrc: string;
    userName: string;
    userHandle: string;
    date: string;
    role: string;
    text: string;
    profit: string;
}

const mockFeedbacks: FeedbackItem[] = [
    {
        id: 1,
        imageSrc: "/images/feedbacks/feedback-1.jpg",
        userName: "Hoàng Nam",
        userHandle: "@namtrader92",
        date: "Today, 14:32",
        role: "Verified VIP Member",
        text: "Tín hiệu XAUUSD chuẩn đét luôn admin ơi! Sáng nay em vừa khớp lệnh Buy ở 2342 ăn trọn 120 pips. Quản lý vốn SL/TP cực kỳ rõ ràng, theo nhóm VIP giúp em kỷ luật hơn rất nhiều, tài khoản tăng trưởng đều đặn.",
        profit: "+$420.50 (XAUUSD Buy)"
    },
    {
        id: 2,
        imageSrc: "/images/feedbacks/feedback-2.jpg",
        userName: "David K.",
        userHandle: "@david_k_fx",
        date: "Yesterday, 18:15",
        role: "Verified VIP Member",
        text: "Ebook SMC (Smart Money Concepts) tặng kèm viết cực kỳ chi tiết, dễ hiểu cho người mới như mình. Đặc biệt con bot EA Trade Assistant hỗ trợ quản lý lệnh bán/mua cực nhạy, kéo SL về entry tự động đỡ phải canh màn hình mất thời gian.",
        profit: "EA Trade Assistant Activator"
    },
    {
        id: 3,
        imageSrc: "/images/feedbacks/feedback-3.jpg",
        userName: "Minh Anh",
        userHandle: "@minhanh_gold",
        date: "Friday, 10:04",
        role: "Verified VIP Member",
        text: "Thích nhất không khí chia sẻ kinh nghiệm văn minh, tích cực trong phòng chat TraderRoom 24/7. Admin support 1:1 siêu nhiệt tình, giải thích cặn kẽ từng setup lệnh lỗi để lần sau mình rút kinh nghiệm. Xứng đáng 5 sao!",
        profit: "Active in TraderRoom"
    },
    {
        id: 4,
        imageSrc: "/images/feedbacks/feedback-4.jpg",
        userName: "Quốc Bảo",
        userHandle: "@bao_gold_scalper",
        date: "Thursday, 09:40",
        role: "Verified VIP Member",
        text: "Lần đầu tiên thấy nhóm tín hiệu mà admin hỗ trợ nhiệt tình thế này. EA chạy mượt mà, lệnh đi đều, không tham lam nhồi lệnh vô tội vạ. Rất yên tâm gửi gắm tài khoản giao dịch ở đây.",
        profit: "EA TraderRoom Member"
    }
];

interface FeedbackCarouselProps {
    images?: string[];
}

export function FeedbackCarousel({ images = [] }: FeedbackCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR safety
    const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
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

    const feedbacks = images.length > 0
        ? images.map((img, index) => ({
            id: index + 1,
            imageSrc: img,
            userName: "VIP Group Feedback",
            userHandle: `Real Setup #${index + 1}`,
            date: "Verified Setup",
            role: "Verified VIP Member",
            text: "Tín hiệu XAUUSD chuẩn đét luôn admin ơi! Sáng nay em vừa khớp lệnh Buy ở 2342 ăn trọn 120 pips. Quản lý vốn SL/TP cực kỳ rõ ràng, theo nhóm VIP giúp em kỷ luật hơn rất nhiều, tài khoản tăng trưởng đều đặn.",
            profit: "+$420.50 (XAUUSD Buy)"
          }))
        : mockFeedbacks;

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + feedbacks.length) % feedbacks.length);
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    const handleImageError = (id: number) => {
        setImageErrors((prev) => ({ ...prev, [id]: true }));
    };

    const handleCardClick = (item: any) => {
        const title = images.length > 0 ? `Feedback Screenshot #${item.id}` : item.userName;
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
                    What Our VIP Members Say
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                    Real screenshots and feedback shared directly from our VIP Telegram channel and TraderRoom.
                </p>
            </div>

            <div className="relative flex items-center justify-center max-w-5xl mx-auto px-1 sm:px-6 min-h-[660px] sm:min-h-[790px]">
                
                {/* Navigation Buttons */}
                <button
                    onClick={handlePrev}
                    className="absolute left-1 sm:-left-12 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-white cursor-pointer"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* 3D Stage Container */}
                <div className="w-full relative flex items-center justify-center h-[630px] sm:h-[760px] overflow-visible py-4 px-1 select-none">
                    {feedbacks.map((item, index) => {
                        const N = feedbacks.length;
                        let dist = index - currentIndex;
                        if (dist < -Math.floor(N / 2)) dist += N;
                        if (dist > Math.floor(N / 2)) dist -= N;

                        const isActive = dist === 0;
                        const isVisible = isMobile ? isActive : Math.abs(dist) <= 2;

                        const zIndex = 30 - Math.abs(dist) * 10;
                        const opacity = isActive ? 1 : isMobile ? 0 : Math.abs(dist) === 1 ? 0.65 : Math.abs(dist) === 2 ? 0.2 : 0;

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
                                onClick={() => dist !== 0 ? setCurrentIndex(index) : handleCardClick(item)}
                                className={`absolute transition-all duration-500 ease-out ${
                                    isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                                }`}
                                style={{
                                    transform: `translateX(${xOffset}px) scale(${scale})`,
                                    zIndex: zIndex,
                                    opacity: opacity,
                                    width: "100%",
                                    maxWidth: isMobile ? "290px" : "340px",
                                    cursor: isActive ? "zoom-in" : "pointer"
                                }}
                            >
                                <div className={`w-full rounded-3xl border bg-white dark:bg-[#131622] p-4 flex flex-col justify-between h-full group relative transition-all duration-500 ${
                                    isActive
                                        ? "border-gold/60 dark:border-gold/50 shadow-[0_0_35px_rgba(245,158,11,0.15)] dark:shadow-[0_0_40px_rgba(245,158,11,0.12)] scale-[1.02]"
                                        : "border-gray-200/80 dark:border-white/5 shadow-md shadow-amber-500/[0.01]"
                                }`}>
                                    
                                    {/* 3D Cyan/Amber Glowing Aura exactly matching the reference layout style */}
                                    {isActive && (
                                        <div className="absolute inset-0 -m-1 rounded-[28px] bg-gradient-to-tr from-gold/30 to-amber-500/20 opacity-40 blur-xl -z-10 animate-pulse pointer-events-none" />
                                    )}

                                    {imageErrors[item.id] ? (
                                        /* FALLBACK MOCKUP */
                                        <div className="w-full aspect-[1290/2796] rounded-2xl bg-[#F0F4F8] dark:bg-[#0B0E14] border border-gray-200 dark:border-white/[0.04] flex flex-col overflow-hidden text-left relative shadow-inner">
                                            {/* Header */}
                                            <div className="bg-white dark:bg-[#181F2B] px-3.5 py-2.5 border-b border-gray-200 dark:border-white/[0.06] flex items-center gap-2.5 shrink-0">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {item.userName.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white truncate">{item.userName}</span>
                                                        <CheckCircle2 size={13} className="text-blue-500 fill-blue-500 dark:text-sky-400 dark:fill-sky-400 shrink-0" />
                                                    </div>
                                                    <span className="text-[10px] text-amber-600 dark:text-gold font-bold tracking-wide flex items-center gap-1 uppercase">
                                                        <Shield size={9} /> {item.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
                                                <div className="self-start max-w-[90%] bg-white dark:bg-[#181F2B] rounded-2xl rounded-tl-none p-3.5 shadow-sm border border-gray-150 dark:border-white/[0.03] space-y-2 relative">
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block">{item.userHandle}</span>
                                                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                        {item.text}
                                                    </p>
                                                </div>

                                                <div className="self-end max-w-[80%] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-primary/10 dark:to-teal-500/5 rounded-2xl rounded-tr-none p-3 border border-emerald-500/20 dark:border-primary/20 flex items-center gap-3.5 shadow-sm">
                                                    <div className="flex-1">
                                                        <span className="text-[8px] sm:text-[9px] text-emerald-600 dark:text-primary font-bold uppercase tracking-wider block">Target Reached</span>
                                                        <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-primary leading-none block mt-0.5">{item.profit}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ACTUAL IMAGE SCREENSHOT (Optimized for iPhone 15 Pro Max Aspect Ratio) */
                                        <div className="relative w-full aspect-[1290/2796] rounded-2xl overflow-hidden bg-slate-900/50 dark:bg-slate-950 border border-gray-150/80 dark:border-white/[0.06] flex items-center justify-center">
                                            <img
                                                src={item.imageSrc}
                                                alt="Telegram feedback screenshot"
                                                className="w-full h-full object-contain bg-black dark:bg-[#06080c] transition-transform duration-500"
                                                onError={() => handleImageError(item.id)}
                                            />
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-4 text-left border-t border-gray-100 dark:border-white/[0.04] pt-3 flex items-center justify-between shrink-0">
                                        <div>
                                            <div className="text-xs font-black text-gray-800 dark:text-white leading-tight">
                                                {images.length > 0 ? `Feedback Screenshot #${item.id}` : item.userName}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium">
                                                {images.length > 0 ? "Verified Telegram Share" : item.userHandle}
                                            </div>
                                        </div>
                                        <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-gold/20 text-[9px] font-bold text-gold uppercase tracking-wider">
                                            ★ VIP Signal Result
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={handleNext}
                    className="absolute right-1 sm:-right-12 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all text-gray-700 dark:text-white cursor-pointer"
                    aria-label="Next slide"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Stepper Dots */}
            {dotsCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {Array.from({ length: dotsCount }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                                index === currentIndex 
                                    ? "w-6 bg-gold" 
                                    : "bg-gray-300 dark:bg-slate-700 hover:bg-gold/50"
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Feedback Lightbox Modal */}
            {activeLightboxImage && (
                <FeedbackLightboxModal
                    isOpen={activeLightboxImage !== null}
                    onClose={handleCloseLightbox}
                    imageSrc={activeLightboxImage}
                    title={activeLightboxTitle}
                />
            )}
        </section>
    );
}

interface FeedbackLightboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    title: string;
}

function FeedbackLightboxModal({ isOpen, onClose, imageSrc, title }: FeedbackLightboxModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden"; // Prevent background scrolling
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 transition-opacity duration-300"
            onClick={onClose}
        >
            {/* Modal Card Wrapper - Expanded Size (At least twice the card width) */}
            <div 
                className="relative w-full max-w-[440px] sm:max-w-[520px] aspect-[1290/2796] rounded-3xl overflow-hidden bg-slate-950 border border-gold/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex items-center justify-center transition-all duration-300"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the card
            >
                {/* Close Button at top-right of the card */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-[10000] w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                    aria-label="Close preview"
                >
                    <X size={16} />
                </button>

                <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-full object-contain bg-black"
                />
            </div>
        </div>,
        document.body
    );
}
