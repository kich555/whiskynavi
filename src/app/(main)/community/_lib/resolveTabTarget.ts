import type { PostTypeResponse } from "@/apis/generated/api";

export type TabTarget = { resource: "posts" | "announcements"; postTypeCode?: string };

const FIXED_TABS = new Set(["general", "popular"]);

export function resolveTabTarget(tabKey: string, postTypes: PostTypeResponse[]): TabTarget {
  if (FIXED_TABS.has(tabKey)) {
    return { resource: "posts" };
  }

  const postType = postTypes.find((pt) => pt.code === tabKey);
  if (!postType) {
    return { resource: "posts" };
  }

  const resource = postType.usages?.includes("ANNOUNCEMENT") ? "announcements" : "posts";

  return { resource, postTypeCode: tabKey };
}
