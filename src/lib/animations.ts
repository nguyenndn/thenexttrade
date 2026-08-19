import type { Transition, Variants } from "framer-motion";

/** Soft spring for open/close panels & dropdowns (matches PublicSearchModal). */
export const SPRING_SOFT: Transition = {
    type: "spring",
    damping: 25,
    stiffness: 400,
};

/** Backdrop fade-in/out. */
export const backdropVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

/** Centered-dialog panel: zoom + rise (matches Dialog's zoom-in-95 feel). */
export const panelVariants: Variants = {
    initial: { opacity: 0, scale: 0.95, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 8 },
};
