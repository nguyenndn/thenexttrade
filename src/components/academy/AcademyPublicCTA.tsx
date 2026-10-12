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
                    size: "smd",
                    className:
                        "rounded-full bg-gold hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300",
                })}
            >
                <PlayCircle size={15} />
                Continue Learning
            </Link>
        );
    }

    return (
        <Link
            href="/auth/login"
            className={buttonVariants({
                variant: "primary",
                size: "smd",
                className:
                    "rounded-full bg-gold hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300",
            })}
        >
            <PlayCircle size={15} />
            Explore the Curriculum
        </Link>
    );
}
