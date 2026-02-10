import { prisma } from "@/lib/prisma";
import ModuleList from "@/components/admin/ai/modules/ModuleList";
import CreateModuleModal from "@/components/admin/ai/modules/CreateModuleModal";
import { ChevronRight, Layers } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import LevelHeaderActions from "@/components/admin/ai/levels/LevelHeaderActions";

export default async function LevelDetailPage(props: { params: Promise<{ levelId: string }> }) {
    const params = await props.params;
    const level = await prisma.level.findUnique({
        where: { id: params.levelId },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    lessons: { select: { id: true } },
                    quiz: { select: { id: true } }
                }
            }
        }
    });

    if (!level) {
        notFound();
    }

    return (
        <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <Link href="/admin/ai-studio" className="hover:text-primary transition-colors">AI Studio</Link>
                <ChevronRight size={14} className="mx-2" />
                <Link href="/admin/ai-studio/levels" className="hover:text-primary transition-colors">Levels</Link>
                <ChevronRight size={14} className="mx-2" />
                <span className="text-gray-900 dark:text-white font-medium">{level.title}</span>
            </div>

            {/* Header */}
            <div className="bg-white dark:bg-[#151925] p-8 rounded-3xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Layers size={120} />
                </div>

                {/* Actions Button */}
                <div className="absolute top-6 right-6 z-20">
                    <LevelHeaderActions level={{
                        id: level.id,
                        title: level.title,
                        description: level.description || ""
                    }} />
                </div>

                <div className="relative z-10 pr-16">
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                            Level {level.order}
                        </span>
                        <span className="text-gray-400 text-sm">Created {new Date(level.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                        {level.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-lg">
                        {level.description}
                    </p>
                </div>
            </div>

            {/* Modules Section */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            Course Curriculum
                            <span className="ml-3 px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 text-xs rounded-full">
                                {level.modules.length}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Manage modules and lessons for this level.</p>
                    </div>
                    <CreateModuleModal levelId={level.id} levelTitle={level.title} />
                </div>

                <ModuleList modules={level.modules} levelId={level.id} />
            </div>
        </div>
    );
}
