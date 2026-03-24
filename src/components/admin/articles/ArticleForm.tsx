"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Clock, FileText, CheckCircle, AlertCircle, CheckSquare, Square, ChevronDown, Image as ImageIcon, X as XIcon, BookOpen, ListTree } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MediaLibraryModal } from "@/components/admin/media/MediaLibraryModal";
import { TagInput } from "./TagInput";
import { RichTextEditor } from "./RichTextEditor";
import { SeoAnalysisPanel } from "./SeoAnalysisPanel";
import { useDebounce } from "@/hooks/useDebounce";
import { useAutoSave } from '@/hooks/useAutoSave';
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
        schemaType?: string;
        estimatedTime?: number | null;
        updatedAt?: string; // Added for draft comparison
    };
    categories: { id: string; name: string }[];
    isEditMode?: boolean;
}

// Helper Sub-Component to DRY Dropdown Menus
function FormSelect({ label, value, options, onChange, placeholder }: { label: string, value: string, options: { label: string, value: string }[], onChange: (val: string) => void, placeholder: string }) {
    return (
        <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
            <DropdownMenu className="w-full block">
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full flex justify-between items-center text-sm font-normal bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 px-3 py-2 h-auto text-left shadow-none rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all">
                        <span className={value ? "text-gray-900 dark:text-gray-100 truncate pr-2" : "text-gray-500 truncate pr-2"}>
                            {options.find(o => o.value === value)?.label || placeholder}
                        </span>
                        <ChevronDown size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[200px] max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem onClick={() => onChange("")}>{placeholder}</DropdownMenuItem>
                    {options.map(o => (
                        <DropdownMenuItem key={o.value} onClick={() => onChange(o.value)}>{o.label}</DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function ArticleForm({ initialData, categories, isEditMode = false }: ArticleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [authors, setAuthors] = useState<{ id: string, name: string }[]>([]);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
        schemaType: initialData?.schemaType || "ARTICLE",
        estimatedTime: initialData?.estimatedTime ?? null,
    });

    // Integrated Local Storage Auto-Save hook
    const { getDraft, clearDraft, draftAutoSavedAt } = useAutoSave(formData, initialData?.id);
    const [hasUnsavedLocalDraft, setHasUnsavedLocalDraft] = useState(false);
    const [localDraftTime, setLocalDraftTime] = useState<Date | null>(null);

    const debouncedFormData = useDebounce(formData, 2000);
    const firstRender = useRef(true);

    // Prompt user to load draft if it exists
    useEffect(() => {
        const draft = getDraft();
        if (draft) {
            // If editing, check if local draft is newer than DB data
            if (initialData?.updatedAt) {
                const dbTime = new Date(initialData.updatedAt).getTime();
                const localTime = draft.timestamp.getTime();
                if (localTime > dbTime + 1000) { // Add 1s buffer
                    setHasUnsavedLocalDraft(true);
                    setLocalDraftTime(draft.timestamp);
                }
            } else {
                setHasUnsavedLocalDraft(true);
                setLocalDraftTime(draft.timestamp);
            }
        }
    }, [getDraft, initialData]);

    const handleRestoreDraft = () => {
        const draft = getDraft();
        if (draft) {
            setFormData(draft.data);
            setHasUnsavedLocalDraft(false);
            toast.success("Local draft restored successfully!");
        }
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setHasUnsavedLocalDraft(false);
    };

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

    // Table of Contents
    const tocHeadings = useMemo(() => {
        if (!formData.content) return [];
        const regex = /<h([1-3])[^>]*>(.*?)<\/h[1-3]>/gi;
        const matches = [];
        let match;
        let i = 0;
        while ((match = regex.exec(formData.content)) !== null) {
            matches.push({
                id: `heading-${i++}`,
                text: match[2].replace(/<[^>]*>/g, ''),
                level: parseInt(match[1]),
            });
        }
        return matches;
    }, [formData.content]);

    // Reading Level Score
    const readingLevel = useMemo(() => {
        const text = formData.content?.replace(/<[^>]*>/g, '') || '';
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const syllables = words.reduce((acc, word) => acc + (word.match(/[aeiouy]{1,2}/g)?.length || 1), 0);
        const totalWords = words.length || 1;
        const totalSentences = sentences.length || 1;
        const score = 206.835 - (1.015 * (totalWords / totalSentences)) - (84.6 * (syllables / totalWords));
        if (score >= 80) return { label: 'Very Easy', color: 'text-green-500', score: Math.round(score) };
        if (score >= 60) return { label: 'Easy', color: 'text-emerald-500', score: Math.round(score) };
        if (score >= 40) return { label: 'Moderate', color: 'text-yellow-500', score: Math.round(score) };
        if (score >= 20) return { label: 'Difficult', color: 'text-orange-500', score: Math.round(score) };
        return { label: 'Very Hard', color: 'text-red-500', score: Math.round(score) };
    }, [formData.content]);

    // Unsaved changes warning
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (saveStatus !== 'saved') {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveStatus]);

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();
        
        // Client-side validation to provide immediate, specific feedback
        const missingFields: string[] = [];
        if (!formData.title?.trim()) missingFields.push("Article Title");
        if (!formData.categoryId) missingFields.push("Category");
        
        // Quick check if content is truly empty (ignoring empty HTML tags)
        const textContent = formData.content ? formData.content.replace(/<[^>]*>?/gm, '').trim() : '';
        if (!textContent) missingFields.push("Content");

        if (missingFields.length > 0) {
            toast.warning(`Missing required fields: ${missingFields.join(', ')}`);
            return;
        }

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
                toast.error(error.error || "Failed to save article");
                setSaveStatus('unsaved');
                return;
            }

            const data = await res.json();
            
            // On successful submit, clear the local storage draft
            clearDraft();

            toast.success(isEditMode ? "Article updated successfully!" : "Article created successfully!");
            router.push("/admin/articles");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
            setSaveStatus('unsaved');
        } finally {
            setIsSubmitting(false);
        }
    }

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/articles/${initialData?.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Article deleted safely.");
            setIsConfirmOpen(false);
            router.push("/admin/articles");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
            setIsConfirmOpen(false);
            setIsDeleting(false);
        }
    }

    return (
        <div className="w-full space-y-6 pb-24">
            {/* Header */}
            <AdminPageHeader
                title={formData.title ? `Editing: ${formData.title}` : (isEditMode ? "Edit Article" : "New Article")}
                description={isEditMode ? "Edit article content and settings." : "Create a new blog post."}
                backHref="/admin/articles"
            >
                <span className="text-xs font-normal px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 flex items-center gap-2">
                    {draftAutoSavedAt && (
                        <span className="flex items-center gap-1 text-gray-400 border-r border-gray-300 dark:border-white/10 pr-2 mr-1">
                            <Save size={12} /> Local: {draftAutoSavedAt.toLocaleTimeString('en-US')}
                        </span>
                    )}
                    {saveStatus === 'saved' && <span className="flex items-center gap-1 text-green-500"><CheckCircle size={12} /> Cloud Saved</span>}
                    {saveStatus === 'saving' && <span className="flex items-center gap-1 text-blue-500"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
                    {saveStatus === 'unsaved' && <span className="flex items-center gap-1 text-orange-500"><AlertCircle size={12} /> Unsaved</span>}
                </span>

                {isEditMode && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={confirmDelete}
                        disabled={isDeleting || isSubmitting}
                        className="p-2 h-auto w-auto text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        title="Delete Article"
                        aria-label="Delete Article"
                    >
                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                    disabled={isSubmitting}
                >
                    Save Draft
                </Button>

                <Button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    variant="primary"
                    className="flex items-center h-auto gap-2 shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isEditMode ? "Update" : "Publish"}
                </Button>
            </AdminPageHeader>

            {hasUnsavedLocalDraft && (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 p-4 rounded-r-xl flex items-center justify-between mb-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />
                        <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Found an unsaved local draft ({localDraftTime?.toLocaleTimeString('en-US')}).
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                                Would you like to restore this draft and continue editing?
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleDiscardDraft} className="text-yellow-700 bg-white hover:bg-yellow-100 border-yellow-200">Discard</Button>
                        <Button type="button" size="sm" onClick={handleRestoreDraft} className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 shadow-sm">Restore</Button>
                    </div>
                </div>
            )}

            {/* Main Area: Grid Layout (Editor + Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Zenith Focus Editor - Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Article Title"
                                className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-900 dark:text-white"
                                value={formData.title}
                                onChange={e => {
                                    const newTitle = e.target.value;
                                    setFormData(prev => {
                                        // Auto-generate slug if title changes and slug hasn't been manually detached from title.
                                        const expectedOldSlug = prev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                                        const shouldUpdateSlug = !prev.slug || prev.slug === expectedOldSlug;
                                        
                                        return {
                                            ...prev,
                                            title: newTitle,
                                            slug: shouldUpdateSlug ? newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : prev.slug
                                        };
                                    });
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
                                // Basic AI: strip HTML and take first 150 chars, with fallback to title or metaTitle
                                const text = formData.content.replace(/<[^>]*>?/gm, '');
                                const fallbackTitle = formData.metaTitle || formData.title;
                                const descr = text.trim() 
                                    ? text.substring(0, 160) + (text.length > 160 ? "..." : "")
                                    : fallbackTitle 
                                        ? `Read our comprehensive guide on ${fallbackTitle.trim()}. Discover insights, strategies, and key takeaways.`
                                        : "Please add a title or some content first to generate a description.";
                                setFormData(prev => ({ ...prev, metaDescription: descr }));
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
                                    className="w-full p-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="SEO Title (defaults to article title)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
                                <textarea
                                    value={formData.metaDescription}
                                    onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                                    className="w-full p-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                    rows={3}
                                    placeholder="Brief description for search engines..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visible Settings Sidebar - Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm p-5 space-y-6">
                        {/* Publish Settings */}

                        {/* Publish Action */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-2">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Publish Info</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                onClick={() => {
                                    const previewWindow = window.open('', '_blank');
                                    if (!previewWindow) {
                                        toast.error('Popup blocked. Please allow popups for this site.');
                                        return;
                                    }
                                    previewWindow.document.write(`
                                        <!DOCTYPE html>
                                        <html lang="en">
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <title>Preview: ${formData.title || 'Untitled'}</title>
                                            <style>
                                                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                                                body { font-family: 'Inter', -apple-system, sans-serif; background: #0B0E14; color: #e5e7eb; line-height: 1.8; padding: 40px 20px; }
                                                .preview-banner { background: linear-gradient(135deg, #f59e0b22, #f59e0b11); border: 1px solid #f59e0b44; color: #f59e0b; padding: 10px 20px; border-radius: 12px; text-align: center; font-size: 13px; font-weight: 600; margin-bottom: 32px; max-width: 800px; margin-left: auto; margin-right: auto; }
                                                .container { max-width: 800px; margin: 0 auto; }
                                                h1 { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 16px; line-height: 1.2; }
                                                .meta { color: #9ca3af; font-size: 14px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #ffffff10; }
                                                .thumbnail { width: 100%; border-radius: 16px; margin-bottom: 32px; max-height: 400px; object-fit: cover; }
                                                .content { font-size: 1.1rem; }
                                                .content h2 { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 32px 0 16px; }
                                                .content h3 { font-size: 1.25rem; font-weight: 600; color: #fff; margin: 24px 0 12px; }
                                                .content p { margin-bottom: 16px; }
                                                .content img { max-width: 100%; border-radius: 12px; margin: 16px 0; }
                                                .content a { color: #00C888; text-decoration: underline; }
                                                .content blockquote { border-left: 3px solid #00C888; padding-left: 16px; margin: 16px 0; color: #9ca3af; font-style: italic; }
                                                .content ul, .content ol { padding-left: 24px; margin-bottom: 16px; }
                                                .content li { margin-bottom: 8px; }
                                                .content pre { background: #151925; padding: 16px; border-radius: 12px; overflow-x: auto; margin: 16px 0; }
                                                .content code { font-family: 'Fira Code', monospace; font-size: 0.9em; }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="preview-banner">PREVIEW MODE — Unsaved Content</div>
                                            <div class="container">
                                                <h1>${formData.title || 'Untitled Article'}</h1>
                                                <div class="meta">Draft Preview • ${new Date().toLocaleDateString('en-US')}</div>
                                                ${formData.thumbnail ? `<img class="thumbnail" src="${formData.thumbnail}" alt="" />` : ''}
                                                <div class="content">${formData.content || '<p style="color:#6b7280">No content available...</p>'}</div>
                                            </div>
                                        </body>
                                        </html>
                                    `);
                                    previewWindow.document.close();
                                }}
                                className="text-xs h-auto font-bold text-blue-500 hover:text-blue-600 border border-blue-500/20 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                            >
                                Preview
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                                className={`w-auto h-auto p-0 hover:bg-transparent transition-colors ${formData.isFeatured ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                aria-label="Toggle Featured Article"
                            >
                                {formData.isFeatured ? <CheckSquare size={20} aria-hidden="true" /> : <Square size={20} aria-hidden="true" />}
                            </Button>
                            <label className="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer" onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}>Featured Article</label>
                        </div>

                        <FormSelect
                            label="Author"
                            value={formData.authorId}
                            options={authors.map(a => ({ label: a.name, value: a.id }))}
                            onChange={(val) => setFormData({ ...formData, authorId: val })}
                            placeholder="Select Author"
                        />
                        <FormSelect
                            label="Status"
                            value={formData.status}
                            options={[
                                { label: 'Draft', value: 'DRAFT' },
                                { label: 'Published', value: 'PUBLISHED' },
                                { label: 'Pending Review', value: 'PENDING' },
                                { label: 'Archived', value: 'ARCHIVED' }
                            ]}
                            onChange={(val) => setFormData({ ...formData, status: val })}
                            placeholder="Select Status"
                        />
                        <FormSelect
                            label="Schema Type"
                            value={formData.schemaType}
                            options={[
                                { label: 'Article (Default)', value: 'ARTICLE' },
                                { label: 'HowTo Guide', value: 'HOWTO' },
                            ]}
                            onChange={(val) => setFormData({ ...formData, schemaType: val })}
                            placeholder="Select Schema"
                        />
                        {formData.schemaType === 'HOWTO' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Estimated Time (minutes)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary"
                                    value={formData.estimatedTime ?? ''}
                                    onChange={e => setFormData({ ...formData, estimatedTime: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="e.g. 30"
                                />
                            </div>
                        )}

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
                    <div className="space-y-4">
                        <div className="border-b border-gray-100 dark:border-white/10 pb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Featured Image</h3>
                        </div>
                        {formData.thumbnail ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer" onClick={() => setIsMediaLibraryOpen(true)}>
                                <img src={formData.thumbnail} alt="Featured" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:text-white rounded-full h-10 w-10 p-0"
                                        onClick={(e) => { e.stopPropagation(); setIsMediaLibraryOpen(true); }}
                                        aria-label="Change Thumbnail"
                                    >
                                        <ImageIcon size={18} />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-500 hover:text-white rounded-full h-10 w-10 p-0"
                                        onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, thumbnail: '' }); }}
                                        aria-label="Remove Thumbnail"
                                    >
                                        <XIcon size={18} />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsMediaLibraryOpen(true)}
                                className="aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-primary bg-gray-50 dark:bg-black/20 flex flex-col items-center justify-center cursor-pointer transition-all group"
                            >
                                <div className="p-3 bg-white dark:bg-white/5 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2 text-gray-400 group-hover:text-primary">
                                    <ImageIcon size={24} />
                                </div>
                                <p className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">Choose from Media Library</p>
                                <p className="text-[10px] text-gray-400 mt-1">Click to browse your uploads</p>
                            </div>
                        )}
                    </div>

                    <MediaLibraryModal
                        isOpen={isMediaLibraryOpen}
                        onClose={() => setIsMediaLibraryOpen(false)}
                        onSelect={(url) => {
                            setFormData({ ...formData, thumbnail: url });
                            setIsMediaLibraryOpen(false);
                        }}
                    />

                    {/* Taxonomies */}
                    <div className="space-y-4">
                        <div className="border-b border-gray-100 dark:border-white/10 pb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Classification</h3>
                        </div>
                        <FormSelect
                            label="Category"
                            value={formData.categoryId}
                            options={categories.map(c => ({ label: c.name, value: c.id }))}
                            onChange={(val) => setFormData({ ...formData, categoryId: val })}
                            placeholder="Select Category"
                        />

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tags</label>
                            <TagInput
                                value={formData.tags}
                                onChange={(tags) => setFormData({ ...formData, tags })}
                            />
                        </div>
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-4">
                        <div className="border-b border-gray-100 dark:border-white/10 pb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Excerpt</h3>
                        </div>
                        <textarea
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder-gray-400"
                            rows={4}
                            placeholder="Short summary of the article..."
                            value={formData.excerpt}
                            onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                        />
                    </div>

                    {/* Table of Contents */}
                    {tocHeadings.length > 0 && (
                        <div className="space-y-4">
                            <div className="border-b border-gray-100 dark:border-white/10 pb-2">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                    <ListTree size={14} /> Table of Contents
                                </h3>
                            </div>
                            <nav className="space-y-1">
                                {tocHeadings.map((heading) => (
                                    <div
                                        key={heading.id}
                                        className={`text-sm py-1.5 px-3 rounded-lg cursor-default transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                                            heading.level === 1 ? 'font-bold text-gray-900 dark:text-white' :
                                            heading.level === 2 ? 'pl-5 text-gray-700 dark:text-gray-300' :
                                            'pl-8 text-gray-500 dark:text-gray-400 text-xs'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                heading.level === 1 ? 'bg-primary' :
                                                heading.level === 2 ? 'bg-emerald-400' :
                                                'bg-gray-300 dark:bg-gray-600'
                                            }`} />
                                            <span className="truncate">{heading.text}</span>
                                        </span>
                                    </div>
                                ))}
                            </nav>
                            <p className="text-[10px] text-gray-400 italic">Auto-generated from headings</p>
                        </div>
                    )}


                </div>
            </div>
        </div>

            {/* Footer Stats Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0B0E14] border-t border-gray-200 dark:border-white/10 p-2 flex gap-6 text-xs text-gray-500 dark:text-gray-400 justify-end px-8 z-40">
                <span className="flex items-center gap-1"><FileText size={14} /> {wordCount} words</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {readingTime} min read</span>
                <span className={`flex items-center gap-1 ${readingLevel.color}`}><BookOpen size={14} /> Level: {readingLevel.label} ({readingLevel.score})</span>
                {tocHeadings.length > 0 && <span className="flex items-center gap-1"><ListTree size={14} /> {tocHeadings.length} headings</span>}
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Article"
                description="Are you sure you want to delete this article? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
