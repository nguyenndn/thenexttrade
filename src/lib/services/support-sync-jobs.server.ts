import { prisma } from "@/lib/prisma";

export const SUPPORT_SYNC_JOB_PREFIX = "support_";
export const SUPPORT_SYNC_MODE = "SUPPORT_SYNC";

export function getSupportSyncJobId(ticketId: string): string {
    return `${SUPPORT_SYNC_JOB_PREFIX}${ticketId}`.slice(0, 50);
}

export function getSupportTicketIdFromJobId(jobId: string): string | null {
    if (!jobId.startsWith(SUPPORT_SYNC_JOB_PREFIX)) return null;
    const ticketId = jobId.slice(SUPPORT_SYNC_JOB_PREFIX.length);
    return ticketId || null;
}

export function sanitizeSupportSyncMessage(
    value: string | null | undefined,
    maxLength = 300
): string {
    const normalized = (value || "Unknown error")
        .replace(/pass(?:word)?\s*[:=]\s*\S+/gi, "password=[redacted]")
        .replace(/\s+/g, " ")
        .trim();
    return normalized.slice(0, maxLength);
}

function appendTicketNote(existing: string | null, note: string): string {
    const combined = existing ? `${existing}\n${note}` : note;
    return combined.slice(-1000);
}

export async function failSupportSyncTicket(params: {
    ticketId: string;
    errorCode: string;
    errorMessage: string;
}): Promise<boolean> {
    const ticket = await prisma.supportSyncTicket.findUnique({
        where: { id: params.ticketId },
        select: { id: true, notes: true },
    });
    if (!ticket) return false;

    const reason = sanitizeSupportSyncMessage(params.errorMessage);
    await prisma.supportSyncTicket.update({
        where: { id: params.ticketId },
        data: {
            status: "FAILED",
            notes: appendTicketNote(
                ticket.notes,
                `[Support Sync] Failed (${params.errorCode}): ${reason}`
            ),
        },
    });
    return true;
}

export async function verifySupportSyncTicket(params: {
    ticketId: string;
    imported: number;
    updated: number;
    totalDeals: number;
}): Promise<boolean> {
    const ticket = await prisma.supportSyncTicket.findUnique({
        where: { id: params.ticketId },
        select: { id: true, notes: true },
    });
    if (!ticket) return false;

    const summary = `[Support Sync] Verified: ${params.imported} imported, ${params.updated} updated, ${params.totalDeals} deals received.`;
    await prisma.supportSyncTicket.update({
        where: { id: params.ticketId },
        data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
            notes: appendTicketNote(ticket.notes, summary),
        },
    });
    return true;
}
