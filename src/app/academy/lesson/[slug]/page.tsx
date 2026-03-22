import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const user = await getAuthUser();

    if (!user) {
        redirect(`/auth/login`);
    }

    // Authenticated users always use the dashboard lesson view
    redirect(`/dashboard/academy/lessons/${slug}`);
}

