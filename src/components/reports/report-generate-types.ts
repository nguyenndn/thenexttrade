// Shared result types for report generation
export type GenerateReportResult = {
  success?: boolean;
  error?: string;
  code?: string;
  reportId?: string;
  alreadyExists?: boolean;
  message?: string;
  ctaHref?: string;
  ctaLabel?: string;
  missionEventRecorded?: boolean;
  missionReward?: {
    claimable: boolean;
    missionIds: string[];
    totalEdge: number;
    ctaHref: string;
    ctaLabel: string;
  } | null;
};
