import type { PostTypeResponse } from "@/apis/generated/api";
import { describe, expect, it } from "vitest";
import { resolveTabTarget } from "./resolveTabTarget";

describe("resolveTabTarget", () => {
  it("resolves 'general' to the posts resource without a postType filter", () => {
    expect(resolveTabTarget("general", [])).toEqual({ resource: "posts" });
  });

  it("resolves 'popular' to the posts resource without a postType filter", () => {
    expect(resolveTabTarget("popular", [])).toEqual({ resource: "posts" });
  });

  it("resolves a POST-usage postType code to the posts resource with that code as filter", () => {
    const postTypes: PostTypeResponse[] = [
      { code: "qna", name: "질문", usages: ["POST"] },
      { code: "notice-a", name: "공지A", usages: ["ANNOUNCEMENT"] },
    ];

    expect(resolveTabTarget("qna", postTypes)).toEqual({ resource: "posts", postTypeCode: "qna" });
  });

  it("resolves an ANNOUNCEMENT-usage postType code to the announcements resource with that code as filter", () => {
    const postTypes: PostTypeResponse[] = [
      { code: "qna", name: "질문", usages: ["POST"] },
      { code: "notice-a", name: "공지A", usages: ["ANNOUNCEMENT"] },
    ];

    expect(resolveTabTarget("notice-a", postTypes)).toEqual({ resource: "announcements", postTypeCode: "notice-a" });
  });

  it("falls back to the unfiltered posts resource when the tab key matches no known postType (stale/deleted/deactivated)", () => {
    const postTypes: PostTypeResponse[] = [{ code: "qna", name: "질문", usages: ["POST"] }];

    expect(resolveTabTarget("deleted-notice-type", postTypes)).toEqual({ resource: "posts" });
  });
});
