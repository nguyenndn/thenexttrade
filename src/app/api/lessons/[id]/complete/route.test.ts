import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { addXP, checkAndGrantBadge, XP_AWARDS } from "@/lib/gamification";
import { recordEdgeEventOnce } from "@/lib/edge-awards";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        userProgress: {
            findUnique: vi.fn(),
            count: vi.fn(),
            upsert: vi.fn(),
        },
        lesson: {
            findUnique: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/gamification", () => ({
    addXP: vi.fn(),
    checkAndGrantBadge: vi.fn(),
    XP_AWARDS: { LESSON_COMPLETE: 50 },
}));

vi.mock("@/lib/edge-awards", () => ({
    recordEdgeEventOnce: vi.fn(),
}));

function makeRequest(id: string): [NextRequest, { params: Promise<{ id: string }> }] {
    return [
        new NextRequest(`http://localhost/api/lessons/${id}/complete`, {
            method: "POST",
        }),
        { params: Promise.resolve({ id }) },
    ];
}

// A level with lessons l1 -> l2 -> l3 in order
const levelWithThreeLessons = {
    status: "published",
    module: {
        level: {
            modules: [
                {
                    lessons: [{ id: "l1" }, { id: "l2" }, { id: "l3" }],
                },
            ],
        },
    },
};

describe("POST /api/lessons/[id]/complete", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthUser).mockResolvedValue({ id: "user-1" } as any);
        vi.mocked(addXP).mockResolvedValue({
            newLevel: null,
            leveledUp: false,
        } as any);
        vi.mocked(checkAndGrantBadge).mockResolvedValue({
            granted: false,
        } as any);
        vi.mocked(recordEdgeEventOnce).mockResolvedValue(undefined as any);
        vi.mocked(prisma.userProgress.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ settings: {} } as any);
    });

    it("returns 401 when not authenticated", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(null);
        const [req, params] = makeRequest("l1");
        const res = await POST(req, params);
        expect(res.status).toBe(401);
    });

    it("blocks a new completion when previous lessons are not complete", async () => {
        vi.mocked(prisma.lesson.findUnique).mockResolvedValue(
            levelWithThreeLessons as any
        );
        // Only 1 of the 2 previous lessons is completed
        vi.mocked(prisma.userProgress.count).mockResolvedValue(1);

        const [req, params] = makeRequest("l3");
        const res = await POST(req, params);

        expect(res.status).toBe(403);
        expect(prisma.userProgress.upsert).not.toHaveBeenCalled();
        expect(addXP).not.toHaveBeenCalled();
    });

    it("blocks completing a draft lesson", async () => {
        vi.mocked(prisma.lesson.findUnique).mockResolvedValue({
            status: "draft",
            module: { level: { modules: [] } },
        } as any);

        const [req, params] = makeRequest("l1");
        const res = await POST(req, params);

        expect(res.status).toBe(403);
        expect(prisma.userProgress.upsert).not.toHaveBeenCalled();
    });

    it("allows the first lesson and grants XP + edge event", async () => {
        vi.mocked(prisma.lesson.findUnique).mockResolvedValue(
            levelWithThreeLessons as any
        );
        vi.mocked(prisma.userProgress.upsert).mockResolvedValue({
            id: "p1",
        } as any);
        vi.mocked(prisma.userProgress.count).mockResolvedValue(1);

        const [req, params] = makeRequest("l1");
        const res = await POST(req, params);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(prisma.userProgress.upsert).toHaveBeenCalledOnce();
        expect(addXP).toHaveBeenCalledWith("user-1", XP_AWARDS.LESSON_COMPLETE);
        expect(recordEdgeEventOnce).toHaveBeenCalledWith(
            expect.objectContaining({ eventType: "LESSON_COMPLETE" })
        );
        expect(body.gamification.xpEarned).toBe(XP_AWARDS.LESSON_COMPLETE);
    });

    it("is idempotent: re-completing an already-completed lesson grants no XP and skips the gate", async () => {
        vi.mocked(prisma.userProgress.findUnique).mockResolvedValue({
            isCompleted: true,
        } as any);
        vi.mocked(prisma.userProgress.upsert).mockResolvedValue({
            id: "p1",
        } as any);
        vi.mocked(prisma.userProgress.count).mockResolvedValue(5);

        const [req, params] = makeRequest("l3");
        const res = await POST(req, params);
        const body = await res.json();

        expect(res.status).toBe(200);
        // Gate skipped: lesson.findUnique must NOT have been called
        expect(prisma.lesson.findUnique).not.toHaveBeenCalled();
        expect(prisma.userProgress.upsert).toHaveBeenCalledOnce();
        expect(addXP).not.toHaveBeenCalled();
        expect(body.gamification.xpEarned).toBe(0);
    });
});
