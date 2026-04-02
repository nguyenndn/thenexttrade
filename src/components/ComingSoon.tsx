
import { Construction } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage({ title, description }: { title: string, description?: string }) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 text-gray-800 dark:text-white">
            <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Construction size={48} className="text-cyan-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8">
                {description || "This feature is currently under development. Check back soon for updates!"}
            </p>
            <Link href="/" className="px-6 py-3 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-600 transition-colors">
                Return Home
            </Link>
        </div>
    );
}
