"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import "lenis/dist/lenis.css";

interface SmoothScrollProviderProps {
    children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
    const lenisRef = useRef<Lenis | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Initialize Lenis with fine-tuned luxury momentum interpolation (lerp)
        const lenis = new Lenis({
            lerp: 0.075, // Signature buttery momentum glide (lower = smoother & longer glide)
            smoothWheel: true,
            wheelMultiplier: 1.15, // Responsive wheel delta
            touchMultiplier: 1.5,
            infinite: false,
            autoRaf: false,
        });

        lenisRef.current = lenis;

        // Expose to window for external scroll triggers/anchors
        (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

        let animationFrameId: number;

        function raf(time: number) {
            lenis.raf(time);
            animationFrameId = requestAnimationFrame(raf);
        }

        animationFrameId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(animationFrameId);
            lenis.destroy();
            lenisRef.current = null;
            delete (window as unknown as { __lenis?: Lenis }).__lenis;
        };
    }, []);

    // Reset scroll on route changes
    useEffect(() => {
        if (lenisRef.current) {
            lenisRef.current.scrollTo(0, { immediate: true });
        }
    }, [pathname]);

    return <>{children}</>;
}
