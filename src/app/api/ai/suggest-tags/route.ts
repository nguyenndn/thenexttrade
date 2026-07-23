import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { executeAiGateway } from "@/lib/ai-gateway/provider-router";

export async function POST(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const { title, content } = await req.json();

        if (!title && !content) {
            return NextResponse.json(
                { error: "Title or content is required" },
                { status: 400 }
            );
        }

        // Fetch all existing tags from DB
        const existingTags = await prisma.tag.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { name: "asc" },
        });

        const tagNames = existingTags.map((t) => t.name).join(", ");

        // Strip HTML from content for cleaner analysis
        const plainContent = (content || "")
            .replace(/<[^>]*>?/gm, "")
            .substring(0, 3000);

        const prompt = `You are a content categorization expert for a forex/trading education website called TheNextTrade.

## Task
Analyze the article below and suggest the most relevant tags from the EXISTING tag list. 
Also suggest up to 3 NEW tags if no existing tag covers an important topic in the article.

## EXISTING TAGS (pick from these first):
${tagNames}

## ARTICLE:
Title: ${title || "Untitled"}
Content: ${plainContent || "(no content yet)"}

## Rules:
1. Select 3-6 tags total (existing + new combined)
2. Prioritize EXISTING tags — only suggest NEW tags if truly needed
3. New tag names should be: lowercase, 1-3 words, professional (e.g. "scalping", "candlestick patterns", "risk management")
4. Tags must be relevant to the article content, not generic

## Output Format (JSON only):
{
 "existingTagIds": ["id1", "id2"],
 "newTagNames": ["tag name 1"]
}

IMPORTANT: existingTagIds must contain actual IDs from the existing tags list. Output ONLY valid JSON.`;

        const gatewayResult = await executeAiGateway({
            requestId: `tag_${randomUUID()}`,
            userId: auth.user.id,
            snapshot: { title, content: plainContent },
            systemPrompt: prompt,
            taskKey: "SUGGEST_TAGS",
            skipTradingSchemaValidation: true,
        });

        if (!gatewayResult.ok || !gatewayResult.rawResult) {
            throw new Error(gatewayResult.message || "AI Gateway execution failed.");
        }

        const rawContent = gatewayResult.rawResult;
        const responseText = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

        let parsed: { existingTagIds: string[]; newTagNames: string[] };
        try {
            parsed = JSON.parse(responseText);
        } catch {
            const cleaned = responseText
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            parsed = JSON.parse(cleaned);
        }

        // Validate existing tag IDs
        const validExistingIds =
            parsed.existingTagIds?.filter((id) =>
                existingTags.some((t) => t.id === id)
            ) || [];

        // Create new tags
        const createdTags: { id: string; name: string }[] = [];
        if (parsed.newTagNames?.length) {
            for (const name of parsed.newTagNames.slice(0, 3)) {
                const slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");

                // Skip if a tag with this slug already exists
                const existing = existingTags.find((t) => t.slug === slug);
                if (existing) {
                    if (!validExistingIds.includes(existing.id)) {
                        validExistingIds.push(existing.id);
                    }
                    continue;
                }

                const tag = await prisma.tag.create({
                    data: { name, slug },
                });
                createdTags.push({ id: tag.id, name: tag.name });
            }
        }

        const allTagIds = [
            ...validExistingIds,
            ...createdTags.map((t) => t.id),
        ];

        // Fetch full tag objects for display
        const selectedTags = await prisma.tag.findMany({
            where: { id: { in: allTagIds } },
            select: { id: true, name: true, slug: true },
        });

        return NextResponse.json({
            tags: selectedTags,
            tagIds: allTagIds,
            newTagsCreated: createdTags.length,
        });
    } catch (error: any) {
        console.error("[AI Suggest Tags Error]", error);
        return NextResponse.json(
            { error: error.message || "Failed to suggest tags" },
            { status: 500 }
        );
    }
}
