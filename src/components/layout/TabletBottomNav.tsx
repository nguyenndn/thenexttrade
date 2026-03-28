"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/config/navigation";
import { Home, BookOpen, GraduationCap, Wrench, Building2 } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
    Home,
    Knowledge: BookOpen,
    Academy: GraduationCap,
    Tools: Wrench,
    Brokers: Building2,
};

export function TabletBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:flex lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#151925] border-t border-gray-200 dark:border-white/10 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
            <div className="flex w-full max-w-[768px] mx-auto">
                {menuItems.map((item) => {
                    const Icon = iconMap[item.name] || Home;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                                isActive
                                    ? "text-primary"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
