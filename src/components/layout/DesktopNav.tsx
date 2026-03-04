"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { menuItems } from "@/config/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DesktopNav() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    return (
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 relative flex-1 justify-center">
            {menuItems.map((item) => {
                if (item.type === "link") {
                    return (
                        <Link
                            key={item.name}
                            href={item.href}

                            className={`${isDark ? 'text-white hover:text-teal-400' : 'text-gray-900 hover:text-teal-600'} transition-colors font-medium text-base`}
                        >
                            {item.name}
                        </Link>
                    );
                } else {
                    return (
                        <div
                            key={item.name}
                            className="relative group dropdown-menu"
                            onMouseEnter={() => setOpenDropdown(item.name)}
                            onMouseLeave={() => setOpenDropdown(null)}
                        >
                            <Button
                                variant="ghost"
                                className={`flex items-center gap-1.5 h-[40px] p-0 hover:bg-transparent ${isDark ? 'text-white hover:text-teal-400' : 'text-gray-900 hover:text-teal-600'} transition-colors font-medium text-base`}
                            >
                                {item.name}
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${openDropdown === item.name ? 'rotate-180' : ''}`}
                                />
                            </Button>
                            {openDropdown === item.name && (
                                <div
                                    className={`absolute top-full left-0 pt-2 w-56 z-50`}
                                    onMouseEnter={() => setOpenDropdown(item.name)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                >
                                    <div
                                        className={`rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className="py-2">
                                            {item.items?.map((subItem, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={subItem.href}
                                                    className={`block px-4 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-slate-700 hover:text-teal-400' : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'} transition-colors`}
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }
            })}
        </nav>
    );
}
