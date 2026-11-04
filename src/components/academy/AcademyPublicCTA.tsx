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
                        "w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-lg bg-gold hover:bg-amber-600 !text-white text-sm font-extrabold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap animate-btn-shine group",
                })}
            >
                <PlayCircle size={16} className="shrink-0" />
                <span>Continue Learning</span>
            </Link>
        );
    }

    return (
        <Link
            href="/auth/login"
            className={buttonVariants({
                variant: "primary",
                className:
                    "w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-lg bg-gold hover:bg-amber-600 !text-white text-sm font-extrabold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap animate-btn-shine group",
            })}
        >
            <PlayCircle size={16} className="shrink-0" />
            <span>Explore the Curriculum</span>
        </Link>
    );
}
