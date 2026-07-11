'use client';

import { FileText, User, FolderOpen, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ContentItem {
 pathname: string;
 slug: string;
 title: string;
 author: string;
 category: string;
 views: number;
 publishedAt: string | null;
}

interface AuthorItem {
 name: string;
 views: number;
}

interface CategoryItem {
 name: string;
 views: number;
}

interface Props {
 content: ContentItem[];
 authors: AuthorItem[];
 categories: CategoryItem[];
 totalArticleViews: number;
 loading?: boolean;
}

export function ContentAnalyticsPanel({ content, authors, categories, totalArticleViews, loading }: Props) {
 const maxViews = content[0]?.views ?? 1;
 const maxAuthorViews = authors[0]?.views ?? 1;
 const maxCatViews = categories[0]?.views ?? 1;

 if (loading) {
 return (
 <div className="space-y-4">
 {[1,2].map(i => (
 <div key={i} className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 animate-pulse">
 <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/4 mb-4" />
 <div className="space-y-3">
 {[1,2,3].map(j => <div key={j} className="h-8 bg-gray-200 dark:bg-white/5 rounded" />)}
 </div>
 </div>
 ))}
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {/* Summary stat */}
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
 <Eye className="w-4 h-4 text-indigo-500" />
 </div>
 <div>
 <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalArticleViews.toLocaleString()}</p>
 <p className="text-xs text-gray-500">total article views this period</p>
 </div>
 </div>
 </div>

 {/* Top Articles */}
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
 <div className="flex items-center gap-2 mb-4">
 <FileText className="w-4 h-4 text-indigo-500" />
 <h2 className="text-sm font-bold text-gray-900 dark:text-white">Top Articles</h2>
 <span className="text-xs text-gray-400 ml-auto">{content.length} articles</span>
 </div>

 <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-200 dark:border-white/10 mb-1">
 <span>Article</span>
 <span>Views</span>
 </div>

 <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
 {content.map((item, idx) => {
 const pct = Math.round((item.views / maxViews) * 100);
 return (
 <div key={item.pathname} className="relative group">
 <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/5 rounded-md transition-all"
 style={{ width: `${pct}%` }} />
 <div className="relative flex items-center justify-between py-2.5 px-3">
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <span className="text-xs text-gray-400 w-5 shrink-0 font-mono">{idx + 1}</span>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5">
 <span className="text-sm text-gray-700 dark:text-gray-200 truncate font-medium">
 {item.title}
 </span>
 <Link href={item.pathname} target="_blank" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
 <ExternalLink size={12} className="text-gray-400" />
 </Link>
 </div>
 <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
 <span>{item.author}</span>
 <span>·</span>
 <span>{item.category}</span>
 </div>
 </div>
 </div>
 <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0 ml-3">
 {item.views.toLocaleString()}
 </span>
 </div>
 </div>
 );
 })}
 {!content.length && <p className="text-sm text-gray-400 text-center py-8">No article views yet</p>}
 </div>
 </div>

 {/* Author & Category side by side */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Author Analytics */}
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
 <div className="flex items-center gap-2 mb-4">
 <User className="w-4 h-4 text-cyan-500" />
 <h2 className="text-sm font-bold text-gray-900 dark:text-white">Author Performance</h2>
 </div>
 <div className="space-y-0.5">
 {authors.map(a => {
 const pct = Math.round((a.views / maxAuthorViews) * 100);
 return (
 <div key={a.name} className="relative">
 <div className="absolute inset-0 bg-cyan-50 dark:bg-cyan-500/5 rounded-md" style={{ width: `${pct}%` }} />
 <div className="relative flex items-center justify-between py-2.5 px-3">
 <span className="text-sm text-gray-700 dark:text-gray-300">{a.name}</span>
 <span className="text-sm font-bold text-gray-900 dark:text-white">{a.views.toLocaleString()}</span>
 </div>
 </div>
 );
 })}
 {!authors.length && <p className="text-sm text-gray-400 text-center py-6">No data</p>}
 </div>
 </div>

 {/* Category Analytics */}
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5">
 <div className="flex items-center gap-2 mb-4">
 <FolderOpen className="w-4 h-4 text-amber-500" />
 <h2 className="text-sm font-bold text-gray-900 dark:text-white">Category Performance</h2>
 </div>
 <div className="space-y-0.5">
 {categories.map(c => {
 const pct = Math.round((c.views / maxCatViews) * 100);
 return (
 <div key={c.name} className="relative">
 <div className="absolute inset-0 bg-amber-50 dark:bg-amber-500/5 rounded-md" style={{ width: `${pct}%` }} />
 <div className="relative flex items-center justify-between py-2.5 px-3">
 <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
 <span className="text-sm font-bold text-gray-900 dark:text-white">{c.views.toLocaleString()}</span>
 </div>
 </div>
 );
 })}
 {!categories.length && <p className="text-sm text-gray-400 text-center py-6">No data</p>}
 </div>
 </div>
 </div>
 </div>
 );
}
