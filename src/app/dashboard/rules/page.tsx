import { redirect } from "next/navigation";

export default async function RulesRedirectPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const params = new URLSearchParams();
    const targetTab =
        resolvedParams.tab === "compliance" ? "compliance" : "global-rules";
    params.set("tab", targetTab);

    if (
        typeof resolvedParams.accountId === "string" &&
        resolvedParams.accountId
    ) {
        params.set("accountId", resolvedParams.accountId);
    }

    redirect(`/dashboard/strategies?${params.toString()}`);
}
