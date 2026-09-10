"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoreHorizontal,
    Eye,
    ShieldCheck,
    Trash2,
    KeyRound,
    LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteUser } from "@/app/admin/users/actions";
import { impersonateUserAction } from "@/actions/admin-impersonate";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChangeRoleModal } from "./ChangeRoleModal";
import { resetUserPassword } from "@/app/admin/users/[id]/actions";

interface UserRowActionsProps {
    user: {
        id: string;
        name: string | null;
        email: string | null;
        role: string;
    };
}

export function UserRowActions({ user }: UserRowActionsProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isImpersonating, setIsImpersonating] = useState(false);

    const handleImpersonate = async () => {
        setIsImpersonating(true);
        toast.loading("Starting impersonation session...");
        const res = await impersonateUserAction(user.id);
        toast.dismiss();
        setIsImpersonating(false);
        if (res.success) {
            toast.success(`Switched view to ${res.targetName || user.email}`);
            router.push("/dashboard");
            router.refresh();
        } else {
            toast.error(res.error || "Failed to impersonate user");
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteUser(user.id);
        if (result.success) {
            toast.success("User deleted successfully");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete user");
        }
        setIsDeleting(false);
        setIsConfirmOpen(false);
    };

    const handleResetPassword = async () => {
        const result = await resetUserPassword(user.id);
        if (result.success) {
            toast.success("Password reset email sent");
        } else {
            toast.error(result.error || "Failed to send reset email");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="User Actions"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                        <MoreHorizontal size={18} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-xl border-gray-200 dark:border-white/10"
                >
                    <DropdownMenuItem
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="font-medium cursor-pointer rounded-lg mx-1 my-0.5"
                    >
                        <Eye size={14} className="mr-2 text-gray-500" />
                        View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleImpersonate}
                        disabled={isImpersonating}
                        className="font-medium cursor-pointer rounded-lg mx-1 my-0.5 text-amber-600 dark:text-amber-400 focus:bg-amber-50 dark:focus:bg-amber-500/10"
                    >
                        <LogIn size={14} className="mr-2" />
                        Impersonate Trader
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsRoleModalOpen(true)}
                        className="font-medium cursor-pointer rounded-lg mx-1 my-0.5"
                    >
                        <ShieldCheck size={14} className="mr-2 text-gray-500" />
                        Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleResetPassword}
                        className="font-medium cursor-pointer rounded-lg mx-1 my-0.5"
                    >
                        <KeyRound size={14} className="mr-2 text-gray-500" />
                        Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setIsConfirmOpen(true)}
                        className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 font-medium cursor-pointer rounded-lg mx-1 my-0.5"
                    >
                        <Trash2 size={14} className="mr-2" />
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ChangeRoleModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                userId={user.id}
                userName={user.name || "User"}
                currentRole={user.role}
            />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete User"
                description={`Are you sure you want to delete "${user.name || user.email}"? This will permanently remove their account and all associated data. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </>
    );
}
