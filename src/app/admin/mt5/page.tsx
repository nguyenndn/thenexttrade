import { getMt5Workers } from "@/actions/admin/mt5";
import { WorkersClient } from "./WorkersClient";

export const dynamic = "force-dynamic";

export default async function Mt5WorkersPage() {
  const workers = await getMt5Workers();
  return <WorkersClient initialWorkers={workers} />;
}
