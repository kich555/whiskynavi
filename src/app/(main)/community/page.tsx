import { getApiBoardsBoardidAnnouncements, getApiBoardsBoardidPosts } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import { getServerSession } from "next-auth";
import BoardContent from "./_components/BoardContent";
import { COMMUNITY_BOARD_ID, PINNED_ANNOUNCEMENT_COUNT, POSTS_PER_PAGE } from "./_lib/constants";

interface CommunityPageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const tab = params.tab ?? "general";
  const page = parseApiPage(params.page);

  // async-parallel: session + token 독립적이므로 병렬 fetch
  const [session, token] = await Promise.all([getServerSession(authOptions), getAuthToken()]);
  console.log("===>", token);
  // 현재 사용자 ID (비로그인 시 undefined)
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  if (tab === "announcement") {
    const announcementsRes = await getApiBoardsBoardidAnnouncements(
      COMMUNITY_BOARD_ID,
      { page, size: POSTS_PER_PAGE },
      withToken(token ?? undefined),
    );

    return (
      <BoardContent
        tab={tab}
        currentPage={Number(params.page) || 1}
        currentUserId={currentUserId}
        initialPosts={[]}
        initialAnnouncements={announcementsRes.data.content ?? []}
        totalElements={announcementsRes.data.page?.totalElements ?? 0}
        totalPages={announcementsRes.data.page?.totalPages ?? 0}
      />
    );
  }

  // general 또는 popular 탭 → 게시글 + 공지 3개 병렬 fetch
  // 인기 탭은 createdAt 내림차순 사용 (API가 viewCount를 지원하지 않음)
  const sort: string[] = ["createdAt,desc"];

  const [postsRes, pinnedRes] = await Promise.all([
    getApiBoardsBoardidPosts(COMMUNITY_BOARD_ID, { page, size: POSTS_PER_PAGE, sort }, withToken(token ?? undefined)),
    getApiBoardsBoardidAnnouncements(
      COMMUNITY_BOARD_ID,
      { page: 0, size: PINNED_ANNOUNCEMENT_COUNT },
      withToken(token ?? undefined),
    ),
  ]);

  return (
    <BoardContent
      tab={tab}
      currentPage={Number(params.page) || 1}
      currentUserId={currentUserId}
      initialPosts={postsRes.data.content ?? []}
      initialAnnouncements={pinnedRes.data.content ?? []}
      totalElements={postsRes.data.page?.totalElements ?? 0}
      totalPages={postsRes.data.page?.totalPages ?? 0}
    />
  );
}
