"use client";

import { useState } from "react";
import { Copy, Check, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ArticleImagePrompts } from "@/lib/articles/article-readiness.shared";

interface ArticleImagePromptModalProps {
  prompts: ArticleImagePrompts;
  onClose: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      aria-label="Copy prompt"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function PromptBlock({ label, prompt, path }: { label: string; prompt: string; path: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-gold" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">{label}</span>
        </div>
        <CopyButton text={prompt} />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{prompt}</p>
      <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
        <span className="font-mono bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">{path}</span>
      </div>
    </div>
  );
}

export function ArticleImagePromptModal({ prompts, onClose }: ArticleImagePromptModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E2028]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
              <Sparkles size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">Image Prompts</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">{prompts.title}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="p-2 h-auto w-auto" aria-label="Close modal">
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Featured */}
          <PromptBlock
            label="Featured Image"
            prompt={prompts.featured.prompt}
            path={prompts.featured.suggestedPath}
          />

          {/* Inline */}
          {prompts.inline.map((item: { prompt: string; suggestedPath: string }, i: number) => (
            <PromptBlock
              key={i}
              label={`Inline Image ${i + 1}`}
              prompt={item.prompt}
              path={item.suggestedPath}
            />
          ))}

          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center pt-2">
            Copy these prompts and paste into ChatGPT, DALL-E, or Midjourney. Save generated images to the suggested paths.
          </p>
        </div>
      </div>
    </div>
  );
}
