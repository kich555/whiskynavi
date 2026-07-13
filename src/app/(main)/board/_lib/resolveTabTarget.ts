import type { PostTypeResponse } from "@/apis/generated/api";
import { ALL_POSTS_TAB_KEY } from "./tabs";

export type TabTarget = { resource: "posts" | "announcements"; postTypeCode?: string };

/**
 * 탭 키를 실제 조회 대상으로 변환한다.
 * 전체 탭은 게시글 목록을 타입 필터 없이 조회하고, 나머지 탭은 postType code와 매칭한다.
 *
 * - POST usage postType → 게시글 목록 조회 (postTypeCode 필터 적용)
 * - ANNOUNCEMENT usage postType → 공지 목록 조회 (postTypeCode 필터 적용)
 * - 둘 다 가진 postType → 공지 목록 조회 (공지 우선)
 * - tabKey가 postTypes에서 찾이 않으면 빈 게시글 목록 fallback.
 *   게시판에 postType이 하나도 없는 경우(빈 탭) 첫 진입 시 여기로 빠진다.
 */
export function resolveTabTarget(tabKey: string, postTypes: PostTypeResponse[]): TabTarget {
  if (tabKey === ALL_POSTS_TAB_KEY) {
    return { resource: "posts" };
  }

  const postType = postTypes.find((pt) => pt.code === tabKey);
  if (!postType) {
    return { resource: "posts" };
  }

  const resource = postType.usages?.includes("ANNOUNCEMENT") ? "announcements" : "posts";

  return { resource, postTypeCode: tabKey };
}
