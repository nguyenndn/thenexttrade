import { redirect } from "next/navigation";

export default function PendingAccountsRedirectPage() {
    redirect("/admin/trading-systems?tab=licenses&status=PENDING");
}
