
"use client";

import { Sidebar } from "./Sidebar";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    items?: any[];
}

export function MobileSidebar({ isOpen, onClose, items }: MobileSidebarProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden font-sans">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar content */}
            <div className="absolute left-0 top-0 bottom-0 w-[272px] bg-white dark:bg-[#0B0E14] shadow-2xl transform transition-transform duration-300">
                <div className="flex flex-col h-full">
                    {/* Close button inside sidebar for convenience */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 h-auto w-auto text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white z-50 bg-white/50 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </Button>

                    {/* Reuse existing Sidebar component logic but force it visible and strictly styled */}
                    <div className="h-full overflow-y-auto pt-10">
                        <Sidebar
                            items={items}
                            className="flex w-full h-full static shadow-none border-none bg-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
