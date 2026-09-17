export const HISTORY_PATH = "/admin/board-management-history";

export interface HistoryFilters {
  mode: "deleted" | "posts";
  page: string;
  limit: string;
  authorId?: string;
  deletedBy?: string;
  authorNickname?: string;
  deletedByNickname?: string;
  keyword?: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

function positiveInteger(value: string | undefined): string | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? String(parsed) : undefined;
}

export function normalizeHistoryFilters(params: SearchParams): HistoryFilters {
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const search = (key: string) => value(key)?.trim().slice(0, 100) || undefined;
  const mode = value("mode") === "posts" ? "posts" : "deleted";
  const rawPage = positiveInteger(value("page"));
  const page = rawPage && Number(rawPage) <= 2147483647 ? rawPage : "1";
  return {
    mode,
    page,
    limit: ["10", "20", "50", "100"].includes(value("limit") ?? "") ? value("limit")! : "20",
    authorId: positiveInteger(value("authorId")),
    deletedBy: mode === "deleted" ? positiveInteger(value("deletedBy")) : undefined,
    authorNickname: search("authorNickname"),
    deletedByNickname: mode === "deleted" ? search("deletedByNickname") : undefined,
    keyword: search("keyword"),
  };
}

export function historyQuery(filters: HistoryFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, value);
  });
  return params.toString();
}

export function historyHref(filters: Partial<HistoryFilters> = {}): string {
  return `${HISTORY_PATH}?${historyQuery(normalizeHistoryFilters(filters))}`;
}

export function historyDetailHref(postId: number, filters: HistoryFilters): string {
  return `${HISTORY_PATH}/${postId}?returnTo=${encodeURIComponent(historyQuery(filters))}`;
}

export function historyReturnFilters(query?: string): HistoryFilters {
  return normalizeHistoryFilters(Object.fromEntries(new URLSearchParams(query ?? "")));
}

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

export function formatHistoryDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}+09:00`);
  return Number.isNaN(date.getTime()) ? "-" : dateTimeFormatter.format(date);
}

export function historyStatus(post: { deleted: boolean; deletedByRole?: string | null }): string {
  if (!post.deleted) return "게시 중";
  if (post.deletedByRole === "ADMIN") return "관리자 삭제";
  if (post.deletedByRole === "USER") return "작성자 삭제";
  return "삭제 (주체 미상)";
}

export function historyNickname(nickname?: string | null): string {
  return nickname?.trim() || "닉네임 확인 불가";
}
