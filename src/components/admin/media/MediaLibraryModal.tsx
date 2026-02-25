
"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Image as ImageIcon, Search, Trash2, Check, ExternalLink, Loader2 } from "lucide-react";

interface Media {
    id: string;
    filename: string;
    url: string;
    alt: string | null;
    caption: string | null;
    size: number;
    type: string;
    thumbnailUrl: string | null;
    createdAt: string;
}

interface MediaLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, media: Media) => void;
    allowMultiple?: boolean; // Future proofing
}

export function MediaLibraryModal({ isOpen, onClose, onSelect, allowMultiple = false }: MediaLibraryModalProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [search, setSearch] = useState("");

    // Fetch Media
    useEffect(() => {
        if (isOpen && activeTab === 'library') {
            loadMedia();
        }
    }, [isOpen, activeTab]);

    const loadMedia = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/media?limit=50&search=${search}`);
            const data = await res.json();
            if (data.media) setMediaList(data.media);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (activeTab === 'library') {
            const timer = setTimeout(loadMedia, 500);
            return () => clearTimeout(timer);
        }
    }, [search]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploading(true);

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const newMedia = await res.json();
                // Switch to library and select the new file
                setActiveTab('library');
                setMediaList([newMedia, ...mediaList]);
                setSelectedMedia(newMedia);
            }
        } catch (error) {
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedMedia || !confirm("Delete this image?")) return;

        try {
            await fetch(`/api/media/${selectedMedia.id}`, { method: 'DELETE' });
            setMediaList(prev => prev.filter(m => m.id !== selectedMedia.id));
            setSelectedMedia(null);
        } catch (error) {
            alert("Delete failed");
        }
    };

    const handleUpdate = async (key: 'alt' | 'caption', value: string) => {
        if (!selectedMedia) return;

        const updated = { ...selectedMedia, [key]: value };
        setSelectedMedia(updated); // Optimistic UI

        await fetch(`/api/media/${selectedMedia.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: value })
        });

        setMediaList(prev => prev.map(m => m.id === selectedMedia.id ? updated : m));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-10 bg-white dark:bg-[#151925] w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ImageIcon size={20} className="text-primary" /> Media Library
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-4 pt-4 flex gap-4 border-b border-gray-100 dark:border-white/10 text-sm font-bold">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`pb-3 border-b-2 transition-colors ${activeTab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
                    >
                        Upload Files
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`pb-3 border-b-2 transition-colors ${activeTab === 'library' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
                    >
                        Media Library
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col p-4 overflow-y-auto">

                        {activeTab === 'upload' && (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl m-4 bg-gray-50 dark:bg-black/20">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                        <Upload size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Drop files to upload</h4>
                                        <p className="text-gray-500 text-sm">or click to browse</p>
                                    </div>
                                    <label className="inline-flex items-center gap-2 px-6 py-2 bg-primary hover:bg-[#00a872] text-white font-bold rounded-xl cursor-pointer transition-all">
                                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : "Select Files"}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                                    </label>
                                    <p className="text-xs text-gray-400">Maximum upload file size: 50MB.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'library' && (
                            <div className="space-y-4">
                                {/* Toolbar */}
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 max-w-md">
                                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by filename..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>

                                {/* Grid */}
                                {isLoading ? (
                                    <div className="text-center py-12 text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" /> Loading library...</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {mediaList.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedMedia(item)}
                                                className={`group relative aspect-square bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedMedia?.id === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'}`}
                                            >
                                                <img src={item.thumbnailUrl || item.url} alt={item.alt || ""} className="w-full h-full object-cover" />
                                                {selectedMedia?.id === item.id && (
                                                    <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full shadow-md">
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Details (Only in Library mode and when selected) */}
                    {activeTab === 'library' && selectedMedia && (
                        <div className="w-[300px] bg-gray-50 dark:bg-[#0B0E14] border-l border-gray-200 dark:border-white/10 p-4 overflow-y-auto space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm uppercase">Item Details</h4>
                                <div className="aspect-video bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mb-2">
                                    <img src={selectedMedia.url} className="w-full h-full object-contain" />
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div className="font-bold text-gray-700 dark:text-gray-300 line-clamp-1">{selectedMedia.filename}</div>
                                    <div>{(selectedMedia.createdAt).substring(0, 10)}</div>
                                    <div>{(selectedMedia.size / 1024).toFixed(1)} KB</div>
                                    <a href={selectedMedia.url} target="_blank" className="text-primary hover:underline flex items-center gap-1">View Full URL <ExternalLink size={10} /></a>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Alt Text</label>
                                    <input
                                        type="text"
                                        value={selectedMedia.alt || ""}
                                        onChange={(e) => handleUpdate('alt', e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                                        placeholder="Describe this image..."
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Describe these images for better SEO and accessibility.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Caption</label>
                                    <textarea
                                        rows={3}
                                        value={selectedMedia.caption || ""}
                                        onChange={(e) => handleUpdate('caption', e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 resize-none"
                                        placeholder="Add a caption for this image..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col gap-2">
                                <button
                                    onClick={() => onSelect(selectedMedia.url, selectedMedia)}
                                    className="w-full py-2 bg-primary hover:bg-[#00a872] text-white font-bold rounded-xl text-sm transition-all"
                                >
                                    Insert Media
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold rounded-xl transition-all"
                                >
                                    Delete Permanently
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
