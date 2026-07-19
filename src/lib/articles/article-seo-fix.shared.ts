import type { ArticleReadinessIssue } from "./article-readiness.shared";

export type ArticleSeoFixSuggestion = {
    articleId: string;
    title: string;
    slug: string;
    issues: ArticleReadinessIssue[];
    current: {
        metaTitle: string | null;
        metaDescription: string | null;
        focusKeyword: string | null;
        schemaType: string | null;
        excerpt: string | null;
    };
    suggested: {
        metaTitle: string;
        metaDescription: string;
        focusKeyword: string;
        schemaType: "ARTICLE" | "HOWTO" | "FAQ" | "COURSE" | "TOOL" | "REVIEW";
        excerpt: string;
    };
    notes: string[];
};

export type ArticleSeoFixPayload = {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    schemaType: "ARTICLE" | "HOWTO" | "FAQ" | "COURSE" | "TOOL" | "REVIEW";
    excerpt: string;
};
