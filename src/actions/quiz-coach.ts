"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { executeAiGateway } from "@/lib/ai-gateway/provider-router";
import { reserveAiRequest } from "@/lib/ai-gateway/quota-service";
import { randomUUID } from "node:crypto";

export async function getQuizAIExplanation(
    questionText: string,
    selectedOptionText: string,
    correctOptionText: string
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const systemPrompt = `You are a Senior Trading Psychology and Technical Coach at TheNextTrade.
The student has just answered INCORRECTLY to a multiple-choice question in their trading training module.
Your job is to explain why the student's selected option is incorrect and why the correct answer represents the mindset of the top 5% successful traders.

Question: "${questionText}"
Student's wrong option: "${selectedOptionText}"
Correct answer: "${correctOptionText}"

Write a response strictly adhering to the following rules:
1. Answer in English, using a professional, sharp, and "tough love" coaching tone (direct, realistic, pointing out psychological cognitive biases like FOMO, loss aversion, over-leveraging, or technical mistakes).
2. Keep it extremely concise, between 2 to maximum 3 sentences (do not write long paragraphs or use fluff).
3. Do NOT use double quotes (") anywhere in the text to prevent JSON string formatting errors. Use single quotes (') instead if needed for emphasis.

    Respond with your explanation directly. Do not include any title, introductory phrases, or markdown formatting.`;

    try {
        const requestId = `quiz_${randomUUID()}`;
        const reservation = await reserveAiRequest({
            requestId,
            userId: user.id,
            symbol: "MULTI",
            timeframe: "ACADEMY",
            analysisMode: "QUIZ_EXPLANATION",
            promptVersion: "quiz-explanation-v1",
            taskKey: "QUIZ_EXPLANATION",
        });

        if (reservation.status === "QUOTA_EXCEEDED") {
            return {
                error: "Daily AI Quiz Coach quota reached for your plan. Please try again tomorrow.",
            };
        }
        if (reservation.status !== "RESERVED") {
            return { error: "This AI Quiz Coach request could not be started." };
        }

        const gatewayResult = await executeAiGateway({
            requestId,
            userId: user.id,
            snapshot: { questionText, selectedOptionText, correctOptionText },
            systemPrompt,
            taskKey: "QUIZ_EXPLANATION",
            skipTradingSchemaValidation: true,
        });

        if (!gatewayResult.ok || !gatewayResult.rawResult) {
            throw new Error(gatewayResult.message || "AI Gateway execution failed.");
        }

        const rawContent = gatewayResult.rawResult;
        let explanation = typeof rawContent === "string" ? rawContent.trim() : JSON.stringify(rawContent);

        return { explanation };
    } catch (error) {
        console.error("Failed to generate AI explanation:", error);
        return {
            explanation:
                "This choice involves psychological traps like loss aversion or rush trading. In professional trading, capital preservation and strict discipline are always the ultimate keys to survival rather than acting on short-term emotions.",
        };
    }
}

export async function checkQuestionAnswer(
    questionId: string,
    optionId: string
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const { prisma } = await import("@/lib/prisma");

        const [question, correctOption, selectedOption] = await Promise.all([
            prisma.question.findUnique({
                where: { id: questionId },
                select: { text: true },
            }),
            prisma.option.findFirst({
                where: { questionId, isCorrect: true },
                select: { id: true, text: true },
            }),
            prisma.option.findUnique({
                where: { id: optionId },
                select: { text: true },
            }),
        ]);

        if (!question || !correctOption || !selectedOption) {
            return { error: "Question or Option not found" };
        }

        const isCorrect = correctOption.id === optionId;

        let explanation = "";
        if (!isCorrect) {
            const aiRes = await getQuizAIExplanation(
                question.text,
                selectedOption.text,
                correctOption.text
            );
            explanation =
                aiRes && "explanation" in aiRes && aiRes.explanation
                    ? aiRes.explanation
                    : "";
        }

        return {
            isCorrect,
            correctOptionId: correctOption.id,
            correctOptionText: correctOption.text,
            selectedOptionText: selectedOption.text,
            explanation,
        };
    } catch (error) {
        console.error("checkQuestionAnswer error:", error);
        return { error: "Failed to verify answer" };
    }
}
