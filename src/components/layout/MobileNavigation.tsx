"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { menuItems } from "@/config/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MobileNavigationProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleMobileDropdownToggle = (menu: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (openDropdown === menu) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(menu);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="lg:hidden px-2 pb-4 absolute top-full left-0 w-full z-40">
            <div className={`max-w-7xl mx-auto rounded-xl border shadow-lg ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white border-gray-200'
                }`}>
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        if (item.type === "link") {
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => onClose()}
                                    className={`block px-4 py-3 rounded-lg ${isDark ? 'text-white hover:bg-slate-800 hover:text-teal-400' : 'text-gray-900 hover:bg-gray-50 hover:text-teal-600'} transition-colors font-medium`}
                                >
                                    {item.name}
                                </Link>
                            );
                        } else {
                            return (
                                <div key={item.name} className="dropdown-menu">
                                    <Button
                                        variant="ghost"
                                        onClick={(e) => handleMobileDropdownToggle(item.name, e)}
                                        className={`w-full flex h-auto items-center justify-between px-4 py-3 rounded-lg ${isDark ? 'text-white hover:bg-slate-800 hover:text-teal-400' : 'text-gray-900 hover:bg-gray-50 hover:text-teal-600'} transition-colors font-medium`}
                                    >
                                        <span>{item.name}</span>
                                        <ChevronDown
                                            className={`w-5 h-5 transition-transform ${openDropdown === item.name ? 'rotate-180' : ''}`}
                                        />
                                    </Button>
                                    {openDropdown === item.name && (
                                        <div className="pl-4 mt-2 space-y-1">
                                            {item.items?.map((subItem, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={subItem.href}
                                                    onClick={() => {
                                                        setOpenDropdown(null);
                                                        onClose();
                                                    }}
                                                    className={`block px-4 py-2.5 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-slate-800 hover:text-teal-400' : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'} transition-colors`}
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    })}
                </nav>
            </div>
        </div>
    );
}
