import { NextResponse, NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * GET /api/app/version
 * Returns the latest version info for TheNextTrade Connect app.
 * Reads from public/downloads/app-release.json (single source of truth).
 *
 * Release workflow:
 * 1. Build new exe → change VERSION in main.py
 * 2. Upload exe as: public/downloads/TheNextTradeConnect.exe
 * 3. Edit public/downloads/app-release.json → bump "version"
 * Done! All users see the update.
 */
export async function GET(request: NextRequest) {
  try {
    const releasePath = path.join(
      process.cwd(),
      "public",
      "downloads",
      "app-release.json"
    );
    const raw = await readFile(releasePath, "utf-8");
    const release = JSON.parse(raw);

    // Derive base URL from the incoming request
    const origin = request.nextUrl.origin;

    return NextResponse.json({
      version: release.version,
      downloadUrl: `${origin}/downloads/TheNextTradeConnect.exe`,
      changelog: release.changelog || "",
      mandatory: release.mandatory || false,
    });
  } catch {
    return NextResponse.json(
      { error: "Release info not found" },
      { status: 500 }
    );
  }
}
