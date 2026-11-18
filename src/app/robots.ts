import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getBaseUrl();

    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/api/og/"],
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/onboarding/",
                    "/auth/",
                    "/maintenance",
                    "/forbidden",
                    "/offline",
                    "/share/",
                ],
            },
            {
                userAgent: "GPTBot",
                allow: ["/", "/api/og/"],
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/maintenance",
                    "/share/",
                ],
            },
            {
                userAgent: "OAI-SearchBot",
                allow: ["/", "/api/og/"],
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
                userAgent: "Bingbot",
                allow: ["/", "/api/og/"],
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/onboarding/",
                    "/auth/",
                    "/maintenance",
                    "/forbidden",
                    "/offline",
                    "/share/",
                ],
            },
            {
                userAgent: "Google-Extended",
                allow: "/",
            },
            {
                userAgent: "Applebot-Extended",
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
