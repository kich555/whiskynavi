import { getApiAdminBoards } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import BoardsContent from "./_components/BoardsContent";

interface BoardsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function BoardsPage({ searchParams }: BoardsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();

  const page = parseApiPage(params.page);
  const size = params.limit ? Number(params.limit) : 20;
  const res = await getApiAdminBoards({ page, size }, withToken(token));
  return (
    <BoardsContent
      searchParams={params}
      boards={res.data.content ?? []}
      totalElements={res.data.page?.totalElements ?? 0}
    />
  );
}
