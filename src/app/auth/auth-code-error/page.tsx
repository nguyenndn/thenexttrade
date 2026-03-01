import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function AuthCodeErrorPage() {
    return (
        <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Authentication Error</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
                The link you used is invalid or has expired. Please try again.
            </p>
            <div className="flex flex-col gap-3">
                <Link
                    href="/auth/forgot-password"
                    className="w-full bg-[#2F80ED] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl transition-all"
                >
                    Try Resetting Password Again
                </Link>
                <Link
                    href="/auth/login"
                    className="w-full bg-gray-100 dark:bg-[#151925] border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-[#1C1F2E] text-gray-900 dark:text-white font-bold py-3 rounded-xl transition-all"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    )
}
