import { Flame, Search, BookOpen, Rocket, type LucideIcon } from "lucide-react";

export interface TimelineItem {
    phase: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    borderColor: string;
    accentColor: string;
    glowColor: string;
    title: string;
    period: string;
    story: string;
}

export const TIMELINE: TimelineItem[] = [
    {
        phase: "01",
        icon: Flame,
        color: "text-red-500",
        bg: "bg-red-100 dark:bg-red-500/10",
        borderColor: "border-red-200 dark:border-red-500/20",
        accentColor: "text-red-600 dark:text-red-400",
        glowColor: "rgba(239, 68, 68, 0.6)",
        title: "The Pink Glasses",
        period: "The Beginning",
        story: "A friend introduced me to forex, and everything looked rosy. Every trade seemed to win. I felt invincible - like I had discovered a secret money machine. The charts moved, my balance grew, and I thought this was it.",
    },
    {
        phase: "02",
        icon: Search,
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-500/10",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        accentColor: "text-amber-600 dark:text-amber-400",
        glowColor: "rgba(245, 158, 11, 0.6)",
        title: "The Wake-Up Call",
        period: "Rock Bottom",
        story: "Then came the moment of truth. I went all in. Oversized lots. No stop loss. No plan. The market didn't care about my confidence - it took everything. I stared at a blown account and realized: I had been gambling, not trading. I had zero real knowledge.",
    },
    {
        phase: "03",
        icon: BookOpen,
        color: "text-amber-600 dark:text-gold",
        bg: "bg-amber-100 dark:bg-gold/10",
        borderColor: "border-amber-200 dark:border-gold/25",
        accentColor: "text-amber-600 dark:text-gold",
        glowColor: "rgba(245, 158, 11, 0.6)",
        title: "The Hard Way",
        period: "Self-Education",
        story: "Desperate and broke, I chased the holy grail - magic indicators, secret strategies, paid signals. None of it worked. So I did the only thing left: I taught myself. But the knowledge was scattered across hundreds of sites, YouTube channels, and forums. There was no single structured path. It took years of pain, trial, and error - but slowly, the losses stopped, and I started seeing consistent profits.",
    },
    {
        phase: "04",
        icon: Rocket,
        color: "text-primary",
        bg: "bg-emerald-100 dark:bg-primary/10",
        borderColor: "border-emerald-200 dark:border-primary/20",
        accentColor: "text-emerald-600 dark:text-emerald-400",
        glowColor: "rgba(0, 200, 120, 0.6)",
        title: "TheNextTrade",
        period: "The Solution",
        story: "After years of hard-won experience, I had one burning thought: no new trader should have to go through what I went through. The scattered knowledge, the scams, the loneliness of figuring it out alone - I wanted to change that. So I built TheNextTrade: a free, structured platform where everything a retail trader needs - tools, courses, knowledge, and community - lives in one place.",
    },
];
