import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// ============================================================================
// HELPERS
// ============================================================================

async function loadFileContent(filePath: string): Promise<string> {
    try {
        return await readFile(filePath, "utf-8");
    } catch {
        return "";
    }
}

async function getSystemPrompt(): Promise<string> {
    return loadFileContent(path.join(process.cwd(), "content", "rewrite-system-prompt.md"));
}

async function getWriterPersona(): Promise<string> {
    const content = await loadFileContent(path.join(process.cwd(), "content", "writer-persona.md"));
    return content || "Write in a friendly, professional tone. Use short paragraphs and bullet points.";
}

async function getToneInstructions(tone: string): Promise<string> {
    if (!tone) return "";
    const content = await loadFileContent(path.join(process.cwd(), "content", "tones", `${tone}.md`));
    return content;
}

// ============================================================================
// IMAGE EXTRACTION
// ============================================================================

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

// ============================================================================
// FIRECRAWL SCRAPING
// ============================================================================

async function scrapeUrl(url: string): Promise<{ content: string; images: ExtractedImage[]; title: string }> {
    if (!FIRECRAWL_API_KEY) {
        throw new Error("FIRECRAWL_API_KEY is not configured. Add it to .env.local");
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
    const title = data.data?.metadata?.title || "";

    if (!markdown) throw new Error(`FireCrawl returned no content for ${url}`);

    const { text, images } = extractImages(markdown);
    return { content: text.substring(0, 6000), images, title };
}

// ============================================================================
// FALLBACK: Simple fetch + HTML text extraction
// ============================================================================

async function fallbackScrape(url: string): Promise<{ content: string; title: string }> {
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml",
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const html = await res.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch?.[1]?.trim() || "";

        // Strip HTML tags, scripts, styles → plain text
        const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, " ")
            .trim();

        if (textContent.length < 100) throw new Error("Not enough text content");

        return { content: textContent.substring(0, 5000), title };
    } catch {
        throw new Error(`Fallback scrape failed for ${url}`);
    }
}

// ============================================================================
// MULTI-SOURCE SCRAPING
// ============================================================================

interface ScrapedSource {
    url: string;
    content: string;
    title: string;
    images: ExtractedImage[];
}

