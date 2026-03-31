"use client";

import { useState, useEffect } from "react";
import { StickyNote, Save, Loader2, Check } from "lucide-react";
import { saveAdminNotes } from "./notes-action";

interface AdminNotesProps {
    userId: string;
    initialNotes: string;
}

export function AdminNotes({ userId, initialNotes }: AdminNotesProps) {
    const [notes, setNotes] = useState(initialNotes);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        setDirty(notes !== initialNotes);
    }, [notes, initialNotes]);

    const handleSave = async () => {
        setSaving(true);
        const result = await saveAdminNotes(userId, notes);
        setSaving(false);
        if (result.success) {
            setSaved(true);
            setDirty(false);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <StickyNote size={16} className="text-gray-400" /> Admin Notes
                </h3>
                <button
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        saved
                            ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                            : dirty
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-gray-100 text-gray-400 dark:bg-white/5 cursor-not-allowed"
                    }`}
                >
                    {saving ? (
                        <><Loader2 size={13} className="animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><Check size={13} /> Saved</>
                    ) : (
                        <><Save size={13} /> Save</>
                    )}
                </button>
            </div>
            <div className="p-4 sm:p-6">
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add internal notes about this user..."
                    rows={4}
                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
            </div>
        </div>
    );
}
