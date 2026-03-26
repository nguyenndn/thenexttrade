'use client';

import { useState, useEffect, memo } from 'react';
import { Quote } from 'lucide-react';

// Fallback quotes in case DB is empty or API fails
const fallbackQuotes = [
    { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
    { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
    { text: "The trend is your friend until the end when it bends.", author: "Ed Seykota" },
];

export default memo(function QuoteDisplay({ isDark }: { isDark: boolean }) {
    const [quote, setQuote] = useState(fallbackQuotes[0]);

    useEffect(() => {
        fetch('/api/quotes?type=HOMEPAGE&active=true')
            .then(res => res.json())
            .then((data: { text: string; author: string }[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    const random = data[Math.floor(Math.random() * data.length)];
                    setQuote({ text: random.text, author: random.author || '' });
                } else {
                    const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
                    setQuote(random);
                }
            })
            .catch(() => {
                const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
                setQuote(random);
            });
    }, []);

    return (
        <div className="relative max-w-4xl mx-auto py-2">
            {/* Premium Decorative Line */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-8 opacity-70"></div>

            <div className="flex flex-col items-center justify-center text-center">

                <div className="flex items-start md:items-center justify-center gap-2 md:gap-4 px-4">
                    {/* Left Quote Icon */}
                    <Quote
                        size={24}
                        className="text-primary flex-shrink-0 fill-primary stroke-none rotate-180 -mt-2 md:mt-0 opacity-80"
                    />

                    <p className="text-xl md:text-2xl font-medium font-heading text-primary leading-relaxed max-w-2xl">
                        {quote.text}
                    </p>

                    {/* Right Quote Icon */}
                    <Quote
                        size={24}
                        className="text-primary flex-shrink-0 fill-primary stroke-none -mt-2 md:mt-0 opacity-80"
                    />
                </div>

                <div className="flex items-center gap-3 mt-6">
                    <span className="w-8 h-px bg-gradient-to-r from-transparent to-gray-400 dark:to-gray-600"></span>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {quote.author}
                    </p>
                    <span className="w-8 h-px bg-gradient-to-l from-transparent to-gray-400 dark:to-gray-600"></span>
                </div>
            </div>
        </div>
    );
});
