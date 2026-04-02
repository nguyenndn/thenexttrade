'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0E14] px-4">
      <div className="text-center max-w-lg">

        {/* Animated 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] sm:text-[160px] font-black text-gray-100 dark:text-white/[0.03] leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
              <Search size={40} className="text-primary" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-gray-700 dark:text-white mb-4">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#00B078] text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-primary/20"
          >
            <Home size={16} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-full transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Contact */}
        <p className="mt-10 text-sm text-gray-500">
          Think this is a mistake?{' '}
          <a
            href="mailto:support@thenexttrade.com"
            className="text-primary font-semibold hover:underline"
          >
            Let us know
          </a>
        </p>
      </div>
    </div>
  );
}
