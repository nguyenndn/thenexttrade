import * as GitHub from "./github-models";
import * as Gemini from "./gemini";

interface GenerationResult {
    content: string;
    provider: string;
    model: string;
}

export async function generateWithFallback(prompt: string): Promise<GenerationResult> {
    // 1. Try GitHub Models (Primary)
    // We try gpt-4o-mini first as it's the most cost-effective and fast option for typical tasks
    try {
        console.log("[AI] Attempting GitHub Models (gpt-4o-mini)...");
        const content = await GitHub.generateContent(prompt, "gpt-4o-mini");
        if (content) {
            console.log("[AI] Success with GitHub Models");
            return {
                content,
                provider: "GitHub Models",
                model: "gpt-4o-mini"
            };
        }
    } catch (error) {
        console.warn("[AI] GitHub Models failed, trying fallback...", error);
    }

    // 2. Try Gemini (Fallback)
    try {
        console.log("[AI] Attempting Gemini (Fallback)...");
        const content = await Gemini.generateContent(prompt);
        console.log("[AI] Success with Gemini");
        return {
            content,
            provider: "Google Gemini",
            model: "gemini-1.5-flash"
        };
    } catch (error: any) {
        console.error("[AI] All providers failed");
        throw new Error(`All AI providers failed. Last error: ${error.message}`);
    }
}
