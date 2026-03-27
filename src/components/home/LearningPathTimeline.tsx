"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BookOpen, Star, Trophy, Shield, Crown } from "lucide-react";

const steps = [
  { icon: BookOpen, title: "1. The Initiate", desc: "Novice Trader", color: "text-blue-500", bg: "bg-blue-500/10", gradient: "from-blue-400 to-cyan-500", glow: "rgba(59,130,246,0.3)" },
  { icon: Star, title: "2. The Analyst", desc: "Technical Master", color: "text-cyan-500", bg: "bg-cyan-500/10", gradient: "from-cyan-500 to-green-500", glow: "rgba(6,182,212,0.3)" },
  { icon: Trophy, title: "3. The Strategist", desc: "Market Scholar", color: "text-primary", bg: "bg-primary/10", gradient: "from-green-500 to-yellow-500", glow: "rgba(0,200,136,0.3)" },
  { icon: Shield, title: "4. The Operator", desc: "Risk Manager", color: "text-amber-500", bg: "bg-amber-500/10", gradient: "from-yellow-500 to-orange-500", glow: "rgba(245,158,11,0.3)" },
  { icon: Crown, title: "5. The Master", desc: "System Legend", color: "text-orange-500", bg: "bg-orange-500/10", gradient: "from-orange-500 to-red-500", glow: "rgba(249,115,22,0.3)" },
];

const CARD_DELAY = 0.5;
const LINE_DURATION = 3.5;

export function LearningPathTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <div ref={ref} className="grid grid-cols-1 md:flex md:flex-wrap md:justify-center lg:grid lg:grid-cols-5 gap-6 mb-16 relative">
      
      {/* Desktop Animated Line — vertically centered through cards */}
      <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-[10%] right-[10%] h-[3px] z-0">
        {/* Background track */}
        <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 rounded-full" />
        
        {/* Animated fill — "water flow" effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #00C888, #00A570, #00C888)",
            boxShadow: "0 0 12px rgba(0,200,136,0.5), 0 0 4px rgba(0,200,136,0.3)",
            transformOrigin: "left center",
          }}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{
            duration: LINE_DURATION,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Shimmer effect on the line */}
        {isInView && (
          <motion.div
            className="absolute top-0 bottom-0 w-24 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
            }}
            initial={{ left: "-10%" }}
            animate={{ left: "110%" }}
            transition={{
              duration: 2,
              delay: 0.6,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Mobile Animated Vertical Line */}
      <div className="lg:hidden absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] z-0">
        <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 rounded-full" />
        <motion.div
          className="absolute inset-x-0 top-0 bottom-0 rounded-full"
          style={{
            background: "linear-gradient(180deg, #00C888, #00A570)",
            boxShadow: "0 0 12px rgba(0,200,136,0.5)",
            transformOrigin: "top center",
          }}
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{
            duration: LINE_DURATION,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
      </div>

      {/* Step Cards */}
      {steps.map((step, idx) => {
        const cardDelay = 0.5 + idx * CARD_DELAY;
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{
              duration: 0.7,
              delay: cardDelay,
              ease: "easeOut",
            }}
            className="relative z-10 group overflow-hidden bg-white dark:bg-[#1E2028] p-4 pt-5 rounded-xl border border-gray-200/80 dark:border-white/10 hover:border-transparent transition-all duration-300 md:w-[30%] lg:w-auto mx-auto w-[85%] md:mx-0 shadow-sm hover:shadow-lg"
            style={{
              boxShadow: `0 2px 12px ${step.glow}`,
            }}
          >
            {/* Gradient top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${step.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />


            {/* Icon */}
            <motion.div
              className={`w-12 h-12 rounded-xl ${step.bg} ${step.color} flex items-center justify-center mb-4 mx-auto`}
              initial={{ rotate: -15, scale: 0.5 }}
              animate={isInView ? { rotate: 0, scale: 1 } : {}}
              transition={{
                duration: 0.5,
                delay: cardDelay + 0.15,
                type: "spring",
                stiffness: 200,
              }}
            >
              <step.icon size={24} strokeWidth={2.5} />
            </motion.div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</p>
            </div>

            {/* Glow on hover */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
              style={{ boxShadow: `0 0 30px ${step.glow}` }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
