"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { X, Star, ThumbsUp, ThumbsDown, Target, Award, ExternalLink } from "lucide-react";

interface ReviewData {
  summary: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  verdict: string;
}

interface ReviewItem {
  name: string;
  logo: string | null;
  initials: string;
  color: string;
  rating: number;
  url: string | null;
  review: ReviewData;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : star <= rating
                ? "fill-amber-400/50 text-amber-400"
                : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
            }
          />
        ))}
      </div>
      <span className="text-base font-bold text-gray-900 dark:text-white">{rating}</span>
    </div>
  );
}

export function ReviewBadge({ item }: { item: ReviewItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/20"
      >
        📝 Our Review
      </button>

      {open && createPortal(
        <ReviewModal item={item} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}

function ReviewModal({ item, onClose }: { item: ReviewItem; onClose: () => void }) {
  const hasUrl = item.url && item.url !== "#";

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Review of ${item.name}`} onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1A1C24] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-4 shrink-0">
          <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${
            item.logo
              ? "bg-white border border-gray-100"
              : `bg-gradient-to-br ${item.color} text-white text-sm font-black`
          }`}>
            {item.logo ? (
              <Image src={item.logo} alt={item.name} width={48} height={48} className="object-contain w-full h-full p-1.5" />
            ) : (
              item.initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h3>
            <StarRating rating={item.rating} />
          </div>
          <button
            onClick={onClose}
            aria-label="Close review"
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Summary */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
            <ReactMarkdown>{item.review.summary}</ReactMarkdown>
          </div>

          {/* Pros */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <ThumbsUp size={14} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Pros</span>
            </div>
            <ul className="space-y-1.5">
              {item.review.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <ThumbsDown size={14} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Cons</span>
            </div>
            <ul className="space-y-1.5">
              {item.review.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>

          {/* Best For */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Best For</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{item.review.bestFor}</ReactMarkdown>
            </div>
          </div>

          {/* Verdict */}
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
            <Award size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{item.review.verdict}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        {hasUrl && (
          <div className="p-4 border-t border-gray-100 dark:border-white/5 shrink-0">
            <a
              href={item.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20"
            >
              Open Account
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
