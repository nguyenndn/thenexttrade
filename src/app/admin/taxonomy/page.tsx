"use client";

import { useState } from "react";
import { FolderTree, Tag, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import CategoryList from "@/components/admin/cms/CategoryList";
import TagList from "@/components/admin/cms/TagList";

export default function TaxonomyPage() {
    const [activeTab, setActiveTab] = useState("categories");

    return (
        <div className="pb-10 space-y-4">
            <AdminPageHeader
                title="Taxonomy"
                description="Manage categories and tags for organizing content."
            >
                <Button
                    onClick={() => {
                        // Dispatch custom event to trigger the create modal in the active tab's component
                        window.dispatchEvent(
                            new CustomEvent("taxonomy-create", {
                                detail: activeTab,
                            })
                        );
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 font-bold shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0 transition-all"
                >
                    <Plus size={18} strokeWidth={2.5} /> Add New
                </Button>
            </AdminPageHeader>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                tabsId="taxonomy"
            >
                <div className="overflow-x-auto scrollbar-hide flex">
                    <TabsList className="shrink-0">
                        <TabsTrigger
                            value="categories"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/10"
                            activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                            activeTextClassName="!text-white"
                        >
                            <FolderTree size={15} />
                            <span>Categories</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="tags"
                            className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/10"
                            activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                            activeTextClassName="!text-white"
                        >
                            <Tag size={15} />
                            <span>Tags</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

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
