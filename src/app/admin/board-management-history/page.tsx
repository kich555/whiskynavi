import { getApiAdminBoardsPostDeletionAudits } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import BoardManagementHistoryContent from "./_components/BoardManagementHistoryContent";

interface BoardManagementHistoryPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function BoardManagementHistoryPage({ searchParams }: BoardManagementHistoryPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const page = parseApiPage(params.page);
  const size = params.limit ? Number(params.limit) : 20;
  const response = await getApiAdminBoardsPostDeletionAudits({ page, size }, withToken(token));

  return (
    <BoardManagementHistoryContent
      searchParams={params}
      records={response.data.content ?? []}
      totalElements={response.data.page?.totalElements ?? 0}
    />
  );
}
