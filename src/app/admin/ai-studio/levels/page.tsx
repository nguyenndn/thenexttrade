import { prisma } from "@/lib/prisma";
import LevelList from "@/components/admin/ai/levels/LevelList";
import DynamicCreateLevelModal from "@/components/admin/ai/levels/DynamicCreateLevelModal";
import { Layers, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default async function LevelsPage() {
    // Fetch levels with module count
    const levels = await prisma.level.findMany({
        orderBy: { order: 'asc' },
        include: {
            modules: {
                select: { id: true }
            }
        }
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Course Levels
                        </h1>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 font-medium pl-4.5">
                        <Link href="/admin/ai-studio" className="hover:text-primary transition-colors">AI Studio</Link>
                        <ChevronRight size={14} className="mx-2" />
                        <span className="text-gray-900 dark:text-white">Levels</span>
                    </div>
                </div>
                <DynamicCreateLevelModal />
            </div>

            {/* List */}
            <LevelList levels={levels} />
        </div>
    );
}
