import { prisma } from "@/lib/prisma";
import LessonList from "@/components/admin/ai/lessons/LessonList";
import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ModuleHeaderActions from "@/components/admin/ai/modules/ModuleHeaderActions";

export default async function ModuleDetailPage(props: { params: Promise<{ moduleId: string }> }) {
    const params = await props.params;
    const moduleData = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: {
            level: {
                select: { id: true, title: true }
            },
            lessons: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!moduleData) {
        notFound();
    }

    return (
        <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <Link href="/admin/ai-studio" className="hover:text-[#00C888] transition-colors">AI Studio</Link>
                <ChevronRight size={14} className="mx-2" />
                <Link href="/admin/ai-studio/levels" className="hover:text-[#00C888] transition-colors">Levels</Link>
                <ChevronRight size={14} className="mx-2" />
                <Link href={`/admin/ai-studio/levels/${moduleData.level.id}`} className="hover:text-[#00C888] transition-colors">{moduleData.level.title}</Link>
                <ChevronRight size={14} className="mx-2" />
                <span className="text-gray-900 dark:text-white font-medium">{moduleData.title}</span>
            </div>

            {/* Header */}
            <div className="bg-white dark:bg-[#151925] p-8 rounded-3xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <FileText size={120} />
                </div>

                {/* Actions Button */}
                <div className="absolute top-6 right-6 z-20">
                    <ModuleHeaderActions module={{
                        id: moduleData.id,
                        title: moduleData.title,
                        description: moduleData.description || "",
                        levelId: moduleData.level.id
                    }} />
                </div>

                <div className="relative z-10 pr-16">
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full uppercase tracking-wider">
                            Module
                        </span>
                        <span className="text-gray-400 text-sm">Updated {new Date(moduleData.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                        {moduleData.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-lg">
                        {moduleData.description}
                    </p>
                </div>
            </div>

            {/* Lessons Section */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            Lessons in this Module
                            <span className="ml-3 px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 text-xs rounded-full">
                                {moduleData.lessons.length}
                            </span>
                        </h2>
                    </div>
                    {/* Add Lesson Button could go here */}
                </div>

                <LessonList lessons={moduleData.lessons} />
            </div>
        </div>
    );
}
