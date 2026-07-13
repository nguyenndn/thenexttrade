import { getEnrollmentTokens } from "@/actions/admin/mt5";
import { TokensClient } from "./TokensClient";

export const dynamic = "force-dynamic";

export default async function Mt5TokensPage() {
  const tokens = await getEnrollmentTokens();
  return <TokensClient initialTokens={tokens} />;
}
