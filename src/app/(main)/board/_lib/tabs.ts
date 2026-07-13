import type { PostTypeResponse } from "@/apis/generated/api";

export interface BoardTab {
  key: string;
  label: string;
}

export const ALL_POSTS_TAB_KEY = "all";

function toTab(postType: PostTypeResponse): BoardTab {
  return { key: postType.code!, label: postType.name! };
}

/**
 * 게시판의 postType 목록을 탭으로 변환한다.
 * 게시글을 타입 필터 없이 조회하는 전체 탭을 항상 첫 번째에 둔다.
 *
 * 정렬 규칙:
 * - API가 준 순서(displayOrder/name)를 그대로 유지하되,
 * - 같은 게시판 내에서 POST용 탭이 ANNOUNCEMENT용 탭보다 앞에 오도록 그룹핑한다.
 *   usages에 ANNOUNCEMENT와 POST가 둘 다 있는 postType은 resolveTabTarget에서 항상
 *   announcements로 라우팅되므로 announcements 그룹에만 속하게 한다.
 */
export function buildTabs(postTypes: PostTypeResponse[]): BoardTab[] {
  const namedPostTypes = postTypes.filter((postType) => postType.code && postType.name);

  const postTabs = namedPostTypes
    .filter((postType) => postType.usages?.includes("POST") && !postType.usages?.includes("ANNOUNCEMENT"))
    .map(toTab);
  const announcementTabs = namedPostTypes.filter((postType) => postType.usages?.includes("ANNOUNCEMENT")).map(toTab);

  return [{ key: ALL_POSTS_TAB_KEY, label: "전체" }, ...postTabs, ...announcementTabs];
}
