"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SOFT } from "@/lib/animations";
import { usePathname } from "next/navigation";
import { menuItems } from "@/config/navigation";
import { AuthUser } from "@/lib/auth-types";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";
import { MobileUserAuthBlock } from "./mobile-nav/MobileUserAuthBlock";

interface MobileNavigationProps {
    isOpen: boolean;
    onClose: () => void;
    user?: AuthUser | null;
}

export function MobileNavigation({
    isOpen,
    onClose,
    user,
}: MobileNavigationProps) {
    const pathname = usePathname();
    const dashboardUrl = useDashboardUrl();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id="mobile-navigation"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={SPRING_SOFT}
                    className="lg:hidden px-2 pb-4 absolute top-full left-0 w-full z-40"
                >
                    <div className="max-w-7xl mx-auto rounded-xl border shadow-lg bg-white dark:bg-card/95 border-gray-200 dark:border-white/10">
                        {/* Nav Links */}
                        <nav className="p-4 space-y-2">
                            {menuItems.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== "/" &&
                                        pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onClose}
                                        aria-current={isActive ? "page" : undefined}
                                        className={[
                                            "relative block px-4 py-3 rounded-lg nav-menu-text transition-colors",
                                            isActive
                                                ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                                                : "text-gray-700 hover:bg-amber-50 hover:text-amber-700 dark:text-white dark:hover:bg-amber-400/10 dark:hover:text-amber-300",
                                        ].join(" ")}
                                    >
                                        {item.name}
                                        <span
                                            className={[
                                                "absolute bottom-1.5 left-4 right-4 h-[2px] rounded-full bg-amber-500 transition-opacity",
                                                isActive ? "opacity-100" : "opacity-0",
                                            ].join(" ")}
                                        />
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Bottom section: user info OR auth buttons */}
                        <div className="border-t border-gray-200 dark:border-white/10">
                            <MobileUserAuthBlock
                                user={user}
                                dashboardUrl={dashboardUrl}
                                onClose={onClose}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
