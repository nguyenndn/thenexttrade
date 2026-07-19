import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

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
                ],
            },
            {
                userAgent: "GPTBot",
                allow: "/",
                disallow: ["/admin/", "/dashboard/", "/api/"],
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
                disallow: ["/admin/", "/dashboard/", "/api/"],
            },
            {
                userAgent: "ClaudeBot",
                allow: "/",
                disallow: ["/admin/", "/dashboard/", "/api/"],
            },
            {
                userAgent: "anthropic-ai",
                allow: "/",
                disallow: ["/admin/", "/dashboard/", "/api/"],
            },
            {
                userAgent: "xai-crawler",
                allow: "/",
                disallow: ["/admin/", "/dashboard/", "/api/"],
            },
            {
                userAgent: "Meta-ExternalAgent",
                allow: "/",
                disallow: ["/admin/", "/dashboard/", "/api/"],
            },
            {
                userAgent: "Cohere-ai",
                allow: "/",
                disallow: ["/admin/", "/dashboard/", "/api/"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
