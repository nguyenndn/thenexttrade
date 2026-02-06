"use client";

import { useState, useEffect } from 'react';
import { User, Lock, Save, Camera, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useRouter } from 'next/navigation';

export default function SettingsClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        image: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || '',
                    bio: data.bio || '',
                    image: data.image || ''
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile");
        } finally {
            setIsLoading(false);
        }
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

            if (!res.ok) throw new Error("Failed to update");

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            router.refresh(); // Refresh server components if any
        } catch (error) {
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-[#00C888]" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your profile and account preferences.</p>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Avatar Section */}
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Camera size={20} className="text-blue-500" />
                        Profile Picture
                    </h3>

                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex-shrink-0">
                            {formData.image ? (
                                <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User size={32} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <ImageUploader
                                onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                                value={formData.image}
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Recommended size: 400x400px. JPG, PNG or GIF.
                            </p>
                        </div>
                    </div>
                </div>

                {/* General Info Section */}
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={20} className="text-[#00C888]" />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00C888]"
                                placeholder="Your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                className="w-full h-24 px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00C888] resize-none"
                                placeholder="Tell us a bit about yourself..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Security Section (Mock for MVP) */}
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4 opacity-50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold">Coming Soon</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Lock size={20} className="text-orange-500" />
                        Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <input type="password" disabled className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                            <input type="password" disabled className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-3 bg-[#00C888] hover:bg-[#00b078] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
