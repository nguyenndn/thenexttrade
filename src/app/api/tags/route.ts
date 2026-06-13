
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
 const { searchParams } = new URL(request.url);
 const query = searchParams.get("query") || "";
 const ids = searchParams.get("ids");

 try {
 // If IDs are provided, fetch those specific tags
 if (ids) {
 const idList = ids.split(",").filter(Boolean);
 const tags = await prisma.tag.findMany({
 where: { id: { in: idList } },
 });
 return NextResponse.json(tags);
 }

 // The admin taxonomy list calls /api/tags without a query and needs the
 // full collection; typeahead/search callers still get a compact result.
 const tags = await prisma.tag.findMany({
 where: query
 ? {
 name: {
 contains: query,
 mode: "insensitive",
 },
 }
 : undefined,
 orderBy: { name: "asc" },
 ...(query ? { take: 10 } : {}),
 });

 return NextResponse.json(tags);
 } catch (error) {
 return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
 }
}

export async function POST(request: Request) {
 const auth = await requireAdmin();
 if (auth instanceof NextResponse) return auth;

 try {
 const { name } = await request.json();

 // Simple slugify
 const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

 const tag = await prisma.tag.upsert({
 where: { slug },
 update: {},
 create: { name, slug },
 });

 return NextResponse.json(tag);
 } catch (error) {
 return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
 }
}
