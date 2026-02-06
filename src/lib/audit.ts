
import { prisma } from "@/lib/prisma"; // Adjust prisma import path as needed

// Extend with specific types from Spec if needed, but string map is flexible
export async function createAuditLog(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, any>
) {
    try {
        const log = await prisma.auditLog.create({
            data: {
                adminId,
                action,
                targetType,
                targetId,
                details: details || {},
            },
        });
        return { success: true, data: log };
    } catch (error) {
        console.error("Audit Log Error:", error);
        // Don't throw to avoid blocking main action
        return { success: false, error };
    }
}
