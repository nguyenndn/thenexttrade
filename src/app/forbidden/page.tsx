import Link from 'next/link';
import { ShieldX, Home, ArrowLeft, LogIn } from 'lucide-react';

export const metadata = {
    title: '403 — Access Denied | The Next Trade',
    description: 'You do not have permission to access this page.',
};

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0E14] px-4">
            <div className="text-center max-w-lg">

                {/* Animated 403 */}
                <div className="relative mb-8">
                    <p className="text-[120px] sm:text-[160px] font-black text-gray-100 dark:text-white/[0.03] leading-none select-none">
                        403
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <ShieldX size={40} className="text-red-500 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                    Access Denied
                </h1>

                {/* Description */}
                <p className="text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    You don&apos;t have permission to access this page.
                    Please sign in with the correct account or contact support.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/login"
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#00B078] text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-primary/20"
                    >
                        <LogIn size={16} />
                        Sign In
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-full transition-colors"
                    >
                        <Home size={16} />
                        Go Home
                    </Link>
                </div>

                {/* Contact */}
                <p className="mt-10 text-sm text-gray-400">
                    Need access?{' '}
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
