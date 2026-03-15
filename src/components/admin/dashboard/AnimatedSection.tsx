"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function AnimatedSection({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
