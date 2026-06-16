import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { linkPlanToTrade } from "@/actions/trade-plans";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { journalEntryId } = await request.json();
    if (!journalEntryId) {
      return NextResponse.json({ error: "journalEntryId is required" }, { status: 400 });
    }

    const result = await linkPlanToTrade(id, journalEntryId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, plan: result.plan });
  } catch {
    return NextResponse.json({ error: "Failed to link plan to trade" }, { status: 500 });
  }
}
