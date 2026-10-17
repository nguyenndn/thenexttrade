import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import StreakClient from "./StreakClient";

export const dynamic = "force-dynamic";

export default async function StreakPage() {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login");
    }

    return <StreakClient />;
}
