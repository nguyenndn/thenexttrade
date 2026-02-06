import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateTagSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const tag = await prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        });

        if (!tag) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        return NextResponse.json(tag);
    } catch (error) {
        console.error("Error fetching tag:", error);
        return NextResponse.json({ error: "Failed to fetch tag" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        
        // Check if tag exists
        const existing = await prisma.tag.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = updateTagSchema.parse(body);

        // If slug is provided, check for uniqueness
        if (validatedData.slug && validatedData.slug !== existing.slug) {
            const slugExists = await prisma.tag.findFirst({
                where: {
                    slug: validatedData.slug,
                    id: { not: id },
                },
            });
            if (slugExists) {
                return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
            }
        }

        // Auto-generate slug if name changed but slug not provided
        let updateData: any = { ...validatedData };
        if (validatedData.name && !validatedData.slug) {
            const newSlug = validatedData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            
            // Check if auto-generated slug conflicts
            const slugConflict = await prisma.tag.findFirst({
                where: {
                    slug: newSlug,
                    id: { not: id },
                },
            });
            
            // Only update slug if no conflict
            if (!slugConflict) {
                updateData.slug = newSlug;
            }
        }

        const tag = await prisma.tag.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        });

        return NextResponse.json(tag);
    } catch (error) {
        console.error("Error updating tag:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        
        // Check if tag exists
        const existing = await prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        // Check if tag has articles
        if (existing._count.articles > 0) {
            return NextResponse.json(
                { error: "Cannot delete tag with articles. Please remove tag from articles first." },
                { status: 400 }
            );
        }

        await prisma.tag.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Tag deleted" });
    } catch (error) {
        console.error("Error deleting tag:", error);
        return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
    }
}
