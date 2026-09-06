import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

interface AcademyPublicCTAProps {
    isLoggedIn?: boolean;
}

export function AcademyPublicCTA({
    isLoggedIn = false,
}: AcademyPublicCTAProps) {
    if (isLoggedIn) {
        return (
            <Link
                href="/dashboard/academy"
                className={buttonVariants({
                    variant: "primary",
                    className:
                        "px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300",
                })}
            >
                <PlayCircle size={20} />
                Continue Learning
            </Link>
        );
    }

    return (
        <Link
            href="/auth/login"
            className={buttonVariants({
                variant: "primary",
                className:
                    "px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300",
            })}
        >
            <PlayCircle size={20} />
            Explore the Curriculum
        </Link>
    );
}
