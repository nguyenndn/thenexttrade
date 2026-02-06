import {
    LessonGenerationRequest,
    QuizGenerationRequest,
    StructureGenerationRequest
} from "./types";

export const generateStructurePrompt = (params: StructureGenerationRequest) => `
You are a Forex education curriculum planner.
Task: Create a structured outline for a ${params.type === 'level' ? 'Level (containing modules)' : 'Module (containing lessons)'}.

Topic: ${params.topic}
Target Audience: ${params.targetAudience}
Number of items: ${params.numItems || (params.type === 'level' ? 4 : 8)}

Requirements:
- Titles should be engaging and clear.
- Descriptions should be concise (1-2 sentences).
- Order should be logical (beginner to advanced).
- For Lessons, include estimated duration (minutes).

Output JSON format ONLY:
{
  "title": "Main Title",
  "description": "Brief description of the level/module",
  "items": [
    {
      "title": "Item Title",
      "description": "Item description",
      "order": 1,
      "duration": 10 // Only for lessons, omit for modules
    }
  ]
}
`;

export const generateLessonPrompt = (params: LessonGenerationRequest) => `
You are a Forex educator writing for ${params.level} traders. Write like a REAL PERSON, not an AI.

Task: Write a comprehensive lesson about "${params.title}".

CRITICAL WRITING STYLE RULES:
- Use SIMPLE, everyday language.
- NO corporate jargon.
- Use contractions (you'll, it's).
- Short sentences.
- Use "you" and "we".
- Avoid generic AI transitions ("Let's delve in", "In conclusion").

Requirements:
- Target audience: ${params.level}
- Length: ${params.length === 'short' ? '500' : params.length === 'medium' ? '1000' : '2000'} words
- Tone: Friendly, mentor-like
- Format: Markdown (##, ###)
- Include: Real examples, analogies.

Structure:
1. Hook
2. Core Concepts
3. Examples
4. Key Takeaways (bullet points)
5. Next Steps

Topic Context: ${params.topic}

Output only the markdown content, no preamble.
`;

export const generateQuizPrompt = (params: QuizGenerationRequest) => `
You are creating a quiz for a Forex education lesson.
Topic: ${params.topic}
Difficulty: ${params.difficulty}
Num Questions: ${params.numQuestions}
${params.lessonTitle ? `Lesson Title: "${params.lessonTitle}"` : ''}
${params.lessonContent ? `Based on this content:\n${params.lessonContent.substring(0, 1000)}...` : ''}

Requirements:
- 4 options per question.
- 1 correct answer.
- Short, simple explanation.
- Practical scenarios.

Output JSON format ONLY:
{
  "questions": [
    {
      "text": "Question?",
      "options": [
        { "text": "A", "isCorrect": false },
        { "text": "B", "isCorrect": true },
        { "text": "C", "isCorrect": false },
        { "text": "D", "isCorrect": false }
      ],
      "explanation": "Why B is correct."
    }
  ]
}
`;
