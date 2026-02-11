"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Upload } from "lucide-react";
import { updateProfile } from "./actions";
import { Logo } from "@/components/ui/Logo";

export default function OnboardingPage() {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);

        if (file) {
            // Validate file size (1MB)
            if (file.size > 1024 * 1024) {
                setError("Image size must be less than 1MB");
                e.target.value = ""; // Reset input
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
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0E14] text-white p-4 font-outfit">

            <div className="mb-8">
                <Logo textClassName="text-white" />
            </div>

            <div className="w-full max-w-md bg-[#151925] border border-white/5 rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
                    <p className="text-gray-400 text-sm">Tell us a bit more about yourself to get started.</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <div className={`w-24 h-24 rounded-full bg-[#0B0E14] border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors relative ${error?.includes("Image size") ? "border-red-500/50" : "border-[#2F80ED]/30 group-hover:border-[#2F80ED]"}`}>
                                {avatarPreview ? (
                                    <Image
                                        src={avatarPreview}
                                        alt="Avatar Preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Camera className="text-gray-500 group-hover:text-[#2F80ED] transition-colors" size={32} />
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
                        <p className={`text-xs ${error?.includes("Image size") ? "text-red-400" : "text-gray-500"}`}>
                            {error?.includes("Image size") ? "File too large (>1MB)" : "Click to upload avatar (Max 1MB)"}
                        </p>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-gray-300">Username</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            placeholder="@username"
                            className="w-full h-11 px-4 bg-[#0B0E14] border border-white/10 rounded-xl focus:outline-none focus:border-[#2F80ED] focus:bg-[#0B0E14] text-white placeholder:text-gray-600 transition-all"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label htmlFor="bio" className="text-sm font-medium text-gray-300">Bio</label>
                        <textarea
                            name="bio"
                            id="bio"
                            rows={3}
                            placeholder="Tell us about your trading journey..."
                            className="w-full px-4 py-3 bg-[#0B0E14] border border-white/10 rounded-xl focus:outline-none focus:border-[#2F80ED] focus:bg-[#0B0E14] text-white placeholder:text-gray-600 resize-none transition-all"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-[#2F80ED] hover:bg-[#2563eb] text-white font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Complete Profile"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
