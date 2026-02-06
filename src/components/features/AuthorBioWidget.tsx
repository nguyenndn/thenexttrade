
import { Facebook, Twitter, Instagram, Github } from "lucide-react";
import Image from "next/image";

export default function AuthorBioWidget() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-white/10 p-8 text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">About the Editor</h3>

            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gray-100 dark:border-slate-800">
                <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200"
                    alt="Editor"
                    fill
                    className="object-cover"
                />
            </div>

            <h4 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2">Jonathan Doe</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Senior Market Analyst with 10+ years of experience in Forex & Commodities. Specializing in Price Action and macro-economic trends.
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
