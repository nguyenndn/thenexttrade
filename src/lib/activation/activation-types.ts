export type ActivationStepId =
  | "CONNECT_ACCOUNT"
  | "LOG_FIRST_TRADE"
  | "GENERATE_WEEKLY_REVIEW"
  | "START_ACADEMY"
  | "CHECK_IN";

export type ActivationStep = {
  id: ActivationStepId;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  completed: boolean;
  priority: number;
};

export type ActivationState = {
  completedCount: number;
  totalCount: number;
  nextStep: ActivationStep | null;
  steps: ActivationStep[];
};
