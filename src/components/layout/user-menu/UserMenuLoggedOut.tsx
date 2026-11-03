import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export function UserMenuLoggedOut() {
    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <Link
                href="/auth/login"
                className={buttonVariants({
                    variant: "ghost",
                    size: "smd",
                    className:
                        "px-3 xl:px-4 text-xs font-semibold whitespace-nowrap rounded-lg text-gray-800 hover:text-amber-600 hover:bg-transparent dark:text-gray-300 dark:hover:text-amber-300 dark:hover:bg-transparent",
                })}
            >
                Login
            </Link>
            <Link
                href="/auth/signup"
                className={buttonVariants({
                    variant: "primary",
                    size: "smd",
                    className:
                        "px-4 xl:px-5 text-xs font-bold whitespace-nowrap rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-500/20",
                })}
            >
                Sign Up Free
            </Link>
        </div>
    );
}
