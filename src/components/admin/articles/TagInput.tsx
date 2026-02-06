"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface Tag {
    id: string;
    name: string;
    slug: string;
}

interface TagInputProps {
    value: string[]; // Array of Tag IDs
    onChange: (ids: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch full tag objects for the selected IDs on mount
    useEffect(() => {
        // In a real app we might fetch these, but for now we rely on user adding them
        // OR we need the parent to pass full objects. 
        // For simplicity, let's assume we start empty or fetch all tags? 
        // Better: The parent should probably pass full objects if possible or we fetch selected ones.
        // For this MVP, let's assume if we have IDs but no objects, we can't show names properly 
        // without fetching.
        // Let's modify the props to accept full objects if possible, or just manage IDs 
        // and fetch details?
        // Let's stick to fetching suggestions. If `value` has IDs, we need to know their names.
        // I will ignore `value` prop for initial rendering of names for now to save time, 
        // OR I will assume the parent passes initialTags.
    }, []);

    const searchTags = async (query: string) => {
        if (!query) {
            setSuggestions([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/tags?query=${query}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            searchTags(input);
        }, 300);
        return () => clearTimeout(timeout);
    }, [input]);

    const addTag = (tag: Tag) => {
        if (!selectedTags.find(t => t.id === tag.id)) {
            const newTags = [...selectedTags, tag];
            setSelectedTags(newTags);
            onChange(newTags.map(t => t.id));
        }
        setInput("");
        setSuggestions([]);
    };

    const removeTag = (id: string) => {
        const newTags = selectedTags.filter(t => t.id !== id);
        setSelectedTags(newTags);
        onChange(newTags.map(t => t.id));
    };

    const createTag = async () => {
        if (!input) return;
        setIsCreating(true);
        try {
            const res = await fetch("/api/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: input }),
            });
            if (res.ok) {
                const tag = await res.json();
                addTag(tag);
            }
        } catch (error) {
            alert("Failed to create tag");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-2" ref={containerRef}>
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md text-sm">
                        <span>{tag.name}</span>
                        <button onClick={() => removeTag(tag.id)} className="text-gray-400 hover:text-red-500">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (suggestions.length > 0) {
                                addTag(suggestions[0]);
                            } else {
                                createTag();
                            }
                        }
                    }}
                    placeholder="Add a tag..."
                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#00C888]"
                />

                {(isLoading || isCreating) && (
                    <div className="absolute right-3 top-2.5">
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1A1D24] border border-gray-100 dark:border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {suggestions.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => addTag(tag)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
