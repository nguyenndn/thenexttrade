import { redirect } from "next/navigation";

type LegacySyncRequestsProps = {
    searchParams?:
        | Promise<Record<string, string | undefined>>
        | Record<string, string | undefined>;
};

export default async function LegacySyncRequestsRedirect({
    searchParams,
}: LegacySyncRequestsProps) {
    const params = (await Promise.resolve(searchParams)) || {};
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (typeof value === "string" && value.length > 0) {
            query.set(key, value);
        }
    }

    const qs = query.toString();
    redirect(qs ? `/admin/cloud-sync-logs?${qs}` : "/admin/cloud-sync-logs");
}
