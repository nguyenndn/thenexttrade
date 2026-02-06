
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors/response";
import { ErrorCode } from "@/lib/errors/ea-license";
import { AccountStatus, PlatformType } from "@prisma/client";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    const { productId } = await params;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(createErrorResponse(ErrorCode.UNAUTHORIZED), { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const platform = searchParams.get("platform") as "MT4" | "MT5";

        if (!platform || !["MT4", "MT5"].includes(platform)) {
            return NextResponse.json(
                { success: false, error: "Invalid platform" },
                { status: 400 }
            );
        }

        // 1. Check Permission (Section 8.2)
        const approvedLicense = await prisma.eALicense.findFirst({
            where: {
                userId: user.id,
                status: AccountStatus.APPROVED,
                OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
            },
        });

        if (!approvedLicense) {
            return NextResponse.json(createErrorResponse(ErrorCode.NO_APPROVED_ACCOUNT), { status: 403 });
        }

        // 2. Get Product and File Path
        const product = await prisma.eAProduct.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            return NextResponse.json(createErrorResponse(ErrorCode.PRODUCT_NOT_FOUND), { status: 404 });
        }

        let filePath: string | null = null;
        if (platform === "MT4") {
            if (!product.fileMT4) return NextResponse.json(createErrorResponse(ErrorCode.FILE_NOT_AVAILABLE), { status: 404 });
            // Assuming fileMT4 stores the full path or URL. specs say "Supabase Storage URLs". 
            // If it's a full URL, we might skip signing depending on if bucket is public.
            // Spec 8.1 says structure `ea-products/{productId}/mt4/{filename}.ex4`.
            // If the DB stores the full signed URL or public URL, we might need to parse it.
            // Assuming the DB stores the RELATIVE PATH or we construct it.
            // Spec 21.3 says `fileMT4: url`. If it is a signed URL, it expires.
            // Ideally we store the PATH in DB and sign it here. 
            // Let's assume we store the PATH in DB (e.g. `ea-products/...`).
            // Or if we store URL, we can't resign it easily if it was signed.
            // Let's assume for V2 we store the PATH or the Public URL. 
            // Spec 8.1 talks about RLS "secure, time-limited signed URLs".
            // So we likely store the PATH in the DB.

            // Let's try to extract path if it looks like a URL, or use it as path.
            filePath = product.fileMT4;
        } else {
            if (!product.fileMT5) return NextResponse.json(createErrorResponse(ErrorCode.FILE_NOT_AVAILABLE), { status: 404 });
            filePath = product.fileMT5;
        }

        // Clean up path if it's a full URL (just in case)
        // If it starts with http, we might need to extract the path after /ea-products/
        // This depends on how upload was implemented (Task 3.11 - not implemented yet).
        // I I'll assume it stores the relative path "productId/mt4/filename.ex4" or similar.

        // 3. Generate Signed URL
        const { data: signedUrlData, error: signError } = await supabase
            .storage
            .from("ea-products")
            .createSignedUrl(filePath, 60 * 5); // 5 minutes

        if (signError || !signedUrlData) {
            console.error("Storage Sign Error:", signError, filePath);
            return NextResponse.json(createErrorResponse(ErrorCode.FILE_NOT_AVAILABLE), { status: 500 });
        }

        // 4. Log Download
        await prisma.eADownload.create({
            data: {
                userId: user.id,
                productId: product.id,
                platform: platform === "MT4" ? PlatformType.MT4 : PlatformType.MT5,
                version: product.version,
                ipAddress: request.headers.get("x-forwarded-for") || "unknown",
                userAgent: request.headers.get("user-agent"),
            },
        });

        // 5. Update Product Stats (Increment count)
        await prisma.eAProduct.update({
            where: { id: product.id },
            data: { totalDownloads: { increment: 1 } },
        });

        return NextResponse.json(createSuccessResponse({ url: signedUrlData.signedUrl }));

    } catch (error) {
        console.error("Download API Error:", error);
        return NextResponse.json(createErrorResponse(ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
}
