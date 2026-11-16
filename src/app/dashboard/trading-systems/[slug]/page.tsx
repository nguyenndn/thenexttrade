import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getCanonicalSystemPageSlug } from "@/config/trading-systems-data";
import {
    findActiveDashboardEaProduct,
    getUserHasApprovedEaLicense,
} from "@/lib/ea/user-license-access.server";
import { DashboardSystemDetailView } from "@/components/dashboard/trading-systems/detail/DashboardSystemDetailView";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await findActiveDashboardEaProduct(slug);

    if (!product) {
        return {
            title: "System Not Found | TheNextTrade",
        };
    }

    return {
        title: `${product.name} | Trading Systems | TheNextTrade`,
        description: `Specifications, parameters, installation guide, and download access for ${product.name}.`,
    };
}

export default async function DashboardTradingSystemDetailPage({
    params,
    searchParams,
}: PageProps) {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login");
    }

    const [{ slug }, { tab }] = await Promise.all([params, searchParams]);
    const product = await findActiveDashboardEaProduct(slug);

    if (!product) {
        notFound();
    }

    const canonicalSlug = getCanonicalSystemPageSlug(product.slug);
    if (slug !== canonicalSlug) {
        const suffix = tab ? `?tab=${encodeURIComponent(tab)}` : "";
        redirect(`/dashboard/trading-systems/${canonicalSlug}${suffix}`);
    }

    const hasApprovedLicense = await getUserHasApprovedEaLicense(user.id);

    return (
        <DashboardSystemDetailView
            product={product}
            isLocked={!hasApprovedLicense}
            initialTab={tab}
        />
    );
}
