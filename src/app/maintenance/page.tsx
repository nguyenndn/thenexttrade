import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Under Maintenance | The Next Trade",
    description: "We're performing scheduled maintenance. Please check back soon.",
};

export default function MaintenancePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0E14] px-4">
            <div className="text-center max-w-lg">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Construction size={40} className="text-primary" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-gray-700 dark:text-white mb-4">
                    We&apos;ll Be Right Back
                </h1>

                {/* Description */}
                <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    We&apos;re performing scheduled maintenance to improve your experience. 
                    Please check back shortly — we won&apos;t be long!
                </p>

                {/* Animated dots */}
                <div className="flex justify-center gap-2 mb-10">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>

                {/* Contact info */}
                <p className="text-sm text-gray-500">
                    Need urgent help?{" "}
                    <a
                        href="mailto:support@thenexttrade.com"
                        className="text-primary font-semibold hover:underline"
                    >
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    );
}
