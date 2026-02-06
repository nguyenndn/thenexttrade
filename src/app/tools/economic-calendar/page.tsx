import { getAuthUser } from "@/lib/auth-cache";
import { EconomicCalendarClient } from "./EconomicCalendarClient";

export default async function EconomicCalendarPage() {
    const user = await getAuthUser();

    return (
        <EconomicCalendarClient user={user} />
    );
}
