'use client';

import { useState } from 'react';
import { FolderTree, Tag, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import CategoryList from '@/components/admin/cms/CategoryList';
import TagList from '@/components/admin/cms/TagList';

export default function TaxonomyPage() {
    const [activeTab, setActiveTab] = useState('categories');

    return (
        <div className="pb-10 space-y-4">
            <AdminPageHeader
                title="Taxonomy"
                description="Manage categories and tags for organizing content."
            >
                <Button
                    onClick={() => {
                        // Dispatch custom event to trigger the create modal in the active tab's component
                        window.dispatchEvent(new CustomEvent('taxonomy-create', { detail: activeTab }));
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all"
                >
                    <Plus size={18} strokeWidth={2.5} /> Add New
                </Button>
            </AdminPageHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} tabsId="taxonomy">
                <TabsList>
                    <TabsTrigger value="categories">
                        <FolderTree size={16} />
                        Categories
                    </TabsTrigger>
                    <TabsTrigger value="tags">
                        <Tag size={16} />
                        Tags
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                    <CategoryList hideHeader />
                </TabsContent>
                <TabsContent value="tags">
                    <TagList hideHeader />
                </TabsContent>
            </Tabs>
        </div>
    );
}
