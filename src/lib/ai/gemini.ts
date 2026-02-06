import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
// Reverting to Gemini 1.5 Flash (Most Stable/Available Model)
const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

export async function generateContent(prompt: string): Promise<string> {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw new Error(`Failed to generate content: ${error.message}`);
    }
}
