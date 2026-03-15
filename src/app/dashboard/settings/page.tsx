import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    return <SettingsClient />;
}
