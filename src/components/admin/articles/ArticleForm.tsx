"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Trash2, Clock, FileText, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { TagInput } from "./TagInput";
import { RichTextEditor } from "./RichTextEditor";
import { SeoAnalysisPanel } from "./SeoAnalysisPanel";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/Button";

interface ArticleFormProps {
    initialData?: {
        id?: string;
        title: string;
        content: string;
        excerpt: string;
        categoryId: string;
        status: string;
        thumbnail: string;
        slug?: string;
        metaTitle?: string;
        metaDescription?: string;
        publishedAt?: string;
        tags?: any[];
        authorId?: string;
        isFeatured?: boolean;
        focusKeyword?: string;
    };
    categories: { id: string; name: string }[];
    isEditMode?: boolean;
}

export function ArticleForm({ initialData, categories, isEditMode = false }: ArticleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [authors, setAuthors] = useState<{ id: string, name: string }[]>([]);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        content: initialData?.content || "",
        excerpt: initialData?.excerpt || "",
        categoryId: initialData?.categoryId || "",
        status: initialData?.status || "DRAFT",
        thumbnail: initialData?.thumbnail || "",
        slug: initialData?.slug || "",
        metaTitle: initialData?.metaTitle || "",
        metaDescription: initialData?.metaDescription || "",
        focusKeyword: initialData?.focusKeyword || "",
        publishedAt: initialData?.publishedAt ? new Date(initialData.publishedAt).toISOString().slice(0, 16) : "",
        tags: initialData?.tags?.map(t => t.tagId || t.id) || [] as string[],
        authorId: initialData?.authorId || "",
        isFeatured: initialData?.isFeatured || false,
    });

    const debouncedFormData = useDebounce(formData, 2000);
    const firstRender = useRef(true);

    // Fetch Authors
    useEffect(() => {
        fetch('/api/users/authors')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAuthors(data);
            })
            .catch(err => console.error("Failed to fetch authors", err));
    }, []);

    // Auto-save Logic
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        if (debouncedFormData !== initialData) {
            setSaveStatus('unsaved');
            if (isEditMode && formData.status === 'DRAFT') {
                setSaveStatus('saving');
                handleAutoSave();
            }
        }
    }, [debouncedFormData]);

    const handleAutoSave = async () => {
        try {
            await fetch(`/api/articles/${initialData?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            setSaveStatus('saved');
        } catch (error) {
            setSaveStatus('unsaved');
        }
    };

    // Stats
    const wordCount = formData.content ? formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length : 0;
    const readingTime = Math.ceil(wordCount / 200);

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setSaveStatus('saving');

        try {
            const url = isEditMode ? `/api/articles/${initialData?.id}` : "/api/articles";
            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed");
            }

            setSaveStatus('saved');
            router.push("/admin/articles");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
            setSaveStatus('unsaved');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/articles/${initialData?.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            router.push("/admin/articles");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
            setIsDeleting(false);
        }
    }

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Header */}
            {/* Header */}
            <div className="sticky top-0 z-40 bg-gray-50/95 dark:bg-[#0B0E14]/95 backdrop-blur-sm py-4 border-b border-gray-200 dark:border-white/5 -mx-4 px-4 lg:-mx-8 lg:px-8 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/articles" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-gray-500" />
                        </Link>
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-2">
                            {isEditMode ? "Edit Article" : "Create Article"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-normal px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500">
                            {saveStatus === 'saved' && <span className="flex items-center gap-1 text-green-500"><CheckCircle size={12} /> Saved</span>}
                            {saveStatus === 'saving' && <span className="flex items-center gap-1 text-blue-500"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
                            {saveStatus === 'unsaved' && <span className="flex items-center gap-1 text-orange-500"><AlertCircle size={12} /> Unsaved</span>}
                        </span>

                        {/* Delete Button (Always Visible in Edit Mode) */}
                        {isEditMode && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDelete}
                                disabled={isDeleting || isSubmitting}
                                className="p-2 h-auto w-auto text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                title="Delete Article"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                            disabled={isSubmitting}
                            className="px-4 py-2 h-auto text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            Save Draft
                        </Button>

                        <Button
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className="flex items-center h-auto gap-2 px-6 py-2 bg-primary hover:bg-[#00a872] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isEditMode ? "Update" : "Publish"}
                        </Button>
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-14 hidden lg:block">
                    {isEditMode ? "Edit content and manage publication settings." : "Write compelling content for your audience."}
                </p>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Article Title"
                                className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-900 dark:text-white"
                                value={formData.title}
                                onChange={e => {
                                    setFormData(prev => ({
                                        ...prev,
                                        title: e.target.value,
                                        // Auto-generate slug if it's empty or looks like a draft slug
                                        slug: prev.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                                    }));
                                }}
                            />
                            {/* Slug Editor */}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Permalink:</span>
                                <span className="text-gray-400">/articles/</span>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none text-gray-700 dark:text-gray-300 transition-colors"
                                />
                            </div>
                        </div>

                        <RichTextEditor
                            content={formData.content}
                            onChange={(content) => setFormData({ ...formData, content })}
                        />
                    </div>

                    {/* Yoast SEO Analysis (Lite) */}
                    <SeoAnalysisPanel
                        focusKeyword={formData.focusKeyword || ""}
                        setFocusKeyword={(val) => setFormData({ ...formData, focusKeyword: val })}
                        title={formData.title}
                        slug={formData.slug}
                        metaDescription={formData.metaDescription}
                        content={formData.content}
                        thumbnail={formData.thumbnail}
                        onAiGenerate={(field) => {
                            if (field === 'title') {
                                setFormData(prev => ({ ...prev, metaTitle: prev.title.substring(0, 60) }));
                            }
                            if (field === 'description') {
                                // Basic AI: strip HTML and take first 150 chars
                                const text = formData.content.replace(/<[^>]*>?/gm, '');
                                setFormData(prev => ({ ...prev, metaDescription: text.substring(0, 160) + (text.length > 160 ? "..." : "") }));
                            }
                        }}
                    />

                    {/* SEO Settings */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">SEO Settings</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Title</label>
                                <input
                                    type="text"
                                    value={formData.metaTitle}
                                    onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                                    className="w-full p-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary"
                                    placeholder="SEO Title (defaults to article title)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
                                <textarea
                                    value={formData.metaDescription}
                                    onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                                    className="w-full p-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary resize-none"
                                    rows={3}
                                    placeholder="Brief description for search engines..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Meta */}
                <div className="space-y-6">

                    {/* Publish Action */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Publish</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (formData.slug) window.open(`/articles/${formData.slug}?preview=true`, '_blank');
                                }}
                                className="text-xs h-auto font-bold text-blue-500 hover:text-blue-600 border border-blue-500/20 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                            >
                                Preview
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                id="isFeatured"
                                checked={formData.isFeatured}
                                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-900 dark:text-gray-300">Featured Article</label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Author</label>
                            <select
                                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary"
                                value={formData.authorId}
                                onChange={e => setFormData({ ...formData, authorId: e.target.value })}
                            >
                                <option value="">Select Author</option>
                                {authors.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Status</label>
                            <select
                                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="PENDING">Pending Review</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Publish Date</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary"
                                value={formData.publishedAt}
                                onChange={e => setFormData({ ...formData, publishedAt: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Featured Image</h3>
                        <ImageUploader
                            value={formData.thumbnail}
                            onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                        />
                    </div>

                    {/* Taxonomies */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Category</label>
                            <select
                                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary"
                                value={formData.categoryId}
                                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tags</label>
                            <TagInput
                                value={formData.tags}
                                onChange={(tags) => setFormData({ ...formData, tags })}
                            />
                        </div>
                    </div>

                    {/* Excerpt */}
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Excerpt</label>
                        <textarea
                            className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary resize-none"
                            rows={4}
                            placeholder="Short summary..."
                            value={formData.excerpt}
                            onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Stats Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0B0E14] border-t border-gray-200 dark:border-white/10 p-2 flex gap-6 text-xs text-gray-500 dark:text-gray-400 justify-end px-8 z-40">
                <span className="flex items-center gap-1"><FileText size={14} /> {wordCount} words</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {readingTime} min read</span>
            </div>
        </div>
    );
}
