import { prisma } from "@/lib/prisma";
import { CommentSection } from "./CommentSection";

export async function CommentsFetcher({ articleId, currentUser }: { articleId: string, currentUser: any }) {
    // Artificial delay to demonstrate streaming if needed (removed for prod)
    // await new Promise(resolve => setTimeout(resolve, 2000));

    const comments = await prisma.comment.findMany({
        where: { articleId: articleId, parentId: null },
        include: {
            user: { select: { id: true, name: true, image: true } },
            replies: {
                include: {
                    user: { select: { id: true, name: true, image: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return <CommentSection articleId={articleId} currentUser={currentUser} initialComments={comments} />;
}
