import { redirect } from "next/navigation";

export default function AllAccountsRedirectPage() {
    redirect("/admin/trading-systems?tab=licenses");
}
