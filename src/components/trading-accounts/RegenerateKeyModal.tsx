"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { regenerateAccountKey } from "@/actions/accounts";

interface RegenerateKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountId: string | null;
}

export function RegenerateKeyModal({ isOpen, onClose, accountId }: RegenerateKeyModalProps) {
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    async function handleRegenerateKey() {
        if (!accountId) return;
        setIsGenerating(true);
        try {
            const result = await regenerateAccountKey(accountId);
            if (result.error) throw new Error(result.error);
            setNewKey(result.apiKey || null);
            toast.success("New API Key generated");
        } catch (e) {
            toast.error("Failed to regenerate key");
        } finally {
            setIsGenerating(false);
        }
    }

    function copyNewKey() {
        navigator.clipboard.writeText(newKey || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && !newKey) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate API Key</DialogTitle>
                    <DialogDescription>
                        This will invalidate your current API key. You will need to update your EA settings with the new key immediately.
                    </DialogDescription>
                </DialogHeader>

                {newKey ? (
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-gray-50 dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5">
                            <p className="text-xs font-bold text-gray-500 mb-2 uppercase">New API Key</p>
                            <div className="flex gap-2 items-center">
                                <code className="flex-1 font-mono text-sm text-primary break-all bg-white dark:bg-black/40 p-2.5 rounded-lg border border-gray-200 dark:border-white/10">{newKey}</code>
                                <Button variant="outline" size="sm" onClick={copyNewKey} className="font-bold">
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-red-500">Please save this key now. It will not be shown again.</p>
                    </div>
                ) : null}

                <DialogFooter>
                    {!newKey ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isGenerating}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleRegenerateKey}
                                disabled={isGenerating}
                            >
                                {isGenerating ? "Regenerating..." : "Regenerate"}
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setNewKey(null);
                                onClose();
                            }}
                        >
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
