import { getApiAdminBusinessesMembers } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import BusinessMembersContent from "./_components/BusinessMembersContent";

interface BusinessMembersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function BusinessMembersPage({
  searchParams,
}: BusinessMembersPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();

  const res = await getApiAdminBusinessesMembers(
    {
      page: params.page ? Number(params.page) - 1 : 0,
      size: params.limit ? Number(params.limit) : 20,
    },
    withToken(token),
  );

  return (
    <BusinessMembersContent
      searchParams={params}
      members={res.data.content ?? []}
      totalElements={res.data.totalElements ?? 0}
    />
  );
}
