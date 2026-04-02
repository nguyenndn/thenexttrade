"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Upload } from "lucide-react";
import { updateProfile } from "./actions";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);

        if (file) {
            if (file.size > 1024 * 1024) {
                setError("Image size must be less than 1MB");
                e.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await updateProfile(formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                router.push("/academy");
            }
        } catch (error) {
            console.error(error);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0B0E14] p-4 font-outfit transition-colors duration-300">

            {/* Fullscreen loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                    <Loader2 size={40} className="animate-spin text-primary mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">Setting up your account...</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Please wait, this may take a moment.</p>
                </div>
            )}

            <div className="mb-8">
                <Logo />
            </div>

            <div className="w-full max-w-md bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-8 shadow-xl transition-colors duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Complete Your Profile</h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Tell us a bit more about yourself to get started.</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <div className={`w-24 h-24 rounded-full bg-gray-100 dark:bg-[#0B0E14] border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors relative ${error?.includes("Image size") ? "border-red-400 dark:border-red-500/50" : "border-primary/30 group-hover:border-primary"}`}>
                                {avatarPreview ? (
                                    <Image
                                        src={avatarPreview}
                                        alt="Avatar Preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Camera className="text-gray-400 group-hover:text-primary transition-colors" size={32} />
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
                        <p className={`text-xs ${error?.includes("Image size") ? "text-red-500 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}>
                            {error?.includes("Image size") ? "File too large (>1MB)" : "Click to upload avatar (Max 1MB)"}
                        </p>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            placeholder="@username"
                            className="w-full h-11 px-4 bg-gray-50 dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                        <textarea
                            name="bio"
                            id="bio"
                            rows={3}
                            placeholder="Tell us about your trading journey..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none transition-all"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-primary hover:bg-[#00b078] text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border-none shadow-md shadow-primary/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Complete Profile"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
