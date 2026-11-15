import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/storage/object-storage";
import {
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/errors/response";
import { ErrorCode } from "@/lib/errors/ea-license";
import { AccountStatus, PlatformType } from "@prisma/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    const { productId } = await params;
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                createErrorResponse(ErrorCode.UNAUTHORIZED),
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const platform = (searchParams.get("platform") || "MT5") as "MT5";

        if (platform !== "MT5") {
            return NextResponse.json(
                { success: false, error: "Invalid platform" },
                { status: 400 }
            );
        }

        // 1. Get Product and File Path
        const product = await prisma.eAProduct.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            return NextResponse.json(
                createErrorResponse(ErrorCode.PRODUCT_NOT_FOUND),
                { status: 404 }
            );
        }

        const filePath = product.fileMT5;
        if (!filePath) {
            return NextResponse.json(
                createErrorResponse(ErrorCode.FILE_NOT_AVAILABLE),
                { status: 404 }
            );
        }

        // 2. Check Permission: EAProductAccess override, Free product, Pro Entitlement, Approved EA License, or ADMIN
        const now = new Date();
        const [profile, productAccessRows] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId: user.id },
                select: { role: true },
            }),
            prisma.eAProductAccess.findMany({
                where: {
                    userId: user.id,
                    productId: product.id,
                },
                select: {
                    status: true,
                    expiresAt: true,
                },
            }),
        ]);

        const isAdmin = profile?.role === "ADMIN";
        const hasGrantedProductAccess = productAccessRows.some(
            (row) =>
                row.status === "GRANTED" &&
                (!row.expiresAt || row.expiresAt >= now)
        );
        const isExplicitlyRevoked =
            !hasGrantedProductAccess &&
            productAccessRows.some((row) => row.status === "REVOKED");

        let hasAccess = false;
        if (isAdmin) {
            hasAccess = true;
        } else if (isExplicitlyRevoked) {
            hasAccess = false;
        } else if (hasGrantedProductAccess) {
            hasAccess = true;
        } else if (product.isFree) {
            hasAccess = true;
        } else {
            const proEntitlement = await prisma.proEntitlement.findFirst({
                where: {
                    userId: user.id,
                    status: { in: ["ACTIVE", "GRACE"] },
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gte: now } },
                    ],
                },
            });

            if (proEntitlement) {
                hasAccess = true;
            } else {
                const approvedLicense = await prisma.eALicense.findFirst({
                    where: {
                        userId: user.id,
                        status: AccountStatus.APPROVED,
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: now } },
                        ],
                    },
                });
                if (approvedLicense) {
                    hasAccess = true;
                }
            }
        }

        if (!hasAccess) {
            return NextResponse.json(
                createErrorResponse(ErrorCode.NO_APPROVED_ACCOUNT),
                { status: 403 }
            );
        }

        // 3. Resolve Download URL
        const filename = filePath.split("/").pop() || "download.ex5";
        let downloadUrl: string;
        let logDirectlyHere = true;

        if (
            filePath.startsWith("http://") ||
            filePath.startsWith("https://")
        ) {
            downloadUrl = filePath;
        } else if (isR2Configured) {
            // Product files are uploaded to R2. Use the protected streaming
            // endpoint, which sends Content-Disposition and logs the download.
            downloadUrl = `/api/trading-systems/${product.id}/download?platform=${platform}`;
            logDirectlyHere = false;
        } else {
            const { data: signedUrlData, error: signError } =
                await supabase.storage
                    .from("ea-products")
                    .createSignedUrl(filePath, 60 * 5, { download: filename }); // 5 minutes expiration

            if (!signError && signedUrlData?.signedUrl) {
                downloadUrl = signedUrlData.signedUrl;
            } else {
                // Fall back to the protected R2 streaming endpoint (which logs the download on stream)
                downloadUrl = `/api/trading-systems/${product.id}/download?platform=${platform}`;
                logDirectlyHere = false;
            }
        }

        if (logDirectlyHere) {
            // 4. Log Download
            await prisma.eADownload.create({
                data: {
                    userId: user.id,
                    productId: product.id,
                    platform: PlatformType.MT5,
                    version: product.version,
                    ipAddress:
                        request.headers.get("x-forwarded-for") || "unknown",
                    userAgent: request.headers.get("user-agent"),
                },
            });

            // 5. Update Product Stats (Increment count)
            await prisma.eAProduct.update({
                where: { id: product.id },
                data: { totalDownloads: { increment: 1 } },
            });
        }

        return NextResponse.json(
            createSuccessResponse({ url: downloadUrl, filename })
        );
    } catch (error) {
        console.error("Download API Error:", error);
        return NextResponse.json(
            createErrorResponse(ErrorCode.INTERNAL_ERROR),
            { status: 500 }
        );
    }
}
