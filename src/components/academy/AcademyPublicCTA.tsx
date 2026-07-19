"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

export function AcademyPublicCTA() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        fetch("/api/profile")
            .then((res) => setIsLoggedIn(res.ok))
            .catch(() => setIsLoggedIn(false));
    }, []);

    // While checking, don't show anything to prevent flicker
    if (isLoggedIn === null) return null;

    if (isLoggedIn) {
        return (
            <Link
                href="/dashboard/academy"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
            >
                <PlayCircle size={20} />
                Continue Learning
            </Link>
        );
    }

    return (
        <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
        >
            <PlayCircle size={20} />
            Explore the Curriculum
        </Link>
    );
}
