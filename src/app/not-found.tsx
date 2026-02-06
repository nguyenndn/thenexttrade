'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220]">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-[#F9FAFB]">404</h2>
        <p className="text-xl text-[#9CA3AF]">Page Not Found</p>
        <p className="text-[#9CA3AF]">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

