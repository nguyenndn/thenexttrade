"use client";

import { useState } from 'react';
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
    Palette, Columns, Rows, Trash2, CheckCircle2
} from 'lucide-react';

import { MediaLibraryModal } from "@/components/admin/media/MediaLibraryModal";
import { Button } from "@/components/ui/Button";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    className?: string;
    editorClassName?: string;
}

export function RichTextEditor({ content, onChange, editable = true, className = "", editorClassName = "" }: RichTextEditorProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Subscript,
            Superscript,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl shadow-lg max-w-full my-6',
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
                HTMLAttributes: {
                    class: 'not-prose pl-2',
                },
            }),
            TaskItem.configure({
                nested: true,
            }),
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
        },
    });

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addYoutube = () => {
        const url = prompt('Enter YouTube URL');
        if (url) {
            editor.commands.setYoutubeVideo({ src: url });
        }
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

    return (
        <div className={`border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#151925] flex flex-col shadow-sm ${className}`}>
            {editable && (
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151925]">
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
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} icon={LinkIcon} title="Link" />
                            <ToolbarButton onClick={() => setIsMediaModalOpen(true)} icon={ImageIcon} title="Image" />
                            <ToolbarButton onClick={addYoutube} icon={YoutubeIcon} title="Youtube" />
                            <ToolbarButton onClick={addTable} icon={TableIcon} title="Table" />
                            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
                        </div>
                    </div>

                    {/* Contextual Toolbar: Table */}
                    {editor.isActive('table') && (
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800 text-xs">
                            <span className="font-bold text-blue-600 dark:text-blue-400 px-2">Table:</span>
                            <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editor.chain().focus().addColumnBefore().run()}>+ Col Left</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col Right</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editor.chain().focus().deleteColumn().run()}>Del Col</Button>
                                <div className="w-[1px] bg-blue-200 dark:bg-blue-800 mx-1"></div>
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editor.chain().focus().addRowBefore().run()}>+ Row Above</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row Below</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => editor.chain().focus().deleteRow().run()}>Del Row</Button>
                                <div className="w-[1px] bg-blue-200 dark:bg-blue-800 mx-1"></div>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => editor.chain().focus().deleteTable().run()}>Delete Table</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-y-auto cursor-text bg-white dark:bg-[#151925]" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} className="h-full p-6" />
            </div>

            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleImageSelect}
            />
        </div>
    );
}

function ToolbarButton({ onClick, isActive, icon: Icon, title, disabled }: any) {
    return (
        <button
            onClick={onClick}
            title={title}
            type="button"
            disabled={disabled}
            className={`p-1.5 rounded-lg transition-all group flex items-center justify-center
                ${isActive
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
            `}
        >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </button>
    );
}
