import { MetadataRoute } from "next";
import { getBaseUrl, absoluteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getBaseUrl();

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/onboarding/",
                    "/auth/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "GPTBot",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "ChatGPT-User",
                allow: "/",
            },
            {
                userAgent: "Google-Extended",
                allow: "/",
            },
            {
                userAgent: "PerplexityBot",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "ClaudeBot",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "anthropic-ai",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "xai-crawler",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "Meta-ExternalAgent",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "Cohere-ai",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
