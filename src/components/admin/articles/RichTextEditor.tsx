"use client";

import { useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';

import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Heading1, Heading2, Heading3,
    List, ListOrdered, CheckSquare,
    Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon, Table as TableIcon,
    Code, Quote, Undo, Redo,
    Columns, Trash2, Zap,
    Maximize, Minimize, Keyboard, Upload, Loader2
} from 'lucide-react';

import { MediaLibraryModal } from "@/components/admin/media/MediaLibraryModal";
import { ShortcutsMenuModal } from "./ShortcutsMenuModal";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    className?: string;
    editorClassName?: string;
}

export function RichTextEditor({ content, onChange, editable = true, className = "", editorClassName = "" }: RichTextEditorProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isShortcutsPanelOpen, setIsShortcutsPanelOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const linkInputRef = useRef<HTMLInputElement>(null);
    const youtubeInputRef = useRef<HTMLInputElement>(null);

    const uploadImageFile = useCallback(async (file: File): Promise<string | null> => {
        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are supported');
            return null;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image must be under 10MB');
            return null;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/media', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            toast.success('Image uploaded');
            return data.url;
        } catch {
            toast.error('Failed to upload image');
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Subscript,
            Superscript,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl shadow-lg max-w-full my-6 mx-auto block',
                },
            }),
            Youtube.configure({
                controls: false,
                nocookie: true,
                HTMLAttributes: {
                    class: 'w-full rounded-xl shadow-lg aspect-video my-6',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'w-full border-collapse border border-gray-200 dark:border-gray-700 my-4 rounded-lg overflow-hidden',
                },
            }),
            TableRow,
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 p-2 font-bold text-left',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-200 dark:border-gray-700 p-2',
                },
            }),
            TaskList.configure({
                HTMLAttributes: { class: 'not-prose pl-2' },
            }),
            TaskItem.configure({ nested: true }),
            Placeholder.configure({
                placeholder: 'Start writing amazingly...',
            }),
        ],
        content,
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose dark:prose-invert prose-lg max-w-none focus:outline-none min-h-[300px] ${editorClassName}`,
            },
            handleDrop: (view, event, _slice, moved) => {
                if (moved || !event.dataTransfer?.files?.length) return false;
                const file = event.dataTransfer.files[0];
                if (!file.type.startsWith('image/')) return false;

                event.preventDefault();
                uploadImageFile(file).then(url => {
                    if (url) {
                        const { schema } = view.state;
                        const imageNode = schema.nodes.image.create({ src: url });
                        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        if (pos) {
                            const tr = view.state.tr.insert(pos.pos, imageNode);
                            view.dispatch(tr);
                        }
                    }
                });
                return true;
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;

                for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                        event.preventDefault();
                        const file = item.getAsFile();
                        if (!file) return false;

                        uploadImageFile(file).then(url => {
                            if (url) {
                                const { schema } = view.state;
                                const imageNode = schema.nodes.image.create({ src: url });
                                const tr = view.state.tr.replaceSelectionWith(imageNode);
                                view.dispatch(tr);
                            }
                        });
                        return true;
                    }
                }
                return false;
            },
        },
    });
    // Sync content from parent (e.g., AI Rewrite Apply)
    const lastExternalContent = useRef(content);
    if (editor && content !== lastExternalContent.current && content !== editor.getHTML()) {
        lastExternalContent.current = content;
        editor.commands.setContent(content, { emitUpdate: false });
    }

    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkUrl(previousUrl);
        setLinkDialogOpen(true);
        setTimeout(() => linkInputRef.current?.focus(), 100);
    };

    const confirmLink = () => {
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        }
        setLinkDialogOpen(false);
        setLinkUrl('');
    };

    const addYoutube = () => {
        setYoutubeUrl('');
        setYoutubeDialogOpen(true);
        setTimeout(() => youtubeInputRef.current?.focus(), 100);
    };

    const confirmYoutube = () => {
        if (youtubeUrl) editor.commands.setYoutubeVideo({ src: youtubeUrl });
        setYoutubeDialogOpen(false);
        setYoutubeUrl('');
    };

    const handleImageSelect = (url: string, media: any) => {
        editor.chain().focus().setImage({
            src: url,
            alt: media?.alt || '',
            title: media?.caption || ''
        }).run();
        setIsMediaModalOpen(false);
    };

    const addTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const shortcuts = [
        { keys: ['Ctrl', 'B'], action: 'Bold' },
        { keys: ['Ctrl', 'I'], action: 'Italic' },
        { keys: ['Ctrl', 'U'], action: 'Underline' },
        { keys: ['Ctrl', 'Shift', 'X'], action: 'Strikethrough' },
        { keys: ['Ctrl', 'Shift', 'H'], action: 'Highlight' },
        { keys: ['Ctrl', 'E'], action: 'Code' },
        { keys: ['Ctrl', 'Z'], action: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
        { keys: ['Ctrl', 'Shift', '1'], action: 'Heading 1' },
        { keys: ['Ctrl', 'Shift', '2'], action: 'Heading 2' },
        { keys: ['Ctrl', 'Shift', '3'], action: 'Heading 3' },
        { keys: ['Ctrl', 'Shift', '8'], action: 'Bullet List' },
        { keys: ['Ctrl', 'Shift', '7'], action: 'Ordered List' },
        { keys: ['Ctrl', 'Shift', 'B'], action: 'Blockquote' },
        { keys: ['Ctrl', 'K'], action: 'Insert Link' },
        { keys: ['Enter'], action: 'New Paragraph' },
        { keys: ['Shift', 'Enter'], action: 'Line Break' },
        { keys: ['Tab'], action: 'Indent List' },
        { keys: ['Shift', 'Tab'], action: 'Outdent List' },
    ];

    return (
        <div
            ref={editorContainerRef}
            className={`
                border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#151925] flex flex-col shadow-sm
                ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''}
                ${className}
            `}
        >
            {editable && (
                <div className={`flex flex-col border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151925] ${isFullscreen ? 'sticky top-0 z-10' : 'sticky top-0 z-10'}`}>
                    {/* Main Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2">
                        {/* History */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 dark:border-white/10 mr-1">
                            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} title="Undo" />
                            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} title="Redo" />
                        </div>

                        {/* Text Style */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 dark:border-white/10 mr-1">
                            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="H1" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="H2" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} title="H3" />
                        </div>

                        {/* Formatting */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 dark:border-white/10 mr-1">
                            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} title="Underline" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="Strike" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} icon={Highlighter} title="Highlight" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code} title="Code" />
                        </div>

                        {/* Alignment */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 dark:border-white/10 mr-1">
                            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Left" />
                            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Center" />
                            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Right" />
                            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} icon={AlignJustify} title="Justify" />
                        </div>

                        {/* Lists */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 dark:border-white/10 mr-1">
                            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Ordered List" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={CheckSquare} title="Task List" />
                        </div>

                        {/* Insert */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 dark:border-white/10 mr-1">
                            <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} icon={LinkIcon} title="Link" />
                            <ToolbarButton onClick={() => setIsMediaModalOpen(true)} icon={ImageIcon} title="Image" />
                            <ToolbarButton onClick={addYoutube} icon={YoutubeIcon} title="Youtube" />
                            <ToolbarButton onClick={addTable} icon={TableIcon} title="Table" />
                            <ToolbarButton onClick={() => setIsShortcutsOpen(true)} icon={Zap} title="Shortcuts" className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
                        </div>

                        {/* Utility */}
                        <div className="flex items-center gap-0.5 ml-auto">
                            {isUploading && (
                                <span className="flex items-center gap-1 text-xs text-blue-500 mr-2">
                                    <Loader2 size={14} className="animate-spin" /> Uploading...
                                </span>
                            )}
                            <ToolbarButton onClick={() => setIsShortcutsPanelOpen(!isShortcutsPanelOpen)} icon={Keyboard} title="Keyboard Shortcuts" isActive={isShortcutsPanelOpen} />
                            <ToolbarButton onClick={toggleFullscreen} icon={isFullscreen ? Minimize : Maximize} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} />
                        </div>
                    </div>

                    {/* Contextual Toolbar: Table */}
                    {editor.isActive('table') && (
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800 text-xs">
                            <span className="font-bold text-blue-600 dark:text-blue-400 px-2">Table:</span>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => editor.chain().focus().addColumnBefore().run()}>+ Col Left</Button>
                                <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col Right</Button>
                                <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().deleteColumn().run()}>Del Col</Button>
                                <div className="w-[1px] bg-blue-200 dark:bg-blue-800 mx-1"></div>
                                <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addRowBefore().run()}>+ Row Above</Button>
                                <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row Below</Button>
                                <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().deleteRow().run()}>Del Row</Button>
                                <div className="w-[1px] bg-blue-200 dark:bg-blue-800 mx-1"></div>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => editor.chain().focus().deleteTable().run()}>Delete Table</Button>
                            </div>
                        </div>
                    )}

                    {/* Upload Drop Zone indicator */}
                    {isUploading && (
                        <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-teal-500 animate-pulse" />
                    )}
                </div>
            )}

            {/* Keyboard Shortcuts Panel */}
            {isShortcutsPanelOpen && (
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0B0E14] p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                            <Keyboard size={16} /> Keyboard Shortcuts
                        </h4>
                        <Button variant="ghost" size="sm" onClick={() => setIsShortcutsPanelOpen(false)} className="text-xs h-6">Close</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {shortcuts.map((s) => (
                            <div key={s.action} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <span className="text-xs text-gray-600 dark:text-gray-500">{s.action}</span>
                                <div className="flex items-center gap-0.5">
                                    {s.keys.map((key) => (
                                        <kbd key={key} className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-white/10">
                                            {key}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div
                className={`flex-1 overflow-y-auto cursor-text bg-white dark:bg-[#151925] ${isFullscreen ? 'px-8 md:px-16 lg:px-32' : ''}`}
                onClick={() => editor.chain().focus().run()}
            >
                <EditorContent editor={editor} className="h-full p-6" />
            </div>

            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleImageSelect}
            />

            <ShortcutsMenuModal
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
                onSelect={(shortcutTag: string) => {
                    editor.chain().focus().insertContent({
                        type: 'text',
                        text: shortcutTag,
                        marks: [{
                            type: 'highlight',
                            attrs: { color: '#fef08a' },
                        }],
                    }).run();
                    setIsShortcutsOpen(false);
                }}
            />

            {/* Link URL Dialog */}
            {linkDialogOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLinkDialogOpen(false)}>
                    <div className="bg-white dark:bg-[#1E2028] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white">Insert Link</h3>
                        <input
                            ref={linkInputRef}
                            type="url"
                            value={linkUrl}
                            onChange={e => setLinkUrl(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmLink(); if (e.key === 'Escape') setLinkDialogOpen(false); }}
                            placeholder="https://example.com"
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                            {linkUrl && (
                                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => { setLinkUrl(''); confirmLink(); }}>Remove Link</Button>
                            )}
                            <Button variant="primary" onClick={confirmLink}>Apply</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* YouTube URL Dialog */}
            {youtubeDialogOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setYoutubeDialogOpen(false)}>
                    <div className="bg-white dark:bg-[#1E2028] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white">Embed YouTube Video</h3>
                        <input
                            ref={youtubeInputRef}
                            type="url"
                            value={youtubeUrl}
                            onChange={e => setYoutubeUrl(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmYoutube(); if (e.key === 'Escape') setYoutubeDialogOpen(false); }}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setYoutubeDialogOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={confirmYoutube} disabled={!youtubeUrl}>Embed</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen: ESC hint */}
            {isFullscreen && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none opacity-60">
                    Press <kbd className="px-1.5 py-0.5 font-mono bg-white/20 rounded mx-1">ESC</kbd> or click <Minimize size={12} className="inline" /> to exit fullscreen
                </div>
            )}
        </div>
    );
}

function ToolbarButton({ onClick, isActive, icon: Icon, title, disabled, className }: any) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`rounded-lg transition-all group flex items-center justify-center
                ${isActive
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary/20 hover:text-primary'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
                ${className || ''}
            `}
        >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </Button>
    );
}
