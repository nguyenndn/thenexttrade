"use client";

import { ArrowLeft } from "lucide-react";

export function BackButton() {
 return (
 <button
 onClick={() => window.history.back()}
 className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-full transition-colors"
 >
 <ArrowLeft size={16} />
 Go Back
 </button>
 );
}
