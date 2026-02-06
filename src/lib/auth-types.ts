
import { UserRole } from "@prisma/client";

export interface AuthUser {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
    profile: {
        role: UserRole;
        bio: string | null;
        username: string | null;
    } | null;
    _count?: {
        progress: number;
    };
}
