'use client';

import { useEffect } from 'react';
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Global Error Caught", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#0B1220]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-[#F9FAFB]">Something went wrong!</h2>
            <p className="text-[#9CA3AF]">{error.message || 'An unexpected error occurred'}</p>
            <button
              onClick={reset}
              className="px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

