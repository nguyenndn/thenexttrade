import type { AdminReportsData } from "@/lib/admin/reports/types";
import { NorthStarPanel } from "./NorthStarPanel";
import { ActionQueuePanel } from "./ActionQueuePanel";
import { AlertsPanel } from "./AlertsPanel";
import { UserLifecyclePanel } from "./UserLifecyclePanel";
import { UserQualityPanel } from "./UserQualityPanel";
import { RevenueOpportunityPanel } from "./RevenueOpportunityPanel";
import { FeatureAdoptionPanel } from "./FeatureAdoptionPanel";
import { FrictionPanel } from "./FrictionPanel";
import { DataQualityPanel } from "./DataQualityPanel";
import { AdminActivationInboxPanel } from "./AdminActivationInboxPanel";
import { BusinessHealthPanel } from "./BusinessHealthPanel";

interface Props { data: AdminReportsData }

export function AdminReportsDashboard({ data }: Props) {
 return (
 <div className="space-y-6">
 <NorthStarPanel data={data.northStar} />

 {/* Admin Activation Inbox */}
 <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 group hover:shadow-md transition-shadow">
 <h3 className="text-lg font-black text-slate-800 dark:text-white">Admin Activation Inbox</h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-4">
 Interactive real-time audit cockpit to track and nudge stuck traders at each onboarding and sync stage.
 </p>
 <AdminActivationInboxPanel />
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 <ActionQueuePanel data={data.actionQueue} />
 <AlertsPanel data={data.alerts} />
 </div>

 <BusinessHealthPanel data={data.businessHealth} />

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 <UserLifecyclePanel data={data.userLifecycle} />
 <UserQualityPanel data={data.userQuality} />
 </div>

 <RevenueOpportunityPanel data={data.revenueOpportunity} />
 <FeatureAdoptionPanel data={data.featureAdoption} />

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
 <FrictionPanel data={data.friction} />
 <DataQualityPanel data={data.dataQuality} />
 </div>

 <p className="text-xs text-gray-400 text-right">Generated at {new Date(data.generatedAt).toLocaleString()}</p>
 </div>
 );
}
