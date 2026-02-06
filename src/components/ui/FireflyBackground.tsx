'use client';

import React, { useEffect, useState } from 'react';

export const FireflyBackground = () => {
    const [fireflies, setFireflies] = useState<{ id: number; style: React.CSSProperties; animationClass?: string }[]>([]);

    useEffect(() => {
        // Create 40 fireflies
        const count = 40;
        const newFireflies = Array.from({ length: count }).map((_, i) => ({
            id: i,
            animationClass: `animate-firefly-${Math.floor(Math.random() * 3) + 1}`,
            style: {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 10}s`, // Faster movement
                animationDelay: `${Math.random() * 5}s`,
                scale: Math.random() * 0.5 + 0.5,
            } as React.CSSProperties
        }));
        setFireflies(newFireflies);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {fireflies.map((fly) => (
                <div
                    key={fly.id}
                    className={`absolute w-1.5 h-1.5 bg-[#00C888] rounded-full blur-[1px] opacity-0 ${fly.animationClass}`}
                    style={fly.style}
                />
            ))}
        </div>
    );
};
