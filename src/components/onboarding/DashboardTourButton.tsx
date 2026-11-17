"use client";

import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDashboardTour } from "./DashboardTourProvider";

export function DashboardTourButton() {
    const pathname = usePathname();
    const { startTour } = useDashboardTour();

    if (pathname !== "/dashboard") return null;

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startTour}
            aria-label="Start dashboard tour"
            title="Start dashboard tour"
            className="hidden lg:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-gold hover:bg-gold/10"
        >
            <HelpCircle size={15} />
            <span className="hidden xl:inline">Tour</span>
        </Button>
    );
}
