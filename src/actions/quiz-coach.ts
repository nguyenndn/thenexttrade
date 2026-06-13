"use server";

import { getAuthUser } from "@/lib/auth-cache";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function getQuizAIExplanation(
 questionText: string,
 selectedOptionText: string,
 correctOptionText: string
) {
 const user = await getAuthUser();
 if (!user) return { error: "Unauthorized" };

 if (!DEEPSEEK_API_KEY) {
 return { error: "DEEPSEEK_API_KEY is not configured" };
 }

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
 const res = await fetch("https://api.deepseek.com/chat/completions", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
 },
 body: JSON.stringify({
 model: "deepseek-v4-flash",
 messages: [
 { role: "system", content: "You are a professional trading mentor. Respond with a concise, sharp explanation in English." },
 { role: "user", content: systemPrompt }
 ],
 temperature: 0.5,
 max_tokens: 300
 }),
 signal: AbortSignal.timeout(15000), // 15 seconds timeout
 });

 if (!res.ok) {
 const errBody = await res.text();
 console.error("DeepSeek Quiz Coach Error:", errBody);
 throw new Error(`DeepSeek API failed (${res.status})`);
 }

 const aiData = await res.json();
 const explanation = aiData.choices[0]?.message?.content?.trim();
 if (!explanation) {
 throw new Error("No explanation returned from DeepSeek");
 }

 return { explanation };
 } catch (error) {
 console.error("Failed to generate AI explanation:", error);
 return {
 explanation: "This choice involves psychological traps like loss aversion or rush trading. In professional trading, capital preservation and strict discipline are always the ultimate keys to survival rather than acting on short-term emotions."
 };
 }
}

export async function checkQuestionAnswer(questionId: string, optionId: string) {
 const user = await getAuthUser();
 if (!user) return { error: "Unauthorized" };

 try {
 const { prisma } = await import("@/lib/prisma");

 const [question, correctOption, selectedOption] = await Promise.all([
 prisma.question.findUnique({
 where: { id: questionId },
 select: { text: true }
 }),
 prisma.option.findFirst({
 where: { questionId, isCorrect: true },
 select: { id: true, text: true }
 }),
 prisma.option.findUnique({
 where: { id: optionId },
 select: { text: true }
 })
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
 explanation = aiRes && "explanation" in aiRes ? aiRes.explanation : "";
 }

 return {
 isCorrect,
 correctOptionId: correctOption.id,
 correctOptionText: correctOption.text,
 selectedOptionText: selectedOption.text,
 explanation
 };
 } catch (error) {
 console.error("checkQuestionAnswer error:", error);
 return { error: "Failed to verify answer" };
 }
}

