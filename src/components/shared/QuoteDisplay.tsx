'use client';

import { useState, useEffect, memo } from 'react';
import { Quote } from 'lucide-react';

const quotes = [
    { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
    { text: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
    { text: "Win or lose, everybody gets what they want out of the market. Some people seem to like to lose, so they win by losing money.", author: "Ed Seykota" },
    { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
    { text: "The trend is your friend until the end when it bends.", author: "Ed Seykota" },
    { text: "Do not anticipate and move without market confirmation—being a little late in your trade is your insurance that you are right or wrong.", author: "Jesse Livermore" },
    { text: "Confidence is not 'I will profit on this trade.' Confidence is 'I will be fine if I don't profit on this trade.'", author: "Yvan Byeajee" },
];

export default memo(function QuoteDisplay({ isDark }: { isDark: boolean }) {
    const [quote, setQuote] = useState(quotes[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setQuote(quotes[randomIndex]);
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
