"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import JournalForm from "./JournalForm";
import { useState } from "react";

interface JournalEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: any; // Using any for now to match JournalForm's loose typing
}

export function JournalEntryModal({ open, onOpenChange, entry }: JournalEntryModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50 dark:bg-[#0B0E14] border-none p-0">
                <div className="p-6">
                    <JournalForm
                        initialData={entry}
                        isEditMode={true}
                        onCancel={() => onOpenChange(false)}
                        onSuccess={() => onOpenChange(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
