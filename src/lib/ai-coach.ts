export const AI_COACH_PROMPT_VERSION = "2.0";

export type CoachConfidence = "high" | "medium" | "low";

export interface CoachEvidence {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface DeepSeekInsight {
  summary: string;
  primaryIssue: CoachEvidence | null;
  evidence: CoachEvidence[];
  actionPlan: string;
  successCheck: string;
  positiveEdge: CoachEvidence | null;
  confidence: CoachConfidence;
  generatedAt: string;
}
