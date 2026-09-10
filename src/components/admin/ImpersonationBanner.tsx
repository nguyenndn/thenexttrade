"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { stopImpersonatingAction } from "@/actions/admin-impersonate";
import { toast } from "sonner";
import { AuthUser } from "@/lib/auth-types";

interface Props {
    user: AuthUser | null;
}

export function ImpersonationBanner({ user }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    if (!user?.isImpersonated) return null;

    const handleExit = () => {
        startTransition(async () => {
            const res = await stopImpersonatingAction();
            if (res.success) {
                toast.success("Exited impersonation mode");
                router.push("/admin/ib/traders");
                router.refresh();
            } else {
                toast.error("Failed to exit impersonation");
            }
        });
    };

    return (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between z-50 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium">
                <ShieldAlert size={16} className="text-amber-500 shrink-0 animate-pulse" />
                <span>
                    <strong className="font-bold">Admin Impersonation:</strong> You are viewing TheNextTrade as{" "}
                    <span className="font-bold text-amber-950 dark:text-amber-100 font-mono">
                        {user.name || user.email}
                    </span>{" "}
                    ({user.email}). All actions reflect this trader account.
                </span>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExit}
                disabled={isPending}
                className="h-7 text-xs font-bold gap-1.5 border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 rounded-lg shrink-0 ml-4"
            >
                <LogOut size={13} />
                {isPending ? "Exiting..." : "Exit Impersonation"}
            </Button>
        </div>
    );
}
