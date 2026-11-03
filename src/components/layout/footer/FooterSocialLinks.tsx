import Link from "next/link";
import { Facebook, Youtube, Send, Instagram, Mail } from "lucide-react";

const SOCIAL_LINKS = [
    {
        icon: Facebook,
        href: "https://facebook.com/thenexttrade",
        label: "Facebook",
    },
    {
        icon: Youtube,
        href: "https://youtube.com/@thenexttrade",
        label: "Youtube",
    },
    {
        icon: Send,
        href: "https://t.me/thenexttrade",
        label: "Telegram",
    },
    {
        icon: Instagram,
        href: "https://instagram.com/thenexttrade",
        label: "Instagram",
    },
];

export function FooterSocialLinks() {
    return (
        <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
                <Link href="/" className="inline-block mb-4">
                    <h4 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                        TheNext<span className="text-amber-500 font-black">Trade</span>
                    </h4>
                </Link>
                <p className="text-base leading-relaxed font-semibold text-gray-600 dark:text-gray-400 mb-8">
                    Automated MT5 trade telemetry, institutional risk engines, and execution discipline for serious forex traders. Home of the{" "}
                    <strong className="text-amber-500 font-bold">GoldScalperNinja</strong>{" "}
                    trading community &amp; EA ecosystem.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                    {SOCIAL_LINKS.map((social, i) => (
                        <a
                            key={i}
                            href={social.href}
                            aria-label={social.label}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 transition-all hover:text-primary hover:border-primary/30 hover:bg-primary/5 dark:hover:text-white dark:hover:border-primary/50 shadow-sm"
                        >
                            <social.icon size={18} />
                        </a>
                    ))}
                </div>
                <a
                    href="mailto:support@thenexttrade.com"
                    className="text-base font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-2"
                >
                    <Mail size={16} /> support@thenexttrade.com
                </a>
            </div>
        </div>
    );
}
