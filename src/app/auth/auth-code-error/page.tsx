import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function AuthCodeErrorPage() {
    return (
        <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-[#1E2028] p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl transition-colors duration-300">
            <div className="flex justify-center mb-6">
                <Logo />
            </div>

            <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/15 border-2 border-red-200 dark:border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="text-red-500" size={28} />
                </div>

                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Authentication Error</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                    The link you used is invalid or has expired.<br />
                    Please try again or request a new link.
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/auth/forgot-password"
                        className="w-full bg-primary hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all text-center text-sm"
                    >
                        Try Resetting Password Again
                    </Link>
                    <Link
                        href="/auth/login"
                        className="w-full bg-gray-100 dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-[#151925] text-gray-900 dark:text-white font-bold py-3.5 rounded-xl transition-all text-center text-sm"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
