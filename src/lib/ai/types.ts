export type Difficulty = "easy" | "medium" | "hard";
export type TargetAudience = "beginner" | "intermediate" | "advanced";
export type LessonLength = "short" | "medium" | "long";

export interface StructureGenerationRequest {
    type: "level" | "module";
    topic: string;
    targetAudience: TargetAudience;
    numItems?: number; // Modules for Level, Lessons for Module
}

export interface StructureItem {
    title: string;
    description: string;
    order: number;
    slug?: string; // Generated slug
    duration?: number; // Estimated minutes (for lessons)
}

export interface StructureGenerationResponse {
    title: string;
    description: string;
    items: StructureItem[];
}

export interface LessonGenerationRequest {
    title: string;
    topic: string;
    level: TargetAudience;
    length: LessonLength;
    includeExamples: boolean;
}

export interface LessonGenerationResponse {
    title: string;
    content: string; // Markdown
    duration: number; // Minutes
    summary: string;
    keyTakeaways: string[];
}

export interface QuizGenerationRequest {
    lessonTitle?: string;
    topic: string;
    numQuestions: number;
    difficulty: Difficulty;
    lessonContent?: string; // Optional context
}

export interface QuizOption {
    text: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    text: string;
    options: QuizOption[];
    explanation: string;
}

export interface QuizGenerationResponse {
    questions: QuizQuestion[];
}
