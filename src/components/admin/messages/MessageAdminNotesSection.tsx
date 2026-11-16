"use client";

import { CheckCircle2, Save, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MessageAdminNotesSectionProps {
    notes: string;
    savedNotes: string;
    isSaving: boolean;
    onChange: (value: string) => void;
    onSave: () => void;
}

export function MessageAdminNotesSection({
    notes,
    savedNotes,
    isSaving,
    onChange,
    onSave,
}: MessageAdminNotesSectionProps) {
    const isDirty = notes !== savedNotes;
    const hasSavedNotes = savedNotes.trim().length > 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label
                    htmlFor="admin-internal-notes"
                    className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
                >
                    <StickyNote size={12} className="text-amber-500" />
                    <span>Internal Admin Notes</span>
                </label>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                    Visible to admin team only
                </span>
            </div>

            <textarea
                id="admin-internal-notes"
                rows={3}
                value={notes}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#151925] focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all resize-none"
            />

            <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-medium">
                    {isDirty ? (
                        <span className="text-amber-600 dark:text-gold font-semibold">
                            Unsaved note changes
                        </span>
                    ) : hasSavedNotes ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={12} />
                            Saved to message record
                        </span>
                    ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                            Add internal context or follow-up details for other
                            admins.
                        </span>
                    )}
                </div>

                <Button
                    type="button"
                    variant={isDirty ? "primary" : "outline"}
                    size="smd"
                    onClick={onSave}
                    disabled={!isDirty || isSaving}
                    isLoading={isSaving}
                    className={
                        isDirty
                            ? "!text-white shrink-0"
                            : "border-gray-200 dark:border-white/10 shrink-0"
                    }
                >
                    <Save size={14} />
                    <span>Save Notes</span>
                </Button>
            </div>
        </div>
    );
}
