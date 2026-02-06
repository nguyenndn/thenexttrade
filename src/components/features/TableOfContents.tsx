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
        <div className="hidden lg:block sticky top-32 max-h-[80vh] overflow-y-auto pr-4">
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-bold text-sm uppercase tracking-wider">
                <List size={16} />
                <span>Table of Contents</span>
            </div>
            <nav className="space-y-1 relative border-l border-gray-100 dark:border-white/10">
                {headings.map((heading) => (
                    <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
                            setActiveId(heading.id);
                        }}
                        className={`block text-sm py-1.5 pl-4 border-l-2 transition-all duration-200 
                            ${activeId === heading.id
                                ? "border-[#00C888] text-[#00C888] font-medium"
                                : "border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                            }
                            ${heading.level === 3 ? "ml-4 text-xs" : ""}
                        `}
                    >
                        {heading.text}
                    </a>
                ))}
            </nav>
        </div>
    );
}
