"use client";

import React, { useEffect, useState } from "react";
import styles from "./FireflyBackground.module.css";

interface FireflyBackgroundProps {
    count?: number;
    color?: "primary" | "gold" | "cyan";
    className?: string;
}

const colorStyles = {
    primary: "bg-primary shadow-[0_0_8px_rgba(0,200,136,0.8)]",
    gold: "bg-amber-400 dark:bg-gold shadow-[0_0_10px_rgba(245,158,11,0.85)]",
    cyan: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
};

export const FireflyBackground = ({
    count = 40,
    color = "primary",
    className = "",
}: FireflyBackgroundProps) => {
    const [fireflies, setFireflies] = useState<
        { id: number; style: React.CSSProperties; animationClass?: string }[]
    >([]);

    useEffect(() => {
        const classes = [styles.firefly1, styles.firefly2, styles.firefly3];
        const newFireflies = Array.from({ length: count }).map((_, i) => ({
            id: i,
            animationClass: classes[Math.floor(Math.random() * classes.length)],
            style: {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${7 + Math.random() * 10}s`,
                animationDelay: `${Math.random() * 5}s`,
                scale: Math.random() * 0.6 + 0.5,
            } as React.CSSProperties,
        }));
        setFireflies(newFireflies);
    }, [count]);

    const activeColorClass = colorStyles[color] || colorStyles.primary;

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {fireflies.map((fly) => (
                <div
                    key={fly.id}
                    className={`absolute w-1.5 h-1.5 rounded-full blur-[1px] opacity-0 ${activeColorClass} ${fly.animationClass || ""}`}
                    style={fly.style}
                />
            ))}
        </div>
    );
};
