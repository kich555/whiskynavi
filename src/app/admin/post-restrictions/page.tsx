import type { AdminUserResponse } from "@/apis/generated/api";
import { getApiAdminUsers } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import PostRestrictionsContent from "./_components/PostRestrictionsContent";

interface PostRestrictionsPageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function PostRestrictionsPage({ searchParams }: PostRestrictionsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const itemsPerPage = params.limit ? Number(params.limit) : 20;
  const response = await getApiAdminUsers(
    {
      page: parseApiPage(params.page),
      size: itemsPerPage,
      isPostCreationRestricted: true,
      sort: ["updatedAt,desc"],
    },
    withToken(token),
  );

  return (
    <PostRestrictionsContent
      restrictions={(response.data.content ?? []) as AdminUserResponse[]}
      now={new Date().toISOString()}
      totalElements={response.data.page?.totalElements ?? 0}
      currentPage={(response.data.page?.number ?? 0) + 1}
      itemsPerPage={response.data.page?.size ?? itemsPerPage}
      searchParams={params}
    />
  );
}
