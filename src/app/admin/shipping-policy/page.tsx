import { getApiAdminShippingPolicy as getShippingPolicy } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import ShippingPolicyContent from "./_components/ShippingPolicyContent";

export default async function ShippingPolicyPage() {
  const token = await getAuthToken();
  const res = await getShippingPolicy(withToken(token));

  return <ShippingPolicyContent policy={res.data} />;
}
