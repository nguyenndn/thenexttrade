import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CertificateCard } from "@/components/academy/CertificateCard";
import { GraduationCap, Lock, Trophy } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Certificates | Academy",
    description: "Your Academy level completion certificates."
};

export default async function CertificatesPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const userId = user.id;

    const [levels, certificates, userName] = await Promise.all([
        prisma.level.findMany({
            orderBy: { order: 'asc' },
            include: {
                modules: {
                    select: {
                        id: true,
                        title: true,
                        quiz: {
                            select: {
                                id: true,
                                attempts: {
                                    where: { userId, passed: true },
                                    orderBy: { score: 'desc' },
                                    take: 1,
                                    select: { score: true }
                                }
                            }
                        }
                    }
                }
            }
        }),
        prisma.certificate.findMany({
            where: { userId },
            include: { level: { select: { title: true, order: true } } }
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                profile: { select: { username: true } }
            }
        })
    ]);

    const certMap = new Map(certificates.map(c => [c.levelId, c]));
    const earnedCount = certificates.length;
    const totalLevels = levels.length;
    const displayName = userName?.name || userName?.profile?.username || "Trader";

    return (
        <div className="space-y-4">
            <PageHeader
                title="Certificates"
                description="Earn certificates by passing all quizzes in each level."
            >
                <div className="flex items-center gap-3 text-sm font-bold w-full sm:w-auto">
                    <div className="flex items-center justify-center gap-1.5 text-white bg-primary px-3 py-1.5 rounded-full shadow-sm flex-1 sm:flex-none">
                        <Trophy size={14} />
                        <span>{earnedCount}/{totalLevels} Earned</span>
                    </div>
                </div>
            </PageHeader>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {levels.map(level => {
                    const cert = certMap.get(level.id);
                    const modulesWithQuiz = level.modules.filter(m => m.quiz);
                    const passedQuizzes = modulesWithQuiz.filter(
                        m => m.quiz && m.quiz.attempts.length > 0
                    ).length;
                    const totalQuizzes = modulesWithQuiz.length;
                    const isEarned = !!cert;

                    return (
                        <CertificateCard
                            key={level.id}
                            levelTitle={level.title}
                            levelOrder={level.order}
                            levelDescription={level.description}
                            isEarned={isEarned}
                            score={cert?.score ?? null}
                            earnedAt={cert?.earnedAt?.toISOString() ?? null}
                            passedQuizzes={passedQuizzes}
                            totalQuizzes={totalQuizzes}
                            userName={displayName}
                        />
                    );
                })}
            </div>

            <div className="text-center pt-4">
                <Link
                    href="/dashboard/academy"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm hover:border-primary hover:text-primary transition-colors"
                >
                    <GraduationCap size={16} />
                    Back to Academy
                </Link>
            </div>
        </div>
    );
}
