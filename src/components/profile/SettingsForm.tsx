"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Upload, Check, AlertCircle } from "lucide-react";
import { updateSettings } from "@/app/dashboard/settings/account/actions";

interface SettingsFormProps {
    user: any;
    profile: any;
}

export function SettingsForm({ user, profile }: SettingsFormProps) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user?.user_metadata?.avatar_url || user?.image || null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate File Size (1MB)
            if (file.size > 1 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size must be less than 1MB.' });
                // Reset file input value if possible, or just don't set preview
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
                setMessage(null); // Clear previous errors
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setMessage(null);
        try {
            const result = await updateSettings(formData);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Profile updated successfully!' });
            }
        } catch (error: any) {
            console.error(error);
            // Handle Next.js specific errors (like body size limit)
            let errorMessage = 'Something went wrong. Please try again.';
            if (error.message && error.message.includes('exceeded')) {
                errorMessage = 'File is too large. Please upload an image smaller than 1MB.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    }`}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form action={handleSubmit}>
                {/* Avatar Section */}
                <div className="pb-8 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group cursor-pointer shrink-0">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#0B0E14] border-2 border-dashed border-gray-300 dark:border-[#2F80ED]/30 flex items-center justify-center overflow-hidden group-hover:border-[#00C888] transition-colors relative">
                            {avatarPreview ? (
                                <Image
                                    src={avatarPreview}
                                    alt="Avatar Preview"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <Camera className="text-gray-400 group-hover:text-[#00C888] transition-colors" size={32} />
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white" size={20} />
                            </div>
                        </div>
                        <input
                            type="file"
                            name="avatar"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Profile Picture</h3>
                        <p className="text-xs text-gray-500">
                            Upload a high-quality image. <br className="hidden sm:block" />
                            JPG, GIF or PNG. Max size of 1MB.
                        </p>
                    </div>
                </div>

                <div className="mt-8 space-y-6">
                    {/* Username */}
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                required
                                defaultValue={profile?.username || user?.user_metadata?.name || ""}
                                placeholder="username"
                                className="w-full h-11 pl-9 pr-4 bg-gray-50 dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00C888] focus:ring-1 focus:ring-[#00C888] dark:text-white placeholder:text-gray-500 transition-all font-medium"
                            />
                        </div>
                        <p className="text-xs text-gray-500">This will be your unique handle on the platform.</p>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                        <textarea
                            name="bio"
                            id="bio"
                            rows={4}
                            defaultValue={profile?.bio || ""}
                            placeholder="Tell us about your trading journey..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#00C888] focus:ring-1 focus:ring-[#00C888] dark:text-white placeholder:text-gray-500 resize-none transition-all"
                        />
                        <p className="text-xs text-gray-500">Brief description for your profile. URLs are hyperlinked.</p>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 h-12 bg-[#00C888] hover:bg-[#00b078] text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#00C888]/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
