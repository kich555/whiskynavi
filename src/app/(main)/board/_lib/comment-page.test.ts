import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCommentPage } from "./comment-page";

const mocks = vi.hoisted(() => ({
  fetchComments: vi.fn(),
  supportsParams: true,
}));

vi.mock("@/apis/generated/api", () => ({
  getApiBoardsBoardidPostsPostidComments: mocks.fetchComments,
  getGetApiBoardsBoardidPostsPostidCommentsUrl: (...args: unknown[]) =>
    mocks.supportsParams && args.length >= 3 ? "/api/boards/community/posts/1/comments?size=20" : "/api/comments",
}));

vi.mock("@/apis/mutator", () => ({
  withToken: (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
}));

describe("getCommentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supportsParams = true;
  });

  it("PR #208 생성 함수에는 params와 RequestInit을 분리해 전달한다", async () => {
    mocks.fetchComments.mockResolvedValue({
      data: { comments: [{ id: 1 }], nextCursor: "next", hasMore: true },
    });

    await expect(getCommentPage("community", 1, "cursor", "access-token")).resolves.toEqual({
      comments: [{ id: 1 }],
      nextCursor: "next",
      hasMore: true,
    });
    expect(mocks.fetchComments).toHaveBeenCalledWith(
      "community",
      1,
      { cursor: "cursor", size: 20 },
      { headers: { Authorization: "Bearer access-token" } },
    );
  });

  it("비로그인 조회에는 Authorization 옵션을 추가하지 않는다", async () => {
    mocks.fetchComments.mockResolvedValue({ data: { comments: [], nextCursor: null, hasMore: false } });

    await getCommentPage("news", 2);

    expect(mocks.fetchComments).toHaveBeenCalledWith("news", 2, { cursor: undefined, size: 20 }, undefined);
  });

  it("구 생성 함수의 배열 응답도 첫 페이지로 정규화한다", async () => {
    mocks.supportsParams = false;
    mocks.fetchComments.mockResolvedValue({ data: [{ id: 3 }] });

    await expect(getCommentPage("community", 3, undefined, "token")).resolves.toEqual({
      comments: [{ id: 3 }],
      nextCursor: null,
      hasMore: false,
    });
    expect(mocks.fetchComments).toHaveBeenCalledWith("community", 3, {
      headers: { Authorization: "Bearer token" },
    });
  });
});
