import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const strategySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    rules: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const [strategies, total] = await Promise.all([
            prisma.strategy.findMany({
                where: { userId: user.id },
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    rules: true,
                    color: true,
                },
                skip,
                take: limit,
            }),
            prisma.strategy.count({ where: { userId: user.id } })
        ]);

        return NextResponse.json({
            strategies,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get strategies error:", error);
        return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = strategySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid data", details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { name, description, rules, color } = validation.data;

        const existing = await prisma.strategy.findUnique({
            where: { userId_name: { userId: user.id, name } },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Strategy with this name already exists" },
                { status: 409 }
            );
        }

        const strategy = await prisma.strategy.create({
            data: {
                userId: user.id,
                name,
                description,
                rules,
                color: color || "#6366F1",
            },
        });

        return NextResponse.json({ strategy }, { status: 201 });
    } catch (error) {
        console.error("Create strategy error:", error);
        return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
    }
}
