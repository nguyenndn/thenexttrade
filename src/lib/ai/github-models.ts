import { OpenAI } from "openai";

const token = process.env.GITHUB_TOKEN;

if (!token) {
    console.warn("Missing GITHUB_TOKEN environment variable");
}

const client = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: token || "dummy-token", // OpenAI SDK throws if key is empty
});

export async function generateContent(prompt: string, model = "gpt-4o-mini"): Promise<string | null> {
    if (!token) {
        console.warn("GITHUB_TOKEN not configured, skipping GitHub Models");
        return null;
    }

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
        });

        return response.choices[0].message.content;
    } catch (error: any) {
        console.error("GitHub Models API Error:", error);
        throw error;
    }
}
