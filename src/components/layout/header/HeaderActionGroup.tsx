import { Search, Menu, X } from "lucide-react";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/layout/UserMenu";
import { AuthUser } from "@/lib/auth-types";

interface HeaderActionGroupProps {
    user: AuthUser | null;
    isHeaderLoading: boolean;
    isMobileMenuOpen: boolean;
    onToggleMobileMenu: () => void;
}

export function HeaderActionGroup({
    user,
    isHeaderLoading,
    isMobileMenuOpen,
    onToggleMobileMenu,
}: HeaderActionGroupProps) {
    const handleSearchClick = () => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
                bubbles: true,
            })
        );
    };

    return (
        <div className="flex items-center justify-end gap-2 sm:gap-2.5 xl:gap-4 flex-shrink-0 lg:min-w-0 xl:min-w-[180px]">
            {/* Theme Toggle */}
            <ThemeToggleSwitch />

            {/* Search Trigger Button */}
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSearchClick}
                aria-label="Search website (Ctrl+K)"
                className="relative w-9 h-9 p-0 flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 bg-white dark:bg-card/80 border-2 border-gray-200 dark:border-white/10 text-gold hover:bg-gray-50 dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-amber-300 hover:border-gold/50"
            >
                <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </Button>

            {/* Login / User Menu */}
            <div className="hidden lg:flex items-center">
                <UserMenu user={user} isLoading={isHeaderLoading} />
            </div>

            {/* Mobile/Tablet Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-white hover:bg-amber-50 dark:hover:bg-amber-400/10 hover:text-amber-600 dark:hover:text-amber-300"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
            >
                {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Menu className="w-6 h-6" />
                )}
            </Button>
        </div>
    );
}
