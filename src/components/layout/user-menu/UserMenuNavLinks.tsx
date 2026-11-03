import Link from "next/link";
import { Flame, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signout } from "@/app/auth/actions";

interface UserMenuNavLinksProps {
    variant: "default" | "dashboard";
    dashboardUrl: string;
    pathname: string;
    onClose: () => void;
}

export function UserMenuNavLinks({
    variant,
    dashboardUrl,
    pathname,
    onClose,
}: UserMenuNavLinksProps) {
    return (
        <>
            <div className="p-2 space-y-1">
                <Link
                    href="/get-started"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-400/10 transition-colors group"
                >
                    <Flame size={18} className="text-orange-500 transition-colors" />
                    <div>
                        <span className="block text-gray-700 dark:text-white">
                            Getting Started
                        </span>
                        <span className="text-xs text-gray-600 font-normal">
                            Setup &amp; next action
                        </span>
                    </div>
                </Link>

                {variant !== "dashboard" ? (
                    <Link
                        href={dashboardUrl}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                    >
                        <LayoutDashboard
                            size={18}
                            className="text-gray-500 group-hover:text-primary transition-colors"
                        />
                        <div>
                            <span className="block text-gray-700 dark:text-white">
                                Dashboard
                            </span>
                            <span className="text-xs text-gray-600 font-normal">
                                Overview &amp; Learning Path
                            </span>
                        </div>
                    </Link>
                ) : (
                    <Link
                        href={pathname.startsWith("/admin") ? "/admin/settings" : "/dashboard/settings"}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <Settings size={18} className="text-gray-500" />
                        Account Settings
                    </Link>
                )}
            </div>

            <div className="p-2 border-t border-gray-200 dark:border-white/10">
                <Button
                    variant="ghost"
                    size="smd"
                    onClick={() => signout()}
                    className="flex w-full justify-start items-center gap-2.5 px-3 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    <LogOut size={16} />
                    Log Out
                </Button>
            </div>
        </>
    );
}
