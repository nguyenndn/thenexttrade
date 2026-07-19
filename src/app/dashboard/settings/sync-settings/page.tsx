import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import TNTConnectClient from "./TNTConnectClient";

export const dynamic = "force-dynamic";

export default async function TNTConnectPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    return <TNTConnectClient />;
}
