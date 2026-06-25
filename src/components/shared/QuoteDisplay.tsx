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
    <div className="relative max-w-4xl mx-auto py-0.5">
      {/* Premium Decorative Line */}
      <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-2 opacity-50"></div>

      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-start justify-center gap-1.5 px-2 max-w-xl">
          {/* Left Quote Icon */}
          <Quote
            size={11}
            className="text-primary flex-shrink-0 fill-primary stroke-none rotate-180 -mt-0.5 opacity-70"
          />

          <p className="text-[12px] font-semibold font-heading text-primary leading-normal tracking-wide">
            {quote.text}
          </p>

          {/* Right Quote Icon */}
          <Quote
            size={11}
            className="text-primary flex-shrink-0 fill-primary stroke-none -mt-0.5 opacity-70"
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="w-4 h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700"></span>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500'}`}>
            {quote.author}
          </p>
          <span className="w-4 h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700"></span>
        </div>
      </div>
    </div>
  );
});
