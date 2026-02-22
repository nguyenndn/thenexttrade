"use client";

import { motion } from "framer-motion";

export const AnimatedMorningIcon = ({ size = 32 }: { size?: number }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Center Sun Core */}
            <motion.circle 
                cx="12" cy="12" r="4" 
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="text-yellow-500"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Rays */}
            <motion.g 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-yellow-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center" }}
            >
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="4.93" x2="19.07" y2="6.34" />
            </motion.g>
        </svg>
    );
};

export const AnimatedAfternoonIcon = ({ size = 32 }: { size?: number }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sun behind cloud */}
            <motion.g
                className="text-orange-500"
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "12px 12px" }}
            >
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
            
            {/* Moving cloud */}
            <motion.path 
                d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.1751 10.1936 17.8576 10.0232C17.3986 6.64365 14.5262 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2319 4.01131 11.4611 4.03332 11.6872C2.26197 12.2464 1 13.9149 1 15.8C1 18.1196 2.8804 20 5.2 20H17.5Z" 
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-sky-400 dark:text-sky-300"
                animate={{ x: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>
    );
};

export const AnimatedEveningIcon = ({ size = 32 }: { size?: number }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Moon */}
            <motion.path 
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="text-blue-500"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "center" }}
            />
            
            {/* Twinkling Stars */}
            <motion.path d="M16 4v4m-2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-yellow-400"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "16px 4px" }}
            />
            <motion.path d="M21 3v2m-1-1h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-yellow-300"
                animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{ transformOrigin: "21px 3px" }}
            />
            <motion.path d="M20 20v2m-1-1h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-yellow-400"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.3, 0.9] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                style={{ transformOrigin: "20px 20px" }}
            />
        </svg>
    );
};
