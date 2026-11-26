import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { updateEAProductSchema } from "@/lib/validations/ea-license";
import { ErrorCode } from "@/lib/errors/ea-license";
import { checkAdminApiAccess } from "@/lib/admin/trading-systems/check-admin-api.server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await checkAdminApiAccess();
        if (!auth.isAuthorized || !auth.user) {
            return NextResponse.json(
                { success: false, error: ErrorCode.NOT_ADMIN },
                { status: auth.status }
            );
        }

        const { id: productId } = await params;
        const body = await request.json();
        const validated = updateEAProductSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        validated.error.issues[0]?.message ||
                        "Invalid product payload",
                },
                { status: 400 }
            );
        }

        const product = await prisma.eAProduct.findUnique({
            where: { id: productId },
        });
        if (!product) {
            return NextResponse.json(
                { success: false, error: ErrorCode.PRODUCT_NOT_FOUND },
                { status: 404 }
            );
        }

        if (validated.data.slug && validated.data.slug !== product.slug) {
            const existingSlug = await prisma.eAProduct.findFirst({
                where: {
                    slug: validated.data.slug,
                    id: { not: productId },
                },
                select: { id: true },
            });
            if (existingSlug) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Slug "${validated.data.slug}" is already in use`,
                    },
                    { status: 409 }
                );
            }
        }

        const updatedProduct = await prisma.eAProduct.update({
            where: { id: productId },
            data: validated.data,
        });

        await prisma.auditLog.create({
            data: {
                adminId: auth.user.id,
                action: "PRODUCT_UPDATED",
                targetType: "EAProduct",
                targetId: productId,
                details: JSON.parse(
                    JSON.stringify({ changes: validated.data })
                ),
            },
        });

        revalidatePath("/admin/trading-systems");
        revalidatePath("/admin/trading-systems/products");
        revalidatePath(`/admin/trading-systems/${productId}`);
        revalidatePath(`/admin/trading-systems/${product.slug}`);
        revalidatePath(`/admin/trading-systems/${updatedProduct.slug}`);
        revalidatePath("/dashboard/trading-systems");
        revalidatePath(`/dashboard/trading-systems/${product.slug}`);
        revalidatePath(`/dashboard/trading-systems/${updatedProduct.slug}`);
        revalidatePath("/trading-systems");
        revalidatePath(`/trading-systems/${product.slug}`);
        revalidatePath(`/trading-systems/${updatedProduct.slug}`);

        return NextResponse.json({
            success: true,
            data: { id: updatedProduct.id, slug: updatedProduct.slug },
        });
    } catch (error) {
        console.error("[Admin EA API] PATCH product failed:", error);
        return NextResponse.json(
            { success: false, error: ErrorCode.INTERNAL_ERROR },
            { status: 500 }
        );
    }
}
