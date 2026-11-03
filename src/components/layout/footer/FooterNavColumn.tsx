import Link from "next/link";
import type { FooterNavSection } from "./footer-navigation-data";

interface FooterNavColumnProps {
    section: FooterNavSection;
}

export function FooterNavColumn({ section }: FooterNavColumnProps) {
    return (
        <div className="w-full">
            <details
                open
                className="group border-b sm:border-b-0 border-gray-200 dark:border-white/10"
            >
                <summary className="flex justify-between items-center font-bold text-gray-700 dark:text-white text-sm uppercase tracking-wider py-4 sm:py-0 sm:mb-6 cursor-pointer sm:cursor-default list-none marker:hidden [&::-webkit-details-marker]:hidden sm:pointer-events-none">
                    {section.title}
                    <span className="transition group-open:rotate-180 text-gray-500 sm:hidden">
                        <svg
                            fill="none"
                            height="18"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="18"
                            aria-hidden="true"
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </span>
                </summary>
                <ul className="space-y-3 px-2 pb-4 sm:px-0 sm:pb-0">
                    {section.links.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );
}
