import Link from "next/link";
import Image from "next/image";
import {
    LogIn,
    UserPlus,
    User as UserIcon,
    LayoutDashboard,
    Settings,
    LogOut,
    Compass,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { AuthUser } from "@/lib/auth-types";
import { signout } from "@/app/auth/actions";

interface MobileUserAuthBlockProps {
    user?: AuthUser | null;
    dashboardUrl: string;
    onClose: () => void;
}

export function MobileUserAuthBlock({
    user,
    dashboardUrl,
    onClose,
}: MobileUserAuthBlockProps) {
    if (user) {
        return (
            <div className="p-4 space-y-1">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg mb-2 bg-gray-50 dark:bg-white/5">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt={user.name || "User"}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-white/10">
                                <UserIcon size={20} className="text-gray-500" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate text-gray-700 dark:text-white">
                            {user.name || "Trader"}
                        </p>
                        <p className="text-xs text-primary truncate">
                            @{user.profile?.username || "user"}
                        </p>
                    </div>
                </div>

                <Link
                    href="/get-started"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text transition-colors text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-400/10"
                >
                    <Compass size={16} className="text-orange-500" />
                    Getting Started
                </Link>
                <Link
                    href={dashboardUrl}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text transition-colors text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                >
                    <LayoutDashboard size={16} className="text-primary" />
                    Dashboard
                </Link>
                <Link
                    href="/dashboard/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text transition-colors text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                >
                    <Settings size={16} className="text-gray-500" />
                    Settings
                </Link>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        signout();
                        onClose();
                    }}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm nav-menu-text text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors h-auto"
                >
                    <LogOut size={16} />
                    Log Out
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <Link
                href="/get-started"
                onClick={onClose}
                className={buttonVariants({
                    variant: "outline",
                    className:
                        "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300 dark:hover:bg-orange-400/15",
                })}
            >
                <Compass size={16} />
                Start Here
            </Link>
            <div className="grid grid-cols-2 gap-3">
                <Link
                    href="/auth/login"
                    onClick={onClose}
                    className={buttonVariants({
                        variant: "outline",
                        className:
                            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors border-gray-200 text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5",
                    })}
                >
                    <LogIn size={16} />
                    Login
                </Link>
                <Link
                    href="/auth/signup"
                    onClick={onClose}
                    className={buttonVariants({
                        variant: "primary",
                        className:
                            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20",
                    })}
                >
                    <UserPlus size={16} />
                    Sign Up
                </Link>
            </div>
        </div>
    );
}
