"use client";

import { useEffect, useState } from "react";
import { Link as LinkIcon, List } from "lucide-react";

interface Heading {
    id: string;
    text: string;
    level: number;
}

export default function TableOfContents() {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        // Wait for markdown render
        const timer = setTimeout(() => {
            const articleContent = document.querySelector(".prose"); // Target active article content
            if (!articleContent) return;

            const elements = articleContent.querySelectorAll("h2, h3");
            const headingData: Heading[] = [];

            elements.forEach((elem, index) => {
                // Auto-generate ID if missing
                if (!elem.id) {
                    elem.id = `heading-${index}`;
                }
                headingData.push({
                    id: elem.id,
                    text: elem.textContent || "",
                    level: Number(elem.tagName.substring(1)),
                });
            });

            setHeadings(headingData);
        }, 500); // Small delay to ensure content is ready

        // Intersection Observer for Active State
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-100px 0px -66%" }
        );

        const headingsElements = document.querySelectorAll(".prose h2, .prose h3");
        headingsElements.forEach((elem) => observer.observe(elem));

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    if (headings.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Accent top stripe */}
            <div className="h-1 bg-gradient-to-r from-primary to-cyan-400" />
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                    <List size={16} className="text-primary" />
                    <span>Contents</span>
                </div>
                <nav className="space-y-0.5 relative border-l-2 border-gray-100 dark:border-white/10">
                    {headings.map((heading) => (
                        <a
                            key={heading.id}
                            href={`#${heading.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
                                setActiveId(heading.id);
                            }}
                            className={`block text-[13px] py-1.5 pl-4 border-l-2 -ml-[2px] transition-all duration-200 
                                ${activeId === heading.id
                                    ? "border-primary text-primary font-bold bg-primary/5 rounded-r-lg"
                                    : "border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300"
                                }
                                ${heading.level === 3 ? "ml-3 text-xs" : ""}
                            `}
                        >
                            {heading.text}
                        </a>
                    ))}
                </nav>
            </div>
        </div>
    );
}
