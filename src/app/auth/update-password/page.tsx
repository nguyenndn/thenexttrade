'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { ArrowLeft, Lock, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { updatePassword } from '../actions'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await updatePassword(formData)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        }
        // If success, the action redirects to /academy
    }

    return (
        <div className="w-full max-w-md">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Your new password must be different from previously used passwords.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                    <div className="relative">
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="Min 6 characters"
                            className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                    <div className="relative">
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            placeholder="Re-enter password"
                            className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 pl-11 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-[#00b078] text-black font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        "Reset Password"
                    )}
                </button>
            </form>
        </div>
    )
}
