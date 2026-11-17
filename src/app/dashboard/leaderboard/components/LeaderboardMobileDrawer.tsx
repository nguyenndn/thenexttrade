"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/Sheet";
import { LeaderboardSidebar } from "./LeaderboardSidebar";
import type { SidebarDataResponse } from "../actions";

interface LeaderboardMobileDrawerProps {
    initialData: SidebarDataResponse;
}

export function LeaderboardMobileDrawer({
    initialData,
}: LeaderboardMobileDrawerProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="lg:hidden shrink-0 rounded-lg h-9 px-2.5 sm:px-3 text-xs font-bold flex items-center gap-1.5 border-dashboard bg-white dark:bg-[#1E2028] text-gray-700 dark:text-gray-200 shadow-sm"
                >
                    <SlidersHorizontal
                        size={14}
                        className="text-amber-600 dark:text-gold shrink-0"
                    />
                    <span>My Accounts</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md overflow-y-auto p-4 sm:p-6 border-dashboard bg-white dark:bg-[#0D111C]"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>My Accounts &amp; Privacy Settings</SheetTitle>
                    <SheetDescription>
                        Control how your profile and trading accounts appear on
                        the leaderboard.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                    <LeaderboardSidebar initialData={initialData} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
