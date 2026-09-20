import { loadServiceEntitlements } from "./actions";
import type { EntitlementSearchParams } from "./filters";
import ServiceEntitlementsContent from "./ServiceEntitlementsContent";

export default async function ServiceEntitlementsPage({
  searchParams,
}: {
  searchParams: Promise<EntitlementSearchParams>;
}) {
  const params = await searchParams;
  const result = await loadServiceEntitlements(params);
  return <ServiceEntitlementsContent params={params} result={result} />;
}
