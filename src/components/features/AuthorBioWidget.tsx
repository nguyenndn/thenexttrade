
import { Facebook, Twitter, Instagram, Github } from "lucide-react";
import Image from "next/image";

interface AuthorBioWidgetProps {
    author: {
        name: string | null;
        image: string | null;
        bio?: string | null;
    };
}

export default function AuthorBioWidget({ author }: AuthorBioWidgetProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-white/10 p-8 text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">About the Author</h3>

            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gray-100 dark:border-slate-800 bg-gray-200 dark:bg-white/10">
                {author.image ? (
                    <Image
                        src={author.image}
                        alt={author.name || "Author"}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-gray-400">
                        {author.name?.charAt(0) || '?'}
                    </div>
                )}
            </div>

            <h4 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2">{author.name || 'TheNextTrade Team'}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {author.bio || 'Contributing writer at TheNextTrade, sharing insights on forex trading strategies and market analysis.'}
            </p>

            <div className="flex justify-center gap-2">
                <a href="#" className="p-2 text-gray-400 hover:text-cyan-500 transition-colors border border-gray-200 dark:border-slate-700 rounded-full hover:border-cyan-500">
                    <Facebook size={16} />
                </a>
                <a href="#" className="p-2 text-gray-400 hover:text-cyan-500 transition-colors border border-gray-200 dark:border-slate-700 rounded-full hover:border-cyan-500">
                    <Twitter size={16} />
                </a>
                <a href="#" className="p-2 text-gray-400 hover:text-cyan-500 transition-colors border border-gray-200 dark:border-slate-700 rounded-full hover:border-cyan-500">
                    <Instagram size={16} />
                </a>
                <a href="#" className="p-2 text-gray-400 hover:text-cyan-500 transition-colors border border-gray-200 dark:border-slate-700 rounded-full hover:border-cyan-500">
                    <Github size={16} />
                </a>
            </div>
        </div>
    );
}
