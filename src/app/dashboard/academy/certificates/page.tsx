import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CertificateCard } from "@/components/academy/CertificateCard";
import { GraduationCap, Lock, Trophy, Crown } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Certificates | Academy",
    description: "Your Academy level completion certificates.",
};

export default async function CertificatesPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const userId = user.id;
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.io";

    const [levels, certificates, userName] = await Promise.all([
        prisma.level.findMany({
            orderBy: { order: "asc" },
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
                                    orderBy: { score: "desc" },
                                    take: 1,
                                    select: { score: true },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.certificate.findMany({
            where: { userId },
            include: { level: { select: { title: true, order: true } } },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                profile: { select: { username: true } },
            },
        }),
    ]);

    const certMap = new Map(certificates.map((c) => [c.levelId, c]));
    const earnedCount = certificates.length;
    const totalLevels = levels.length;
    const displayName =
        userName?.name || userName?.profile?.username || "Trader";

    // Master Certificate: all levels completed
    const allLevelsCompleted = totalLevels > 0 && earnedCount >= totalLevels;
    const masterAvgScore = allLevelsCompleted
        ? Math.round(
              certificates.reduce((sum, c) => sum + c.score, 0) /
                  certificates.length
          )
        : 0;
    const masterEarnedAt = allLevelsCompleted
        ? certificates
              .reduce(
                  (latest, c) => (c.earnedAt > latest ? c.earnedAt : latest),
                  certificates[0].earnedAt
              )
              .toISOString()
        : null;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Certificates"
                description="Earn certificates by passing all quizzes in each level."
            >
                <div className="flex items-center gap-3 text-sm font-bold w-full sm:w-auto">
                    <div className="flex items-center justify-center gap-1.5 !text-white bg-gold px-3 py-1.5 rounded-lg shadow-sm font-mono tabular-nums flex-1 sm:flex-none">
                        <Trophy size={14} />
                        <span>
                            {earnedCount}/{totalLevels} Earned
                        </span>
                    </div>
                </div>
            </PageHeader>

            {/* Master Certificate — shown at top when all levels completed */}
            {allLevelsCompleted && (
                <div className="relative">
                    {/* Glow backdrop */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/15 to-yellow-400/15 rounded-xl blur-xl pointer-events-none" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <Crown size={16} className="text-amber-600 dark:text-gold" />
                            <span className="text-xs font-bold text-amber-600 dark:text-gold uppercase tracking-widest">
                                Master Certificate
                            </span>
                        </div>
                        <CertificateCard
                            levelTitle="TheNextTrade Academy"
                            levelOrder={0}
                            levelDescription="Completed all 12 levels of the professional forex trading program"
                            isEarned={true}
                            score={masterAvgScore}
                            earnedAt={masterEarnedAt}
                            passedQuizzes={totalLevels}
                            totalQuizzes={totalLevels}
                            userName={displayName}
                            variant="master"
                            shareUrl={`${baseUrl}/certificate/master/${userId}`}
                        />
                    </div>
                </div>
            )}

            {/* Not yet completed — locked master card teaser */}
            {!allLevelsCompleted && (
                <div className="relative rounded-xl border-2 border-dashed border-gold/30 bg-gold/5 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Lock size={20} className="text-amber-600 dark:text-gold" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            Master Trader Certificate
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Complete all <span className="font-mono tabular-nums">{totalLevels}</span> levels to unlock the
                            Master Trader Certificate. <span className="font-mono tabular-nums">{earnedCount}/{totalLevels}</span> completed.
                        </p>
                    </div>
                    <div className="ml-auto">
                        <Trophy size={28} className="text-amber-600/40 dark:text-gold/40" />
                    </div>
                </div>
            )}

            {/* Level Certificates Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {levels.map((level) => {
                    const cert = certMap.get(level.id);
                    const modulesWithQuiz = level.modules.filter((m) => m.quiz);
                    const passedQuizzes = modulesWithQuiz.filter(
                        (m) => m.quiz && m.quiz.attempts.length > 0
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
                            shareUrl={
                                cert
                                    ? `${baseUrl}/certificate/${cert.id}`
                                    : undefined
                            }
                        />
                    );
                })}
            </div>

            <div className="text-center pt-4">
                <Link
                    href="/dashboard/academy"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2028] border border-dashboard rounded-lg shadow-sm hover:border-gold/40 hover:text-amber-600 dark:hover:text-gold transition-colors"
                >
                    <GraduationCap size={16} />
                    Back to Academy
                </Link>
            </div>
        </div>
    );
}
