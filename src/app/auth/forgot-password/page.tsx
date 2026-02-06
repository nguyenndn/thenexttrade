'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { forgotPassword } from '../actions'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await forgotPassword(formData)

        if (result?.error) {
            setError(result.error)
        } else {
            setMessage('Check your email for the password reset link.')
        }
        setIsLoading(false)
    }

    return (
        <div className="w-full max-w-md">
            <div className="mb-8">
                <Link href="/auth/login" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Login
                </Link>
                <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
                <p className="text-gray-400">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            {message ? (
                <div className="bg-[#00C888]/10 border border-[#00C888]/20 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-[#00C888]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="text-[#00C888]" size={24} />
                    </div>
                    <h3 className="text-[#00C888] font-bold mb-2">Check your email</h3>
                    <p className="text-gray-300 text-sm">
                        {message}
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300">Email Address</label>
                        <div className="relative">
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="name@example.com"
                                className="w-full bg-[#151925] border border-gray-800 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#2F80ED] focus:ring-1 focus:ring-[#2F80ED] transition-all"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
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
                        className="w-full bg-[#00C888] hover:bg-[#00b078] text-black font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-[#00C888]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            "Send Reset Link"
                        )}
                    </button>
                </form>
            )}
        </div>
    )
}
