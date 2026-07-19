import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
    parseBrokerCsv,
    previewCsvImport,
    executeCsvImport,
} from "@/lib/services/ib-import.service";

/**
 * POST /api/admin/ib/import
 * Body: { csv: string, execute?: boolean }
 * - Without execute: preview mode (returns matched/unmatched)
 * - With execute=true: actually imports the data
 */
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const { csv, execute } = body;

        if (!csv || typeof csv !== "string") {
            return NextResponse.json(
                { error: "CSV content is required" },
                { status: 400 }
            );
        }

        const rows = parseBrokerCsv(csv);
        if (rows.length === 0) {
            return NextResponse.json(
                {
                    error: "No valid rows found. Required columns: account_number, lots or commission",
                },
                { status: 400 }
            );
        }

        if (execute) {
            const result = await executeCsvImport(rows, auth.user.id);
            return NextResponse.json({
                success: true,
                ...result,
            });
        }

        // Preview mode
        const preview = await previewCsvImport(rows);
        return NextResponse.json({
            success: true,
            preview: true,
            ...preview,
        });
    } catch (error: any) {
        console.error("[IB Import Error]:", error);
        return NextResponse.json(
            { error: "Import failed", detail: error.message },
            { status: 500 }
        );
    }
}
