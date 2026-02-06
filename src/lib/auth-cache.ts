import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/lib/auth-types';

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Additional user data from Prisma (Optimized fetch)
    const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true, // Useful for new user checks
            profile: {
                select: {
                    role: true,
                    bio: true,
                    username: true
                }
            },
            _count: {
                select: {
                    progress: { where: { isCompleted: true } }
                }
            }
        }
    });

    return userData;
});

export const getUserProfile = cache(async (userId: string) => {
    if (!userId) return null;
    return await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });
});
