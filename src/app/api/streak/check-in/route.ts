import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isSameDay, isYesterday } from "date-fns";
import { addXP, checkAndGrantBadge } from "@/lib/gamification";

export async function POST(req: Request) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const dbUser = await prisma.user.findUnique({
 where: { id: user.id },
 select: { streak: true, lastCheckIn: true, checkInHistory: true }
 });

 if (!dbUser) {
 return NextResponse.json({ error: "User not found" }, { status: 404 });
 }

 const now = new Date();
 const lastCheckIn = dbUser.lastCheckIn ? new Date(dbUser.lastCheckIn) : null;

 // Check if already checked in today
 if (lastCheckIn && isSameDay(now, lastCheckIn)) {
 return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
 }

 let newStreak = 1;
 if (lastCheckIn && isYesterday(lastCheckIn)) {
 newStreak = dbUser.streak + 1;
 }

 // Update history
 const history = (dbUser.checkInHistory as string[]) || [];
 history.push(now.toISOString());

 // Keep history size manageable (Optional, e.g., last 365 days)

 const updatedUser = await prisma.user.update({
 where: { id: user.id },
 data: {
 streak: newStreak,
 lastCheckIn: now,
 checkInHistory: history
 }
 });

 // --- GAMIFICATION LOGIC ---
 let rewardMessage = "Streak Updated! +10 Edge";

 // 1. Base Reward: Daily Check-in
 await addXP(user.id, 10);

 // 2. Milestone Rewards (bonus XP on top of base)
 if (newStreak === 3) {
 await addXP(user.id, 20);
 rewardMessage = "3 Day Streak! +30 Edge Total!";
 } else if (newStreak === 7) {
 await addXP(user.id, 50);
 await checkAndGrantBadge(user.id, "WEEK_WARRIOR");
 rewardMessage = "7 Day Streak! +60 Edge + 'Week Warrior' Badge!";
 } else if (newStreak === 14) {
 await addXP(user.id, 100);
 rewardMessage = "14 Day Streak! +110 Edge Total!";
 } else if (newStreak === 30) {
 await addXP(user.id, 300);
 await checkAndGrantBadge(user.id, "MONTHLY_MASTER");
 rewardMessage = "30 Day Streak! +310 Edge + 'Monthly Master' Badge!";
 } else if (newStreak === 60) {
 await addXP(user.id, 500);
 rewardMessage = "60 Day Streak! +510 Edge Total!";
 } else if (newStreak === 90) {
 await addXP(user.id, 1000);
 await checkAndGrantBadge(user.id, "QUARTERLY_KING");
 rewardMessage = "90 Day Streak! +1010 Edge + 'Quarterly King' Badge!";
 } else if (newStreak === 100) {
 await addXP(user.id, 1500);
 await checkAndGrantBadge(user.id, "CENTURY_CLUB");
 rewardMessage = "100 Day Streak! +1510 Edge + 'Century Club' Badge!";
 } else if (newStreak === 365) {
 await addXP(user.id, 5000);
 await checkAndGrantBadge(user.id, "LEGENDARY");
 rewardMessage = "365 Days! +5010 Edge! You are LEGENDARY!";
 }

 // Record Event for missions
 let totalXpAwarded = 10;
 if (newStreak === 3) totalXpAwarded += 20;
 else if (newStreak === 7) totalXpAwarded += 50;
 else if (newStreak === 14) totalXpAwarded += 100;
 else if (newStreak === 30) totalXpAwarded += 300;
 else if (newStreak === 60) totalXpAwarded += 500;
 else if (newStreak === 90) totalXpAwarded += 1000;
 else if (newStreak === 100) totalXpAwarded += 1500;
 else if (newStreak === 365) totalXpAwarded += 5000;

 const { recordEdgeEvent } = await import("@/lib/edge-awards");
 await recordEdgeEvent({
 userId: user.id,
 eventType: "CHECKIN",
 sourceType: "DailyCheckIn",
 sourceId: now.toISOString().split("T")[0],
 xpAwarded: totalXpAwarded,
 });

 return NextResponse.json({
 streak: updatedUser.streak,
 lastCheckIn: updatedUser.lastCheckIn,
 message: rewardMessage
 });

 } catch (error) {
 console.error("Check-in error:", error);
 return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
 }
}
