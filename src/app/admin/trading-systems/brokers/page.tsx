import { redirect } from "next/navigation";

export default function EABrokersRedirectPage() {
    redirect("/admin/trading-systems?tab=brokers");
}
