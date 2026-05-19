import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange, ContentRoiReport, ContentRoiRow } from "./types";

const TABLE_LIMIT = 10;

export async function getContentRoiReport(range: DateRange): Promise<ContentRoiReport> {
  const { since } = range;

  const articlePageViews = await prisma.pageView.groupBy({
    by: ["pathname"],
    where: { createdAt: { gte: since }, pathname: { startsWith: "/knowledge/" } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 50,
  });

  const slugs = articlePageViews
    .map((pv: { pathname: string }) => pv.pathname.replace("/knowledge/", "").replace(/\/$/, ""))
    .filter(Boolean);

  const articles = await prisma.article.findMany({
    where: { slug: { in: slugs }, status: "PUBLISHED" },
    select: { id: true, title: true, slug: true, thumbnail: true, metaTitle: true, metaDescription: true },
  });
  const articleMap = new Map(articles.map((a) => [a.slug, a]));

  const articleSessions = await prisma.pageView.findMany({
    where: { createdAt: { gte: since }, pathname: { startsWith: "/knowledge/" } },
    select: { sessionId: true, pathname: true },
    take: 10000,
  });

  const sessionToArticle = new Map<string, string>();
  for (const pv of articleSessions) {
    const slug = pv.pathname.replace("/knowledge/", "").replace(/\/$/, "");
    if (slug) sessionToArticle.set(pv.sessionId, slug);
  }

  const sessionIds = [...new Set(articleSessions.map((s: { sessionId: string }) => s.sessionId))];
  const conversionEvents = sessionIds.length > 0
    ? await prisma.analyticsEvent.findMany({
        where: {
          sessionId: { in: sessionIds.slice(0, 5000) },
          name: { in: ["signup_complete", "account_connect_completed", "partner_pro_requested", "pro_request_submitted", "broker_ref_click"] },
        },
        select: { sessionId: true, name: true },
      })
    : [];

  const attributions = new Map<string, { signups: number; accounts: number; pro: number }>();
  for (const event of conversionEvents) {
    const slug = sessionToArticle.get(event.sessionId);
    if (!slug) continue;
    if (!attributions.has(slug)) attributions.set(slug, { signups: 0, accounts: 0, pro: 0 });
    const attr = attributions.get(slug)!;
    if (event.name === "signup_complete") attr.signups++;
    if (event.name === "account_connect_completed") attr.accounts++;
    if (event.name === "partner_pro_requested" || event.name === "pro_request_submitted") attr.pro++;
  }

  const totalArticleViews = articlePageViews.reduce((s: number, pv: { _count: { id: number } }) => s + pv._count.id, 0);

  const topArticles: ContentRoiRow[] = articlePageViews
    .map((pv: { pathname: string; _count: { id: number } }) => {
      const slug = pv.pathname.replace("/knowledge/", "").replace(/\/$/, "");
      const article = articleMap.get(slug);
      if (!article) return null;
      const attr = attributions.get(slug) ?? { signups: 0, accounts: 0, pro: 0 };
      const views = pv._count.id;
      const roiScore = views + attr.signups * 10 + attr.accounts * 25 + attr.pro * 40;
      const issues: string[] = [];
      if (!article.metaTitle) issues.push("Missing meta title");
      if (!article.metaDescription) issues.push("Missing meta description");
      if (!article.thumbnail) issues.push("Missing featured image");
      return { articleId: article.id, title: article.title, slug: article.slug, views, signupAssists: attr.signups, accountAssists: attr.accounts, proAssists: attr.pro, roiScore, issues };
    })
    .filter((r: ContentRoiRow | null): r is ContentRoiRow => r !== null)
    .sort((a: ContentRoiRow, b: ContentRoiRow) => b.roiScore - a.roiScore)
    .slice(0, TABLE_LIMIT);

  return { topArticles, totalArticleViews, attributionPartial: conversionEvents.length === 0 };
}
