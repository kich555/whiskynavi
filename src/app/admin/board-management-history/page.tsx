import { getApiV2AdminBoardsPostHistory } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import HistoryContent from "./_components/HistoryContent";
import HistoryFrame from "./_components/HistoryFrame";
import { historyHref, normalizeHistoryFilters } from "./_lib/history";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BoardManagementHistoryPage({ searchParams }: Props) {
  const filters = normalizeHistoryFilters(await searchParams);
  const token = await getAuthToken();
  const response = await getApiV2AdminBoardsPostHistory(
    {
      view: filters.mode === "posts" ? "ALL" : "ADMIN_DELETED",
      page: Number(filters.page) - 1,
      size: Number(filters.limit),
      authorId: filters.authorId ? Number(filters.authorId) : undefined,
      deletedBy: filters.deletedBy ? Number(filters.deletedBy) : undefined,
      authorNickname: filters.authorNickname,
      deletedByNickname: filters.deletedByNickname,
      keyword: filters.keyword,
    },
    withToken(token),
  );
  const total = response.data.page?.totalElements ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / Number(filters.limit)));
  if (Number(filters.page) > lastPage) redirect(historyHref({ ...filters, page: String(lastPage) }));
  return (
    <HistoryFrame>
      <HistoryContent filters={filters} records={response.data.content ?? []} total={total} />
    </HistoryFrame>
  );
}
