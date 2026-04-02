"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/config/navigation";

export function DesktopNav() {
    const pathname = usePathname();

    return (
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 relative flex-1 justify-center">
            {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="relative py-1 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition-colors group"
                    >
                        {item.name}
                        {/* Hover underline — slides in from center */}
                        <span
                            className={[
                                "absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] bg-primary rounded-full transition-all duration-300 ease-out",
                                isActive ? "w-full" : "w-0 group-hover:w-full",
                            ].join(" ")}
                        />
                    </Link>
                );
            })}
        </nav>
    );
}
