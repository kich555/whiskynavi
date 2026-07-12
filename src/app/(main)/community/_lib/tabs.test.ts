import type { PostTypeResponse } from "@/apis/generated/api";
import { describe, expect, it } from "vitest";
import { buildTabs } from "./tabs";

describe("buildTabs", () => {
  it("returns general and popular tabs even when there are no postTypes", () => {
    expect(buildTabs([])).toEqual([
      { key: "general", label: "일반" },
      { key: "popular", label: "인기" },
    ]);
  });

  it("places POST-usage postTypes after general/popular, preserving API order", () => {
    const postTypes: PostTypeResponse[] = [
      { code: "qna", name: "질문", usages: ["POST"] },
      { code: "info", name: "정보", usages: ["POST"] },
    ];

    expect(buildTabs(postTypes)).toEqual([
      { key: "general", label: "일반" },
      { key: "popular", label: "인기" },
      { key: "qna", label: "질문" },
      { key: "info", label: "정보" },
    ]);
  });

  it("places ANNOUNCEMENT-usage postTypes after POST-usage postTypes", () => {
    const postTypes: PostTypeResponse[] = [
      { code: "notice-a", name: "공지A", usages: ["ANNOUNCEMENT"] },
      { code: "qna", name: "질문", usages: ["POST"] },
      { code: "notice-b", name: "공지B", usages: ["ANNOUNCEMENT"] },
    ];

    expect(buildTabs(postTypes)).toEqual([
      { key: "general", label: "일반" },
      { key: "popular", label: "인기" },
      { key: "qna", label: "질문" },
      { key: "notice-a", label: "공지A" },
      { key: "notice-b", label: "공지B" },
    ]);
  });

  it("skips postTypes missing a code or name instead of producing a tab with an undefined key", () => {
    const postTypes: PostTypeResponse[] = [
      { code: undefined, name: "이름만있음", usages: ["POST"] },
      { code: "no-name", name: undefined, usages: ["POST"] },
      { code: "valid", name: "정상", usages: ["POST"] },
    ];

    expect(buildTabs(postTypes)).toEqual([
      { key: "general", label: "일반" },
      { key: "popular", label: "인기" },
      { key: "valid", label: "정상" },
    ]);
  });

  it("renders a postType with both POST and ANNOUNCEMENT usages as a single tab, not duplicated", () => {
    const postTypes: PostTypeResponse[] = [{ code: "mixed", name: "혼합", usages: ["POST", "ANNOUNCEMENT"] }];

    expect(buildTabs(postTypes)).toEqual([
      { key: "general", label: "일반" },
      { key: "popular", label: "인기" },
      { key: "mixed", label: "혼합" },
    ]);
  });
});