async function scrapeMultipleSources(
    urls: string[],
    snippets?: Record<string, string>,
): Promise<{
    sources: ScrapedSource[];
    mergedContent: string;
    allImages: ExtractedImage[];
    rawContent: string;
}> {
    // Phase 1: Try FireCrawl for all URLs
    const results = await Promise.allSettled(
        urls.map(url => scrapeUrl(url))
    );

    const sources: ScrapedSource[] = [];
    const allImages: ExtractedImage[] = [];
    const failedUrls: string[] = [];

    results.forEach((result, i) => {
        if (result.status === "fulfilled") {
            sources.push({
                url: urls[i],
                content: result.value.content,
                title: result.value.title,
                images: result.value.images,
            });
            allImages.push(...result.value.images);
        } else {
            failedUrls.push(urls[i]);
        }
    });

    // Phase 2: For failed URLs, try fallback simple fetch
    if (failedUrls.length > 0) {
        const fallbackResults = await Promise.allSettled(
            failedUrls.map(url => fallbackScrape(url))
        );

        const stillFailed: string[] = [];
        fallbackResults.forEach((result, i) => {
            if (result.status === "fulfilled") {
                sources.push({
                    url: failedUrls[i],
                    content: result.value.content,
                    title: result.value.title,
                    images: [],
                });
            } else {
                stillFailed.push(failedUrls[i]);
            }
        });

        // Phase 3: For still-failed URLs, use snippet from search results
        if (stillFailed.length > 0 && snippets) {
            for (const url of stillFailed) {
                const snippet = snippets[url];
                if (snippet && snippet.length > 20) {
                    sources.push({
                        url,
                        content: snippet,
                        title: new URL(url).hostname,
                        images: [],
                    });
                }
            }
        }
    }

    if (sources.length === 0) {
        throw new Error("Failed to scrape any of the provided URLs. Try selecting different sources.");
    }

    // Build merged content for the prompt (labeled by source)
    const mergedContent = sources.map((s, i) =>
        `--- SOURCE ${i + 1} (${new URL(s.url).hostname}) ---\nTitle: ${s.title}\n\n${s.content}\n--- END SOURCE ${i + 1} ---`
    ).join("\n\n");

    // Build raw content backup (all sources concatenated)
    const rawContent = sources.map(s =>
        `## Source: ${s.url}\n\n${s.content}`
    ).join("\n\n---\n\n");

    return { sources, mergedContent, allImages, rawContent };
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildPrompt({
    mode,
    systemPrompt,
    persona,
    toneInstructions,
    sourceContent,
    images,
}: {
    mode: "summary" | "rewrite";
    systemPrompt: string;
    persona: string;
    toneInstructions: string;
    sourceContent: string;
    images: ExtractedImage[];
}): string {
    if (mode === "summary") {
        return `You are a content analyst. Read the following article(s) and create:

1. A new, original TITLE (do not copy the original title)
2. A SUMMARY of the key points in 3-5 bullet points
3. A brief outline of what a rewritten lesson should cover

## Writer Persona (follow this style):
${persona}

## Source Content:
${sourceContent}

## Output Format (respond ONLY in this JSON format):
{
  "title": "Your original title here",
  "content": "<h2>Key Points</h2><ul><li>Point 1</li><li>Point 2</li>...</ul><h2>Lesson Outline</h2><p>...</p>"
}

IMPORTANT: Output MUST be valid JSON only. No markdown code blocks. No extra text.`;
    }

    // Full Rewrite mode
    const imageInstructions = images.length > 0
        ? `\n\n## Available Images (use these placeholders in your HTML where relevant):\n${images.map(img => `- ${img.placeholder}: "${img.alt}"`).join('\n')}\n\nPlace image placeholders between paragraphs where they best illustrate the content.`
        : '';

    return `${systemPrompt}

## WRITER PERSONA:
${persona}

${toneInstructions ? `## SELECTED TONE:\n${toneInstructions}` : ""}

## SOURCE CONTENT TO REWRITE:
${sourceContent}
${imageInstructions}

Remember: Output MUST be valid JSON only. No markdown code blocks. No extra text.
Format: {"title": "...", "content": "<h2>...</h2><p>...</p>..."}`;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const {
            url,              // legacy: single URL
            urls,             // new: array of URLs
            pastedContent,
            mode = "rewrite",
            tone = "",        // new: tone selection
            snippets,         // new: snippet fallbacks from search results
        } = body;

        // Resolve URL list (support both legacy single URL and new multi-URL)
        const urlList: string[] = urls?.length
            ? urls.filter((u: string) => u?.trim())
            : url?.trim() ? [url.trim()] : [];

        if (urlList.length === 0 && !pastedContent) {
            return NextResponse.json({ error: "URL(s) or content is required" }, { status: 400 });
        }

        // 1. Get content
        let sourceContent: string;
        let allImages: ExtractedImage[] = [];
        let rawContent = "";
        let sourceUrls: string[] = [];

        if (pastedContent && typeof pastedContent === "string") {
            const extracted = extractImages(pastedContent);
            sourceContent = extracted.text.substring(0, 8000);
            allImages = extracted.images;
            rawContent = pastedContent;
        } else {
            const result = await scrapeMultipleSources(urlList, snippets);
            sourceContent = result.mergedContent;
            allImages = result.allImages;
            rawContent = result.rawContent;
            sourceUrls = urlList;
        }

        if (sourceContent.length < 100) {
            return NextResponse.json(
                { error: "Not enough content to work with (min 100 chars)" },
                { status: 400 }
            );
        }

        // 2. Load prompt components in parallel
        const [systemPrompt, persona, toneInstructions] = await Promise.all([
            getSystemPrompt(),
            getWriterPersona(),
            getToneInstructions(tone),
        ]);

        // 3. Build full prompt
        const prompt = buildPrompt({
            mode,
            systemPrompt,
            persona,
            toneInstructions,
            sourceContent,
            images: allImages,
        });

        // 4. Call Gemini with JSON mode
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // 5. Parse JSON response (with robust fallbacks)
        let parsed: { title: string; content: string; metaDescription?: string };
        try {
            parsed = JSON.parse(responseText);
        } catch {
            // Fallback 1: clean markdown code blocks
            const cleaned = responseText
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            try {
                parsed = JSON.parse(cleaned);
            } catch {
                // Fallback 2: extract title and content separately
                const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
                const contentMatch = cleaned.match(/"content"\s*:\s*"([\s\S]+)"/);
                if (titleMatch && contentMatch) {
                    parsed = {
                        title: titleMatch[1],
                        content: contentMatch[1]
                            .replace(/\\n/g, "\n")
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, "\\"),
                    };
                } else {
                    // Fallback 3: treat entire response as content
                    parsed = {
                        title: "Untitled Lesson",
                        content: responseText.substring(0, 10000),
                    };
                }
            }
        }

        // 6. Replace image placeholders with actual <img> tags
        let finalContent = parsed.content || "";
        const usedImages = new Set<number>();

        for (const img of allImages) {
            if (finalContent.includes(img.placeholder)) {
                finalContent = finalContent.replace(
                    img.placeholder,
                    `<img src="${img.url}" alt="${img.alt}" style="max-width:100%;border-radius:8px;margin:16px 0" />`
                );
                usedImages.add(allImages.indexOf(img));
            }
        }

        // Append unused images before Quick Recap
        const unusedImgs = allImages
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
            metaDescription: parsed.metaDescription || "",
            content: finalContent,
            rawContent,
            sourceUrls,
            tone: tone || null,
            mode,
            imageCount: allImages.length,
            sourcesUsed: urlList.length,
        });
    } catch (error: any) {
        console.error("[AI Rewrite Error]", error);
        return NextResponse.json(
            { error: error.message || "Failed to rewrite content" },
            { status: 500 }
        );
    }
}
