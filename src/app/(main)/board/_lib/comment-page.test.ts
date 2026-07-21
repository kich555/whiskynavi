import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCommentPage } from "./comment-page";

const fetchMock = vi.fn();

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function requestAt(index = 0): { url: URL; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  return { url: new URL(url), init };
}

describe("getCommentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("구 generated가 체크인된 상태에서도 신 서버 cursor와 size를 실제 요청 URL에 전달한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ comments: [{ id: 2 }], nextCursor: "cursor-3", hasMore: true }));

    await expect(getCommentPage("community", 10, "cursor 2/+", "access-token")).resolves.toEqual({
      comments: [{ id: 2 }],
      nextCursor: "cursor-3",
      hasMore: true,
    });

    const { url, init } = requestAt();
    expect(url.pathname).toBe("/api/boards/community/posts/10/comments");
    expect(url.searchParams.get("cursor")).toBe("cursor 2/+");
    expect(url.searchParams.get("size")).toBe("20");
    expect(init.method).toBe("GET");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer access-token");
  });

  it("비로그인 첫 페이지 요청에는 cursor와 Authorization을 추가하지 않는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ comments: [], nextCursor: null, hasMore: false }));

    await getCommentPage("news", 2);

    const { url, init } = requestAt();
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.get("size")).toBe("20");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("구 서버의 배열 응답도 첫 페이지로 정규화한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 3 }]));

    await expect(getCommentPage("community", 3, undefined, "token")).resolves.toEqual({
      comments: [{ id: 3 }],
      nextCursor: null,
      hasMore: false,
    });
  });
});
