// ============================================================================
// EDGE AWARDS — Award XP with dedup via unique constraint
// ============================================================================

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Award Edge XP to a user for a specific event.
 * Uses upsert-like pattern with unique constraint to prevent duplicate awards.
 * Returns the xp awarded (0 if already awarded).
 */
export async function awardEdgeOnce(
  userId: string,
  eventType: string,
  xpAmount: number,
  sourceType: string,
  sourceId: string,
  metadata?: Record<string, unknown>
): Promise<{ awarded: boolean; xp: number }> {
  try {
    // Create event — will fail silently if duplicate (unique constraint)
    await prisma.edgeEvent.create({
      data: {
        userId,
        eventType,
        sourceType,
        sourceId,
        xpAwarded: xpAmount,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    // Increment user XP
    if (xpAmount > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpAmount } },
      });
    }

    return { awarded: true, xp: xpAmount };
  } catch (error) {
    // Unique constraint violation = already awarded
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { awarded: false, xp: 0 };
    }
    throw error;
  }
}

/**
 * Award Edge XP without dedup — for repeatable events.
 */
export async function awardEdge(
  userId: string,
  eventType: string,
  xpAmount: number,
  metadata?: Record<string, unknown>
): Promise<{ xp: number }> {
  await prisma.edgeEvent.create({
    data: {
      userId,
      eventType,
      xpAwarded: xpAmount,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  if (xpAmount > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpAmount } },
    });
  }

  return { xp: xpAmount };
}

/**
 * Safe helper to record an EdgeEvent for mission progress without directly awarding XP.
 * This is used when the XP is already awarded by another system (like the old addXP flow),
 * but we need the event ledger for the new mission system.
 */
export async function recordEdgeEvent(params: {
  userId: string;
  eventType: string;
  sourceType?: string;
  sourceId?: string;
  xpAwarded?: number;
  metadata?: Record<string, unknown>;
}) {
  return prisma.edgeEvent.create({
    data: {
      userId: params.userId,
      eventType: params.eventType,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      xpAwarded: params.xpAwarded || 0,
      metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function recordEdgeEventOnce(params: {
  userId: string;
  eventType: string;
  sourceType: string;
  sourceId: string;
  xpAwarded?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await prisma.edgeEvent.create({
      data: {
        userId: params.userId,
        eventType: params.eventType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        xpAwarded: params.xpAwarded || 0,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}
