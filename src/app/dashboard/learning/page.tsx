
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle, Clock, PlayCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function MyLearningPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect('/auth/login');
    }

    // OPTIMIZED: Fetch levels and user progress in parallel
    const [levels, userProgress] = await Promise.all([
        // Fetch all levels with hierarchy
        prisma.level.findMany({
            orderBy: { order: "asc" },
            select: {
                id: true,
                title: true,
                description: true,
                order: true,
                modules: {
                    select: {
                        id: true,
                        title: true,
                        lessons: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                duration: true
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        }),
        // Fetch user progress
        prisma.userProgress.findMany({
            where: { userId: user.id, isCompleted: true }
        })
    ]);

    const completedLessonIds = new Set(userProgress.map(p => p.lessonId));

    // Calculate stats per level
    const courses = levels.map(level => {
        const allLessons = level.modules.flatMap(m => m.lessons);
        const totalLessons = allLessons.length;
        const completedCount = allLessons.filter(l => completedLessonIds.has(l.id)).length;
        const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        // Find next lesson to resume
        const nextLesson = allLessons.find(l => !completedLessonIds.has(l.id));

        return {
            ...level,
            totalLessons,
            completedCount,
            progress,
            nextLesson
        };
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Learning</h1>
                <p className="text-gray-500 text-sm">Track your progress and continue where you left off.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col group hover:border-[#2F80ED]/30 transition-colors">
                        {/* Course Header / Thumbnail Placeholder */}
                        <div className="h-32 bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <BookOpen size={40} className="text-[#2F80ED] opacity-50" />
                            <div className="absolute bottom-4 right-4 bg-white dark:bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-700 dark:text-white flex items-center gap-1">
                                <Clock size={12} />
                                {course.totalLessons} Lessons
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-[#2F80ED] transition-colors">{course.title}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                {course.description || "Master the forex market with this comprehensive module."}
                            </p>

                            {/* Progress Bar */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-gray-500">{course.completedCount} / {course.totalLessons} Completed</span>
                                    <span className="text-[#2F80ED]">{course.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#2F80ED] transition-all duration-500"
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Action Button */}
                            {course.nextLesson ? (
                                <Link
                                    href={`/academy/lesson/${course.nextLesson.slug}`} // Assuming slug routing
                                    className="w-full py-2.5 bg-[#2F80ED] hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                >
                                    <PlayCircle size={18} />
                                    {course.progress > 0 ? "Continue Learning" : "Start Course"}
                                </Link>
                            ) : (
                                <button disabled className="w-full py-2.5 bg-green-500/10 text-green-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                                    <CheckCircle size={18} />
                                    Completed
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {courses.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-gray-500">No courses available at the moment.</p>
                </div>
            )}
        </div>
    );
}
