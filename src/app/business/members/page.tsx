import { getApiUsersBusinessesContext } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import BusinessMembersContent from "./_components/BusinessMembersContent";

export default async function BusinessMembersPage() {
  const token = await getAuthToken();
  const options = withToken(token);

  const context = await getApiUsersBusinessesContext(options).then(
    (response) => response.data ?? null,
    () => null,
  );
  const business = context?.currentBusiness ?? null;
  const members = context?.currentBusinessMembers ?? [];

  return <BusinessMembersContent business={business} members={members} />;
}
