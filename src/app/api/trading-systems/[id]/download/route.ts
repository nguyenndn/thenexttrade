import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getProtectedAssetStream } from "@/lib/storage/object-storage";
import { AccountStatus, PlatformType } from "@prisma/client";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const searchParams = request.nextUrl.searchParams;
        const platformParam = searchParams.get("platform");

        if (!platformParam || platformParam !== "MT5") {
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

        const filePath = product.fileMT5;

        if (!filePath) {
            return new NextResponse("File not found for the requested platform", {
                status: 404,
            });
        }

        // Check entitlement (honoring per-product EAProductAccess overrides)
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
            // Check Pro Entitlement — ACTIVE or valid GRACE, honoring expiry.
            const proEntitlement = await prisma.proEntitlement.findFirst({
                where: {
                    userId: user.id,
                    status: { in: ["ACTIVE", "GRACE"] },
                    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
                },
            });

            if (proEntitlement) {
                hasAccess = true;
            } else {
                // Check EA License — must also be unexpired.
                const eaLicense = await prisma.eALicense.findFirst({
                    where: {
                        userId: user.id,
                        status: AccountStatus.APPROVED,
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: now } },
                        ],
                    },
                });

                if (eaLicense) {
                    hasAccess = true;
                }
            }
        }

        if (!hasAccess) {
            return new NextResponse("Forbidden - No active license or Pro subscription", {
                status: 403,
            });
        }

        const isExternalUrl =
            filePath.startsWith("https://") || filePath.startsWith("http://");

        // If stored in R2/local storage, verify stream before logging download
        const stream = isExternalUrl
            ? null
            : await getProtectedAssetStream(filePath);
        if (!isExternalUrl && !stream) {
            return new NextResponse("File not found in storage", { status: 404 });
        }

        // Log download
        await prisma.eADownload.create({
            data: {
                userId: user.id,
                productId: product.id,
                platform: platform,
                version: product.version,
                ipAddress: getClientIpFromHeaders(
                    request.headers,
                    "unknown"
                ),
                userAgent: request.headers.get("user-agent"),
            },
        });

        await prisma.eAProduct.update({
            where: { id: product.id },
            data: { totalDownloads: { increment: 1 } },
        });

        // Record product usage event (DOWNLOAD) and update EAProductAccess
        try {
            await prisma.eAProductUsageEvent.create({
                data: {
                    userId: user.id,
                    productId: product.id,
                    eventType: "DOWNLOAD",
                    productVersion: product.version,
                },
            });
            await prisma.eAProductAccess.updateMany({
                where: {
                    userId: user.id,
                    productId: product.id,
                },
                data: {
                    lastDownloadedAt: new Date(),
                },
            });
        } catch (err) {
            console.error("[API] Error updating product download access telemetry:", err);
        }

        if (isExternalUrl) {
            return NextResponse.redirect(filePath);
        }

        // Set response headers
        const filename = filePath.split("/").pop() || "download.ex5";
        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${filename}"`);
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Cache-Control", "no-cache");

        // The SDK returns a Node stream; convert it to bytes so Next.js can
        // send a valid body (a raw Node stream is not a valid BodyInit).
        const bytes = await stream!.transformToByteArray();
        headers.set("Content-Length", String(bytes.length));

        return new NextResponse(Buffer.from(bytes), { headers });
    } catch (error) {
        console.error("[API] Error downloading EA file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
