import type { PostTypeResponse } from "@/apis/generated/api";

export interface CommunityTab {
  key: string;
  label: string;
}

function toTab(postType: PostTypeResponse): CommunityTab {
  return { key: postType.code!, label: postType.name! };
}

export function buildTabs(postTypes: PostTypeResponse[]): CommunityTab[] {
  const namedPostTypes = postTypes.filter((postType) => postType.code && postType.name);

  // usages에 ANNOUNCEMENT와 POST가 둘 다 있는 postType은 resolveTabTarget에서 항상
  // announcements로 라우팅되므로, 탭도 announcements 그룹 하나에만 속하게 한다.
  const announcementTabs = namedPostTypes.filter((postType) => postType.usages?.includes("ANNOUNCEMENT")).map(toTab);
  const postTabs = namedPostTypes
    .filter((postType) => postType.usages?.includes("POST") && !postType.usages?.includes("ANNOUNCEMENT"))
    .map(toTab);

  return [{ key: "general", label: "일반" }, { key: "popular", label: "인기" }, ...postTabs, ...announcementTabs];
}
