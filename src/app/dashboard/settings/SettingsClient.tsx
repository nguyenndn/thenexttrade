"use client";

import { useState, useEffect } from 'react';
import { User, Save, Loader2, AlertCircle, CheckCircle, Camera, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function SettingsClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [editingPhoto, setEditingPhoto] = useState(false);
    const [photoUrlInput, setPhotoUrlInput] = useState('');

    const [formData, setFormData] = useState({ name: '', bio: '', image: '' });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setFormData({ name: data.name || '', bio: data.bio || '', image: data.image || '' });
            }
        } catch { console.error("Failed to fetch profile"); }
        finally { setIsLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            router.refresh();
        } catch { setMessage({ type: 'error', text: 'Something went wrong. Please try again.' }); }
        finally { setIsSaving(false); }
    };

    const handleApplyPhoto = () => {
        if (photoUrlInput.startsWith('http')) {
            setFormData(prev => ({ ...prev, image: photoUrlInput }));
        }
        setEditingPhoto(false);
        setPhotoUrlInput('');
    };

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-5">

            {/* Status Message */}
            {message && (
                <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                    message.type === 'success'
                        ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                )}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            {/* ── Profile Picture Card ── */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                {/* Gradient banner */}
                <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent dark:from-primary/30 dark:via-primary/15 dark:to-transparent relative">
                    <div className="absolute inset-0 opacity-30"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #00C888 0%, transparent 60%)' }} />
                </div>

                <div className="px-6 pb-5">
                    {/* Avatar overlapping banner */}
                    <div className="flex items-end gap-4 -mt-10 mb-4">
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#151925] border-4 border-white dark:border-[#1E2028] shadow-lg">
                                {formData.image ? (
                                    <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User size={28} />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingPhoto(v => !v)}
                                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                            >
                                <Camera size={13} className="text-white" />
                            </button>
                        </div>
                        <div className="pb-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formData.name || 'Your Name'}</p>
                            <button type="button" onClick={() => setEditingPhoto(v => !v)}
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                                <Pencil size={11} />
                                Change photo
                            </button>
                        </div>
                    </div>

                    {/* URL input */}
                    {editingPhoto && (
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="url"
                                value={photoUrlInput}
                                onChange={(e) => setPhotoUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPhoto())}
                                placeholder="Paste image URL (https://...)"
                                autoFocus
                                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            />
                            <Button type="button" variant="primary" onClick={handleApplyPhoto} className="h-9 px-3 py-0 text-xs">Apply</Button>
                            <button type="button" onClick={() => { setEditingPhoto(false); setPhotoUrlInput(''); }}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {formData.image && !editingPhoto && (
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                            className="text-xs text-red-400 hover:text-red-600 hover:underline mt-1 flex items-center gap-1">
                            <X size={11} />Remove photo
                        </button>
                    )}

                    <p className="text-xs text-gray-400 mt-3">JPG, PNG or GIF · Max 2MB · Recommended 400×400px</p>
                </div>
            </div>

            {/* ── Personal Info Card ── */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Display Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/8 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            placeholder="Your full name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/8 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
                            placeholder="Tell us about your trading journey..."
                        />
                        <p className="text-xs text-gray-400 mt-1">{formData.bio.length}/200 characters</p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-white/8 flex justify-end">
                    <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </form>
    );
}
