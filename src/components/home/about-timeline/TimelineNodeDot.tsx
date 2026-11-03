"use client";

import { motion } from "framer-motion";
import type { TimelineItem } from "./timeline-data";

export interface TimelineNodeDotProps {
    item: TimelineItem;
    unlocked: boolean;
}

export function TimelineNodeDot({ item, unlocked }: TimelineNodeDotProps) {
    const Icon = item.icon;

    return (
        <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-20">
            <motion.div
                className="relative"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={
                    unlocked
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0.5, opacity: 0.3 }
                }
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Outer glow ring - unlock pulse */}
                {unlocked && (
                    <>
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                boxShadow: `0 0 20px 8px ${item.glowColor}`,
                            }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: [0, 0.8, 0],
                                scale: [0.5, 1.8, 2.5],
                            }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                boxShadow: `0 0 30px 12px ${item.glowColor}`,
                            }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: [0, 0.5, 0],
                                scale: [0.5, 2, 3],
                            }}
                            transition={{
                                duration: 1.5,
                                ease: "easeOut",
                                delay: 0.1,
                            }}
                        />
                        {/* Persistent breathing glow */}
                        <motion.div
                            className="absolute -inset-2 rounded-full"
                            style={{
                                boxShadow: `0 0 15px 4px ${item.glowColor}`,
                            }}
                            animate={{
                                opacity: [0.2, 0.5, 0.2],
                                scale: [1, 1.15, 1],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </>
                )}
                {/* Main node circle */}
                <motion.div
                    className={`w-12 h-12 rounded-full ${item.bg} ${item.color} flex items-center justify-center border-4 border-white dark:border-[#0F1117] shadow-lg relative z-10`}
                    animate={
                        unlocked
                            ? {
                                  boxShadow: [
                                      `0 0 0px 0px ${item.glowColor}`,
                                      `0 0 20px 6px ${item.glowColor}`,
                                      `0 0 10px 3px ${item.glowColor}`,
                                  ],
                              }
                            : {}
                    }
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <motion.div
                        animate={
                            unlocked
                                ? {
                                      rotate: [0, -15, 15, 0],
                                      scale: [1, 1.3, 1],
                                      y: [0, -2, 0, 2, 0],
                                  }
                                : {}
                        }
                        transition={{
                            duration: 0.6,
                            delay: 0.3,
                            y: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1,
                            },
                        }}
                    >
                        <Icon size={20} strokeWidth={2.5} />
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}
