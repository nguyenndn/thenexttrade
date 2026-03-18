import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function getWriterPersona(): Promise<string> {
    try {
        const personaPath = path.join(process.cwd(), "content", "writer-persona.md");
        return await readFile(personaPath, "utf-8");
    } catch {
        return "Write in a friendly, professional tone. Use short paragraphs and bullet points.";
    }
}

async function scrapeUrl(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
        },
    });

    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);

    const html = await res.text();

    // Strip HTML tags but keep text structure
    const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
        .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, "\n## $2\n")
        .replace(/<li[^>]*>/gi, "\n- ")
        .replace(/<p[^>]*>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    // Limit to ~5000 chars to stay within token budget
    return text.substring(0, 8000);
}

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured. Add it to .env.local" },
            { status: 500 }
        );
    }

    try {
        const { url, mode } = await req.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // 1. Scrape URL content
        const scrapedContent = await scrapeUrl(url);

        if (scrapedContent.length < 100) {
            return NextResponse.json(
                { error: "Could not extract enough content from this URL" },
                { status: 400 }
            );
        }

        // 2. Load writer persona
        const persona = await getWriterPersona();

        // 3. Build prompt based on mode
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-05-06" });

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
            prompt = `You are "Captain GSN", a professional forex trading educator. Your task is to read the source article and create a COMPLETELY NEW lesson with:

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
            // Try to extract JSON from the response
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("AI returned invalid format");
            }
        }

        return NextResponse.json({
            title: parsed.title || "Untitled Lesson",
            content: parsed.content || "",
            mode,
        });
    } catch (error: any) {
        console.error("[AI Rewrite Error]", error);
        return NextResponse.json(
            { error: error.message || "Failed to rewrite content" },
            { status: 500 }
        );
    }
}
