import { describe, expect, it } from "vitest";
import { buildPostPayload } from "./post-content";

describe("buildPostPayload", () => {
  it("정화된 본문에 이미지가 있으면 hasImage를 true로 설정한다", () => {
    expect(
      buildPostPayload({
        title: "이미지 글",
        content: '<p>본문</p><img src="https://file.whiskynavi.com/board/image.webp">',
        postTypeCode: "general",
      }),
    ).toEqual({
      title: "이미지 글",
      content: '<p>본문</p><img src="https://file.whiskynavi.com/board/image.webp" />',
      postTypeCode: "general",
      hasImage: true,
    });
  });

  it("본문에 이미지가 없으면 hasImage를 false로 설정한다", () => {
    expect(
      buildPostPayload({
        title: "텍스트 글",
        content: "<p>본문만 있습니다.</p>",
        postTypeCode: "general",
      }).hasImage,
    ).toBe(false);
  });

  it("TipTap의 빈 문단을 표시 가능한 줄바꿈으로 보존한다", () => {
    expect(
      buildPostPayload({
        title: "빈 줄이 있는 글",
        content: "<p>첫 줄</p><p></p><p>   </p><p>마지막 줄</p>",
        postTypeCode: "general",
      }).content,
    ).toBe("<p>첫 줄</p><p><br /></p><p><br /></p><p>마지막 줄</p>");
  });
});
