import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getProtectedAssetStream } from "@/lib/storage/object-storage";
import { AccountStatus, PlatformType } from "@prisma/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const searchParams = request.nextUrl.searchParams;
        const platformParam = searchParams.get("platform");

        if (!platformParam || (platformParam !== "MT4" && platformParam !== "MT5")) {
            return new NextResponse("Invalid platform", { status: 400 });
        }
        const platform: PlatformType = platformParam as PlatformType;

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get product
        const product = await prisma.eAProduct.findUnique({
            where: { id },
        });

        if (!product || !product.isActive) {
            return new NextResponse("Product not found or inactive", {
                status: 404,
            });
        }

        const filePath = platform === "MT4" ? product.fileMT4 : product.fileMT5;

        if (!filePath) {
            return new NextResponse("File not found for the requested platform", {
                status: 404,
            });
        }

        // Check entitlement
        let hasAccess = false;

        // 1. If product is free
        if (product.isFree) {
            hasAccess = true;
        } else {
            // 2. Check Pro Entitlement
            const proEntitlement = await prisma.proEntitlement.findFirst({
                where: {
                    userId: user.id,
                    status: "ACTIVE",
                },
            });

            if (proEntitlement) {
                hasAccess = true;
            } else {
                // 3. Check EA License
                const eaLicense = await prisma.eALicense.findFirst({
                    where: {
                        userId: user.id,
                        status: AccountStatus.APPROVED,
                    },
                });

                if (eaLicense) {
                    hasAccess = true;
                }
            }
        }

        // Admin check fallback
        if (!hasAccess) {
            const profile = await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { role: true },
            });
            if (profile?.role === "ADMIN" || profile?.role === "EDITOR") {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return new NextResponse("Forbidden - No active license or Pro subscription", {
                status: 403,
            });
        }

        // Fetch stream from R2
        const stream = await getProtectedAssetStream(filePath);
        if (!stream) {
            return new NextResponse("File not found in storage", { status: 404 });
        }

        // Log download
        await prisma.eADownload.create({
            data: {
                userId: user.id,
                productId: product.id,
                platform: platform,
                version: product.version,
            },
        });

        // Set response headers
        const filename = filePath.split("/").pop() || "download.ex5";
        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${filename}"`);
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Cache-Control", "no-cache");

        return new NextResponse(stream as any, { headers });
    } catch (error) {
        console.error("[API] Error downloading EA file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
