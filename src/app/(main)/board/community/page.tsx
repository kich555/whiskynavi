import { getApiBoardsBoardidAnnouncements, getApiBoardsBoardidPosts } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import { getServerSession } from "next-auth";
import BoardContent from "../_components/BoardContent";
import { getBoard } from "../_lib/board";
import {
  ALL_ANNOUNCEMENT_PAGE_SIZE,
  COMMUNITY_BOARD_ID,
  PINNED_ANNOUNCEMENT_COUNT,
  POSTS_PER_PAGE,
} from "../_lib/constants";
import { resolveTabTarget } from "../_lib/resolveTabTarget";
import { buildTabs } from "../_lib/tabs";

interface CommunityPageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();

  // async-parallel: session + 게시판(postType 목록) 독립적이므로 병렬 fetch
  const [session, board] = await Promise.all([
    getServerSession(authOptions),
    getBoard(COMMUNITY_BOARD_ID, token ?? undefined),
  ]);
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;
  const postTypes = board?.postTypes ?? [];
  const tabs = buildTabs(postTypes);
  // 기본 탭은 첫 postType 코드 (없으면 빈 문자열 → 빈 목록 fallback)
  const defaultTab = tabs[0]?.key ?? "";
  const tab = params.tab ?? defaultTab;
  const page = parseApiPage(params.page);
  const target = resolveTabTarget(tab, postTypes);

  if (target.resource === "announcements") {
    const announcementsRes = await getApiBoardsBoardidAnnouncements(
      COMMUNITY_BOARD_ID,
      { page, size: POSTS_PER_PAGE, postTypeCode: target.postTypeCode },
      withToken(token ?? undefined),
    );

    return (
      <BoardContent
        boardId={COMMUNITY_BOARD_ID}
        tab={tab}
        tabs={tabs}
        resource="announcements"
        postTypeCode={target.postTypeCode}
        currentPage={Number(params.page) || 1}
        currentUserId={currentUserId}
        // 공지 postType 탭에서는 게시글 영역에 공지를 표시 (페이지네이션 적용, 고정 공지 배너 없음)
        initialPosts={[]}
        initialAnnouncements={announcementsRes.data.content ?? []}
        allAnnouncements={announcementsRes.data.content ?? []}
        totalElements={announcementsRes.data.page?.totalElements ?? 0}
        totalPages={announcementsRes.data.page?.totalPages ?? 0}
      />
    );
  }

  // POST용 postType 탭 → 게시글 + 고정 공지 배너 병렬 fetch
  // createdAt 내림차순 (API가 viewCount 정렬을 지원하지 않음)
  const sort: string[] = ["createdAt,desc"];

  const [postsRes, pinnedRes, allAnnouncementsRes] = await Promise.all([
    getApiBoardsBoardidPosts(
      COMMUNITY_BOARD_ID,
      { page, size: POSTS_PER_PAGE, sort, postTypeCode: target.postTypeCode },
      withToken(token ?? undefined),
    ),
    getApiBoardsBoardidAnnouncements(
      COMMUNITY_BOARD_ID,
      { page: 0, size: PINNED_ANNOUNCEMENT_COUNT },
      withToken(token ?? undefined),
    ),
    getApiBoardsBoardidAnnouncements(
      COMMUNITY_BOARD_ID,
      { page: 0, size: ALL_ANNOUNCEMENT_PAGE_SIZE },
      withToken(token ?? undefined),
    ),
  ]);
  return (
    <BoardContent
      boardId={COMMUNITY_BOARD_ID}
      tab={tab}
      tabs={tabs}
      resource="posts"
      postTypeCode={target.postTypeCode}
      currentPage={Number(params.page) || 1}
      currentUserId={currentUserId}
      initialPosts={postsRes.data.content ?? []}
      initialAnnouncements={pinnedRes.data.content ?? []}
      allAnnouncements={allAnnouncementsRes.data.content ?? []}
      totalElements={postsRes.data.page?.totalElements ?? 0}
      totalPages={postsRes.data.page?.totalPages ?? 0}
    />
  );
}
