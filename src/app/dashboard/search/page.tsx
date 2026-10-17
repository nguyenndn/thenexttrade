import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login");
    }

    return <SearchClient />;
}
