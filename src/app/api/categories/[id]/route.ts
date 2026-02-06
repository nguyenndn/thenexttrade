import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true },
                },
                parent: true,
                children: true,
            },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
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
        
        // Check if category exists
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = updateCategorySchema.parse(body);

        // If slug is provided, check for uniqueness
        if (validatedData.slug && validatedData.slug !== existing.slug) {
            const slugExists = await prisma.category.findFirst({
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
            const slugConflict = await prisma.category.findFirst({
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

        const category = await prisma.category.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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
        
        // Check if category exists
        const existing = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Check if category has articles
        if (existing._count.articles > 0) {
            return NextResponse.json(
                { error: "Cannot delete category with articles. Please reassign articles first." },
                { status: 400 }
            );
        }

        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Category deleted" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
