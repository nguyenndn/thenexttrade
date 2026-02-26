"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { deleteTradingAccount } from "@/actions/accounts";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountId: string | null;
    onSuccess: () => void;
}

export function DeleteAccountModal({ isOpen, onClose, accountId, onSuccess }: DeleteAccountModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!accountId) return;
        setIsDeleting(true);
        try {
            const result = await deleteTradingAccount(accountId);
            if (result.error) throw new Error(result.error);
            toast.success("Account deleted");
            onSuccess();
            onClose();
        } catch (e) {
            toast.error("Failed to delete account");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Trading Account?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this account? All associated synced trades will be unlinked (or deleted depending on policy). This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
