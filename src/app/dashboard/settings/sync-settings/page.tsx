import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import SyncSettingsClient from "./SyncSettingsClient";

export const dynamic = "force-dynamic";

export default async function SyncSettingsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    return <SyncSettingsClient />;
}
