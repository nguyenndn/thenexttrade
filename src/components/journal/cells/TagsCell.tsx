import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";

interface TagsCellProps {
    entry: any;
    onUpdate: (id: string, data: any) => Promise<void>;
}

export function TagsCell({ entry, onUpdate }: TagsCellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newTag, setNewTag] = useState("");
    const tags = entry.tags || [];

    const handleAddTag = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const tag = newTag.trim();
        if (!tag) return;

        if (!tags.includes(tag)) {
            const updatedTags = [...tags, tag];
            await onUpdate(entry.id, { tags: updatedTags });
            setNewTag("");
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const updatedTags = tags.filter((t: string) => t !== tagToRemove);
        await onUpdate(entry.id, { tags: updatedTags });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <div
                    className="flex gap-1 flex-wrap justify-center cursor-pointer min-h-[24px] min-w-[24px] items-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    {tags.length > 0 ? (
                        tags.map((tag: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] font-medium border border-gray-200 dark:border-white/10 whitespace-nowrap">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Add Tags"
                            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                            <Plus size={12} />
                        </Button>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="p-3 w-64" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-3">
                    <form onSubmit={handleAddTag} className="flex gap-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag..."
                            className="flex-1 px-2 py-1 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                        <Button
                            type="button"
                            variant="primary"
                            size="icon"
                            onClick={() => handleAddTag()}
                            className="w-8 h-8 rounded-md"
                            disabled={!newTag.trim()}
                        >
                            <Plus size={16} />
                        </Button>
                    </form>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {tags.map((tag: string) => (
                                <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-xs">
                                    {tag}
                                    <Button variant="outline" size="icon" aria-label={`Remove tag ${tag}`} onClick={() => handleRemoveTag(tag)} className="w-4 h-4 p-0 text-gray-400 hover:text-red-500 hover:bg-transparent">
                                        <X size={12} />
                                    </Button>
                                </span>
                            ))}
                        </div>
                    )}
                    {tags.length === 0 && (
                        <p className="text-xs text-gray-400 text-center">No tags added yet.</p>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
