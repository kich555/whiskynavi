import { getApiUsersBusinessesBusinessidMembers, getApiUsersBusinessesMe } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import BusinessMembersContent from "./_components/BusinessMembersContent";

export default async function BusinessMembersPage() {
  const token = await getAuthToken();
  const options = withToken(token);

  const businessesRes = await getApiUsersBusinessesMe(options);
  const businesses = businessesRes.data ?? [];
  const business = businesses.find((item) => item.primaryBusiness) ?? businesses[0] ?? null;

  const members =
    business?.businessId != null && business.role === "OWNER"
      ? await getApiUsersBusinessesBusinessidMembers(business.businessId, options).then(
          (response) => response.data ?? [],
          () => [],
        )
      : [];

  return <BusinessMembersContent business={business} members={members} />;
}
