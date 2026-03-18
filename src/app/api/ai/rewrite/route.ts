import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

async function getWriterPersona(): Promise<string> {
    try {
        const personaPath = path.join(process.cwd(), "content", "writer-persona.md");
        return await readFile(personaPath, "utf-8");
    } catch {
        return "Write in a friendly, professional tone. Use short paragraphs and bullet points.";
    }
}

interface ExtractedImage {
    alt: string;
    url: string;
    placeholder: string;
}

function extractImages(markdown: string): { text: string; images: ExtractedImage[] } {
    const images: ExtractedImage[] = [];
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let index = 0;

    while ((match = imgRegex.exec(markdown)) !== null) {
        const imgUrl = match[2].trim();
        // Skip tiny icons, tracking pixels, and data URIs
        if (imgUrl.startsWith('data:') || imgUrl.includes('1x1') || imgUrl.includes('pixel')) continue;
        index++;
        images.push({
            alt: match[1] || `Image ${index}`,
            url: imgUrl,
            placeholder: `[IMAGE_${index}]`,
        });
    }

    return { text: markdown, images };
}

async function scrapeUrl(url: string): Promise<{ content: string; images: ExtractedImage[] }> {
    if (!FIRECRAWL_API_KEY) {
        throw new Error("FIRECRAWL_API_KEY is not configured. Add it to .env.local (get free key at firecrawl.dev)");
    }

    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
        }),
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`FireCrawl failed (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const markdown = data.data?.markdown || "";

    if (!markdown) throw new Error("FireCrawl returned no content");

    const { text, images } = extractImages(markdown);
    return { content: text.substring(0, 8000), images };
}

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured. Add it to .env.local" },
            { status: 500 }
        );
    }

    try {
        const { url, pastedContent, mode } = await req.json();

        if (!url && !pastedContent) {
            return NextResponse.json({ error: "URL or content is required" }, { status: 400 });
        }

        // 1. Get content — either from URL (FireCrawl) or pasted directly
        let scrapedContent: string;
        let images: ExtractedImage[] = [];
        if (pastedContent && typeof pastedContent === "string") {
            const extracted = extractImages(pastedContent);
            scrapedContent = extracted.text.substring(0, 8000);
            images = extracted.images;
        } else {
            const result = await scrapeUrl(url);
            scrapedContent = result.content;
            images = result.images;
        }

        if (scrapedContent.length < 100) {
            return NextResponse.json(
                { error: "Not enough content to work with (min 100 chars)" },
                { status: 400 }
            );
        }

        // 2. Load writer persona
        const persona = await getWriterPersona();

        // 3. Build prompt based on mode
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        let prompt: string;

        if (mode === "summary") {
            prompt = `You are a content analyst. Read the following article and create:

1. A new, original TITLE (do not copy the original title)
2. A SUMMARY of the key points in 3-5 bullet points
3. A brief outline of what a rewritten lesson should cover

## Writer Persona (follow this style):
${persona}

## Source Content:
${scrapedContent}

## Output Format (respond ONLY in this JSON format):
{
  "title": "Your original title here",
  "content": "<h2>Key Points</h2><ul><li>Point 1</li><li>Point 2</li>...</ul><h2>Lesson Outline</h2><p>...</p>"
}

IMPORTANT: Output MUST be valid JSON only. No markdown code blocks. No extra text.`;
        } else {
            const imageInstructions = images.length > 0
                ? `\n\n## Available Images (use these placeholders in your HTML where relevant):\n${images.map(img => `- ${img.placeholder}: "${img.alt}"`).join('\n')}\n\nPlace image placeholders between paragraphs where they best illustrate the content. Use the exact placeholder text like ${images[0]?.placeholder || '[IMAGE_1]'}.`
                : '';

            prompt = `You are "Captain TheNextTrade", a professional forex trading educator. Your task is to read the source article and create a COMPLETELY NEW lesson with:

1. A new, original TITLE (do not copy the original title)
2. Fully rewritten CONTENT that:
   - Covers the same educational concepts
   - Uses completely different structure, order, and wording
   - Follows the Writer Persona guidelines exactly
   - Is formatted in clean HTML (h2, h3, p, ul, li, strong, em, table, etc.)
   - Includes practical Gold (XAU/USD) examples where relevant
   - Has 💡 Key Takeaway boxes (use <blockquote> with 💡 emoji)
   - Has ⚠️ Common Mistake boxes where relevant (use <blockquote> with ⚠️ emoji)
   - Ends with a 📝 Quick Recap section
${imageInstructions}

## Writer Persona:
${persona}

## Source Content:
${scrapedContent}

## Output Format (respond ONLY in this JSON format):
{
  "title": "Your completely original title here",
  "content": "<h2>Section 1</h2><p>...</p>..."
}

CRITICAL RULES:
- Output MUST be valid JSON only. No markdown code blocks. No extra text.
- Do NOT copy any sentences from the source. Rewrite everything.
- The structure and flow should be different from the source.
- Keep the lesson around 800-1200 words (about 5 min read).
- Use HTML tags for formatting, NOT markdown.`;
        }

        // 4. Call Gemini
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // 5. Parse JSON response
        const cleanJson = responseText
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

        let parsed: { title: string; content: string };
        try {
            parsed = JSON.parse(cleanJson);
        } catch {
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("AI returned invalid format");
            }
        }

        // 6. Replace image placeholders with actual <img> tags
        let finalContent = parsed.content || "";
        const usedImages = new Set<number>();

        for (const img of images) {
            if (finalContent.includes(img.placeholder)) {
                finalContent = finalContent.replace(
                    img.placeholder,
                    `<img src="${img.url}" alt="${img.alt}" style="max-width:100%;border-radius:8px;margin:16px 0" />`
                );
                usedImages.add(images.indexOf(img));
            }
        }

        // Append unused images at the end (before Quick Recap if it exists)
        const unusedImgs = images
            .filter((_, i) => !usedImages.has(i))
            .map(img => `<img src="${img.url}" alt="${img.alt}" style="max-width:100%;border-radius:8px;margin:16px 0" />`)
            .join('');

        if (unusedImgs) {
            const recapIndex = finalContent.lastIndexOf('<h2>');
            if (recapIndex > 0) {
                finalContent = finalContent.slice(0, recapIndex) + unusedImgs + finalContent.slice(recapIndex);
            } else {
                finalContent += unusedImgs;
            }
        }

        return NextResponse.json({
            title: parsed.title || "Untitled Lesson",
            content: finalContent,
            mode,
            imageCount: images.length,
        });
    } catch (error: any) {
        console.error("[AI Rewrite Error]", error);
        return NextResponse.json(
            { error: error.message || "Failed to rewrite content" },
            { status: 500 }
        );
    }
}
