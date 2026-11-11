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
                        "inline-flex w-auto rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 transition-all duration-200 whitespace-nowrap",
                })}
            >
                <PlayCircle size={15} className="shrink-0" />
                <span>Continue Learning</span>
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
                    "inline-flex w-auto rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 transition-all duration-200 whitespace-nowrap",
            })}
        >
            <PlayCircle size={15} className="shrink-0" />
            <span>Explore the Curriculum</span>
        </Link>
    );
}
