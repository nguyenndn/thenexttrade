import { Facebook, Twitter, Instagram, Github } from "lucide-react";
import Image from "next/image";

interface AuthorBioWidgetProps {
    author: {
        name: string | null;
        image: string | null;
        bio?: string | null;
        socialLinks?: {
            facebook?: string | null;
            twitter?: string | null;
            instagram?: string | null;
            github?: string | null;
        } | null;
    };
}

export default function AuthorBioWidget({ author }: AuthorBioWidgetProps) {
    const activeSocials = [
        {
            name: "Facebook",
            icon: Facebook,
            href: author.socialLinks?.facebook,
        },
        {
            name: "Twitter",
            icon: Twitter,
            href: author.socialLinks?.twitter,
        },
        {
            name: "Instagram",
            icon: Instagram,
            href: author.socialLinks?.instagram,
        },
        {
            name: "GitHub",
            icon: Github,
            href: author.socialLinks?.github,
        },
    ].filter(
        (item): item is { name: string; icon: typeof Facebook; href: string } =>
            Boolean(item.href && item.href !== "#")
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-none border border-dashboard p-8 text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">
                About the Author
            </h3>

            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-dashboard dark:border-slate-800 bg-gray-200 dark:bg-white/10">
                {author.image ? (
                    <Image
                        src={author.image}
                        alt={author.name || "Author"}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300">
                        {author.name?.charAt(0) || "?"}
                    </div>
                )}
            </div>

            <h4 className="font-serif text-xl font-bold text-gray-700 dark:text-white mb-2">
                {author.name || "TheNextTrade Team"}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {author.bio ||
                    "Contributing writer at TheNextTrade, sharing insights on forex trading strategies and market analysis."}
            </p>

            {activeSocials.length > 0 && (
                <div className="flex justify-center gap-2">
                    {activeSocials.map((social) => {
                        const Icon = social.icon;
                        return (
                            <a
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={social.name}
                                className="p-2 text-gray-500 hover:text-cyan-500 transition-colors border border-dashboard dark:border-slate-700 rounded-full hover:border-cyan-500"
                            >
                                <Icon size={16} />
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
