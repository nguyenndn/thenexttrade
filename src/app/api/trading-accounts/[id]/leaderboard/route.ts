import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership and get account
  const account = await prisma.tradingAccount.findFirst({
    where: { id, userId: user.id },
    select: { id: true, accountType: true, server: true, lastSync: true, useForLeaderboard: true },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Only allow real accounts (synced + PERSONAL type, not demo server)
  if (!account.lastSync) {
    return NextResponse.json(
      { error: "Account must be synced at least once" },
      { status: 400 }
    );
  }

  const type = account.accountType?.toUpperCase();
  const isDemo =
    type === "DEMO" ||
    type === "CONTEST" ||
    account.server?.toLowerCase().includes("demo");

  if (isDemo) {
    return NextResponse.json(
      { error: "Only real accounts can be used for leaderboard" },
      { status: 400 }
    );
  }

  const newValue = !account.useForLeaderboard;

  // If enabling, disable all other accounts for this user first
  if (newValue) {
    await prisma.tradingAccount.updateMany({
      where: { userId: user.id, useForLeaderboard: true },
      data: { useForLeaderboard: false },
    });
  }

  // Toggle the current account
  await prisma.tradingAccount.update({
    where: { id },
    data: { useForLeaderboard: newValue },
  });

  return NextResponse.json({ useForLeaderboard: newValue });
}
