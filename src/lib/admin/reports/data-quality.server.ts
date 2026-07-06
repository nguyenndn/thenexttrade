import "server-only";
import { prisma } from "@/lib/prisma";
import type { DataQualityReport, DataQualityIssue } from "./types";

export async function getDataQualityReport(): Promise<DataQualityReport> {
 const issues: DataQualityIssue[] = [];

 const [usersNoProfile, usersNoName, accountsNoBroker, accountsNoServer, proNoAccount, articlesMissingMeta, articlesMissingImage] = await Promise.all([
 prisma.user.count({ where: { profile: null } }),
 prisma.user.count({ where: { name: null } }),
 prisma.tradingAccount.count({ where: { broker: null } }),
 prisma.tradingAccount.count({ where: { server: null } }),
 prisma.proEntitlement.count({ where: { tradingAccountId: null, status: "ACTIVE" } }),
 prisma.article.count({ where: { status: "PUBLISHED", OR: [{ metaTitle: null }, { metaTitle: "" }, { metaDescription: null }, { metaDescription: "" }] } }),
 prisma.article.count({ where: { status: "PUBLISHED", OR: [{ thumbnail: null }, { thumbnail: "" }] } }),
 ]);

 if (usersNoProfile > 0) issues.push({ group: "User / Profile", issue: "User without profile", count: usersNoProfile, severity: usersNoProfile > 50 ? "high" : "medium", suggestedFix: "Run profile backfill", href: "/admin/users" });
 if (usersNoName > 0) issues.push({ group: "User / Profile", issue: "Missing user name", count: usersNoName, severity: "low", suggestedFix: "Profile completion nudge", href: "/admin/users" });
 if (accountsNoBroker > 0) issues.push({ group: "Trading", issue: "Account without broker", count: accountsNoBroker, severity: "medium", suggestedFix: "Review account creation flow", href: "/admin/ea/accounts" });
 if (accountsNoServer > 0) issues.push({ group: "Trading", issue: "Account without server", count: accountsNoServer, severity: "low", suggestedFix: "Check Trade Manager EA sync data", href: "/admin/ea/accounts" });
 if (proNoAccount > 0) issues.push({ group: "Pro / IB", issue: "Active Pro without linked account", count: proNoAccount, severity: "high", suggestedFix: "Review Pro entitlements", href: "/admin/ib" });
 if (articlesMissingMeta > 0) issues.push({ group: "Content", issue: "Article missing meta title/desc", count: articlesMissingMeta, severity: "medium", suggestedFix: "Use Article Ops bulk SEO fix", href: "/admin/articles/ops" });
 if (articlesMissingImage > 0) issues.push({ group: "Content", issue: "Article missing featured image", count: articlesMissingImage, severity: "medium", suggestedFix: "Generate images via Article Ops", href: "/admin/articles/ops" });

 let penalty = 0;
 for (const issue of issues) { if (issue.severity === "critical") penalty += 15; else if (issue.severity === "high") penalty += 8; else if (issue.severity === "medium") penalty += 4; else penalty += 1; }
 return { healthScore: Math.max(0, 100 - penalty), issues };
}
