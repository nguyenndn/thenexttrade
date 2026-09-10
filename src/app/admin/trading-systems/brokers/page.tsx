import { getEABrokers, getBrokerCommissionRates } from "./actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EABrokersTabsClient } from "./EABrokersTabsClient";
import type { CommissionRateItem } from "./CommissionRatesTab";

export const dynamic = "force-dynamic";

export default async function EABrokersPage() {
    const [brokersRes, ratesRes] = await Promise.all([
        getEABrokers(),
        getBrokerCommissionRates(),
    ]);

    const brokers = brokersRes.data || [];
    const commissionRates = (ratesRes.data || []) as unknown as CommissionRateItem[];

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Partner Brokers & Rates"
                description="Manage supported partner brokers, server configurations, and symbol commission rate tables."
                backHref="/admin/trading-systems"
            />

            <EABrokersTabsClient
                brokers={brokers}
                commissionRates={commissionRates}
            />
        </div>
    );
}
