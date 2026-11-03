"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Settings, User as UserIcon, Search } from "lucide-react";
import { AuthUser } from "@/lib/auth-types";
import { Button } from "@/components/ui/Button";
import { getTierProgress } from "@/lib/tier-utils";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";
import { UserMenuProfileHeader } from "./user-menu/UserMenuProfileHeader";
import { UserMenuNavLinks } from "./user-menu/UserMenuNavLinks";
import { UserMenuLoggedOut } from "./user-menu/UserMenuLoggedOut";

interface UserMenuProps {
    user: AuthUser | null;
    profile?: AuthUser["profile"] | null;
    variant?: "default" | "dashboard";
    isLoading?: boolean;
}

export function UserMenu({
    user,
    variant = "default",
    isLoading = false,
}: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const dashboardUrl = useDashboardUrl();

    const userData = {
        name: user?.name || "Trader",
        image: user?.image || null,
        username: user?.profile?.username || "User",
    };

    const userXp = user?.profile?.xp ?? 0;
    const tierProgress = getTierProgress(userXp);

    if (isLoading) {
        return (
            <div className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-6 bg-gray-200 dark:bg-white/5 rounded-lg" />
                <div className="w-24 h-9 bg-gray-300 dark:bg-white/10 rounded-lg" />
            </div>
        );
    }

    if (!user) {
        return <UserMenuLoggedOut />;
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-amber-500/10 dark:bg-white/10 border-none sm:border-solid border-amber-500/20 dark:border-amber-400/20 hover:bg-amber-500/15 dark:hover:bg-amber-400/10 transition-all group shadow-sm !h-auto"
                    aria-label="User menu"
                >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 overflow-hidden border border-white dark:border-white/10 shadow-sm shrink-0">
                        {userData.image ? (
                            <Image
                                src={userData.image}
                                alt={userData.name || "User"}
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 dark:bg-white/5">
                                <UserIcon size={16} />
                            </div>
                        )}
                    </div>

                    <Settings
                        size={20}
                        className="text-amber-500 dark:text-gray-400 dark:group-hover:text-white group-hover:rotate-90 transition-transform duration-500"
                    />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-60 bg-white dark:bg-[#151925] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 p-0 overflow-hidden z-50"
            >
                <UserMenuProfileHeader
                    name={userData.name}
                    tierProgress={tierProgress}
                    onClose={() => setIsOpen(false)}
                />

                {/* Mobile Search inside dropdown */}
                <div className="sm:hidden px-3 py-2 border-b border-gray-200 dark:border-white/10">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label="Search"
                        onClick={() =>
                            document.dispatchEvent(
                                new KeyboardEvent("keydown", {
                                    key: "k",
                                    ctrlKey: true,
                                    bubbles: true,
                                })
                            )
                        }
                        className="w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-sm text-left h-auto border-transparent"
                    >
                        <Search size={15} className="shrink-0" />
                        <span>Search...</span>
                    </Button>
                </div>

                <UserMenuNavLinks
                    variant={variant}
                    dashboardUrl={dashboardUrl}
                    pathname={pathname}
                    onClose={() => setIsOpen(false)}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
