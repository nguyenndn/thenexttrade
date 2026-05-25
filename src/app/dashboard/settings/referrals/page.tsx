import { ReferralsClient } from "./ReferralsClient";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getReferralDashboardData } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const referralCode = user.profile?.username || user.id;
    const referralData = await getReferralDashboardData(user.id);

    return <ReferralsClient referralCode={referralCode} data={referralData} />;
}
