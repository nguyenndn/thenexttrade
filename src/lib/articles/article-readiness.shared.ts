// ============================================================================
// ARTICLE READINESS SCORING SERVICE (SHARED)
// Browser-safe types and constants.
// ============================================================================

export type ArticleReadinessIssue =
    | "MISSING_FEATURED_IMAGE"
    | "FEATURED_IMAGE_FILE_MISSING"
    | "NO_INLINE_IMAGES"
    | "INLINE_IMAGE_FILE_MISSING"
    | "MISSING_META_DESCRIPTION"
    | "META_DESCRIPTION_TOO_LONG"
    | "MISSING_FOCUS_KEYWORD"
    | "CONTENT_TOO_SHORT"
    | "MISSING_SCHEMA_TYPE";

export type ArticleReadiness = {
    articleId: string;
    score: number;
    issues: ArticleReadinessIssue[];
    inlineImageCount: number;
    missingInlineImages: string[];
    featuredImagePath: string | null;
    featuredImageExists: boolean;
};

export const ISSUE_LABELS: Record<ArticleReadinessIssue, string> = {
    MISSING_FEATURED_IMAGE: "Missing featured image",
    FEATURED_IMAGE_FILE_MISSING: "Featured image file not found",
    NO_INLINE_IMAGES: "No inline images in content",
    INLINE_IMAGE_FILE_MISSING: "Inline image file(s) missing",
    MISSING_META_DESCRIPTION: "Missing meta description",
    META_DESCRIPTION_TOO_LONG: "Meta description too long (>160 chars)",
    MISSING_FOCUS_KEYWORD: "Missing focus keyword",
    CONTENT_TOO_SHORT: "Content too short (<800 words)",
    MISSING_SCHEMA_TYPE: "Missing schema type",
};

export function getIssueLabel(issue: ArticleReadinessIssue): string {
    return ISSUE_LABELS[issue] ?? issue;
}

export type ArticleOpsFilter =
    | "all"
    | "needs_featured_image"
    | "needs_inline_images"
    | "needs_seo"
    | "published"
    | "draft";

export type ArticleOpsRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt: Date;
    readiness: ArticleReadiness;
};

export type ArticleOpsSummary = {
    total: number;
    ready: number;
    needsImages: number;
    needsSeo: number;
    missingFiles: number;
};

export type ArticleImagePrompts = {
    articleId: string;
    title: string;
    slug: string;
    featured: { prompt: string; suggestedPath: string };
    inline: { prompt: string; suggestedPath: string }[];
};
