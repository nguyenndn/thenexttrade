'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Plus, Pencil, Trash2, Quote as QuoteIcon, LayoutDashboard, Home, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Quote {
    id: string;
    text: string;
    author: string;
    type: string;
    isActive: boolean;
    createdAt: string;
}

type TabType = 'DASHBOARD' | 'HOMEPAGE';

export default function AdminQuotesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [saving, setSaving] = useState(false);

    // Confirm Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [formText, setFormText] = useState('');
    const [formAuthor, setFormAuthor] = useState('');

    const fetchQuotes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/quotes?type=${activeTab}`);
            const data = await res.json();
            setQuotes(data);
        } catch (err) {
            console.error('Failed to fetch quotes:', err);
            toast.error('Failed to load quotes');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    function openCreateModal() {
        setEditingQuote(null);
        setFormText('');
        setFormAuthor('');
        setModalOpen(true);
    }

    function openEditModal(quote: Quote) {
        setEditingQuote(quote);
        setFormText(quote.text);
        setFormAuthor(quote.author);
        setModalOpen(true);
    }

    async function handleSave() {
        if (!formText.trim()) return;
        setSaving(true);
        try {
            if (editingQuote) {
                const res = await fetch('/api/quotes', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingQuote.id, text: formText, author: formAuthor }),
                });
                if (!res.ok) throw new Error('Failed to update quote');
                toast.success('Quote updated');
            } else {
                const res = await fetch('/api/quotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: formText, author: formAuthor, type: activeTab }),
                });
                if (!res.ok) throw new Error('Failed to create quote');
                toast.success('Quote created');
            }
            setModalOpen(false);
            fetchQuotes();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }

    function confirmDelete(id: string) {
        setQuoteToDeleteId(id);
        setIsConfirmOpen(true);
    }

    async function handleDelete() {
        if (!quoteToDeleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/quotes?id=${quoteToDeleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete quote');
            toast.success('Quote deleted');
            setIsConfirmOpen(false);
            setQuoteToDeleteId(null);
            fetchQuotes();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleToggleActive(quote: Quote) {
        try {
            await fetch('/api/quotes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: quote.id, isActive: !quote.isActive }),
            });
            fetchQuotes();
        } catch (err) {
            console.error('Failed to toggle quote:', err);
        }
    }


    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Quote Management"
                description="Manage motivational quotes for Dashboard and Homepage."
            >
                <Button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all"
                >
                    <Plus size={18} strokeWidth={2.5} /> Add New
                </Button>
            </AdminPageHeader>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} tabsId="quotes">
                <TabsList>
                    <TabsTrigger value="DASHBOARD">
                        <LayoutDashboard size={16} />
                        Dashboard Quotes
                    </TabsTrigger>
                    <TabsTrigger value="HOMEPAGE">
                        <Home size={16} />
                        Homepage Quotes
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Table */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-5">Quote</th>
                                <th className="px-6 py-5 w-40">Author</th>
                                <th className="px-6 py-5 w-24 text-center">Active</th>
                                <th className="px-6 py-5 text-right w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-3 text-gray-500">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium text-sm">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : quotes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <QuoteIcon size={40} className="mb-3 opacity-30" />
                                            <p className="font-bold text-gray-900 dark:text-gray-300">No quotes found</p>
                                            <p className="text-sm mt-1 mb-4">Click &quot;Add New&quot; to create your first quote.</p>
                                            <Button onClick={openCreateModal} variant="outline" className="text-sm shadow-sm transition-transform active:scale-95">
                                                <Plus size={16} className="mr-1.5" /> Create Quote
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                quotes.map((quote) => (
                                    <tr key={quote.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-5">
                                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-2">
                                                &ldquo;{quote.text}&rdquo;
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {quote.author || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => handleToggleActive(quote)}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                                    quote.isActive
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500'
                                                }`}
                                            >
                                                {quote.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors focus:ring-0 focus-visible:ring-0"
                                                            aria-label="Open Actions"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#151925] z-[100]">
                                                        <DropdownMenuItem
                                                            onClick={() => openEditModal(quote)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 focus:bg-gray-50 dark:focus:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors outline-none"
                                                        >
                                                            <Pencil size={14} className="text-gray-400" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => confirmDelete(quote.id)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 transition-colors outline-none"
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal — matches CategoryModal style exactly */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingQuote ? 'Edit Quote' : 'Create Quote'}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
                    }}
                    className="space-y-5"
                >
                    <div className="group">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Quote Text <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formText}
                            onChange={(e) => setFormText(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[100px] resize-none"
                            placeholder="Enter the quote text..."
                        />
                    </div>

                    <div className="group">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Author <span className="font-normal text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={formAuthor}
                            onChange={(e) => setFormAuthor(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="e.g. Warren Buffett"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            className="hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-bold rounded-xl px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={saving}
                            disabled={!formText.trim()}
                            className="bg-primary hover:bg-[#00C888] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-6 font-bold"
                        >
                            {editingQuote ? 'Save Changes' : 'Create Quote'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Quote"
                description="Are you sure you want to delete this quote? This action cannot be undone."
                confirmText={isDeleting ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setQuoteToDeleteId(null);
                }}
                variant="danger"
            />
        </div>
    );
}
