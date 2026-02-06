import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { parseTradeFile } from "@/lib/importers";

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large (max 5MB)" },
                { status: 400 }
            );
        }

        // Read file content
        const content = await file.text();

        // Parse trades
        const result = await parseTradeFile(content, file.name);

        return NextResponse.json({
            success: true,
            filename: file.name,
            fileSize: file.size,
            source: result.metadata.source,
            totalParsed: result.trades.length,
            errors: result.errors,
            trades: result.trades, // Preview data
            metadata: result.metadata,
        });
    } catch (error) {
        console.error("Parse error:", error);
        return NextResponse.json(
            { error: "Failed to parse file" },
            { status: 500 }
        );
    }
}
