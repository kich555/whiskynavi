import { ApiError } from "@/apis/errors";
import { getApiV2AdminBoardsPostHistoryPostid } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { historyHref } from "../_lib/history";
import BoardHistoryDetailPage from "./page";

vi.mock("@/apis/generated/api", () => ({ getApiV2AdminBoardsPostHistoryPostid: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuthToken: vi.fn(async () => "admin-token") }));
vi.mock("@/apis/mutator", () => ({
  withToken: (token: string) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));
vi.mock("../_components/HistoryFrame", () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const detail = {
  post: {
    postId: 7,
    boardId: 1,
    boardName: "커뮤니티",
    authorId: 12,
    authorNickname: "위스키팬",
    title: "삭제된 게시글",
    deleted: true,
    deletedBy: 3,
    deletedByRole: "ADMIN",
    deletedByNickname: "운영내비",
    deleteReason: "운영 정책 위반",
  },
  content: '<p>보존된 본문</p><script>alert(1)</script><img src="https://example.com/image.jpg" onerror="alert(2)">',
};

const props = (postId = "7", returnTo = "mode=deleted&page=3&limit=10&deletedBy=3&keyword=리뷰") => ({
  params: Promise.resolve({ postId }),
  searchParams: Promise.resolve({ returnTo }),
});

describe("관리기록 상세", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiV2AdminBoardsPostHistoryPostid).mockResolvedValue({
      data: detail,
      status: 200,
      headers: new Headers(),
    });
  });

  it("관리자 인증으로 삭제 글을 조회하고 위험한 HTML을 제거하며 목록 조건을 보존한다", async () => {
    const { container } = render(await BoardHistoryDetailPage(props()));
    expect(getApiV2AdminBoardsPostHistoryPostid).toHaveBeenCalledWith(7, {
      headers: { Authorization: "Bearer admin-token" },
    });
    expect(screen.getByText("보존된 본문")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).not.toHaveAttribute("onerror");
    expect(screen.getByLabelText("삭제 정보")).toHaveTextContent("운영 정책 위반");
    expect(screen.getByRole("link", { name: "← 조회하던 목록으로" })).toHaveAttribute(
      "href",
      historyHref({ page: "3", limit: "10", deletedBy: "3", keyword: "리뷰" }),
    );
    expect(screen.getByRole("link", { name: "관리자의 전체 삭제 기록" })).toHaveAttribute(
      "href",
      historyHref({ deletedBy: "3" }),
    );
  });

  it("활성 글에는 삭제 정보를 표시하지 않고 빈 본문을 안내한다", async () => {
    vi.mocked(getApiV2AdminBoardsPostHistoryPostid).mockResolvedValue({
      data: { post: { ...detail.post, deleted: false, deletedBy: undefined, deletedByRole: undefined }, content: "" },
      status: 200,
      headers: new Headers(),
    });
    render(await BoardHistoryDetailPage(props()));
    expect(screen.getByText("게시 중")).toBeInTheDocument();
    expect(screen.getByText("보존된 본문이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByLabelText("삭제 정보")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "관리자의 전체 삭제 기록" })).not.toBeInTheDocument();
  });

  it("잘못된 게시글 ID는 API를 호출하지 않고 404 처리한다", async () => {
    await expect(BoardHistoryDetailPage(props("invalid"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getApiV2AdminBoardsPostHistoryPostid).not.toHaveBeenCalled();
  });

  it("없는 게시글 응답은 404로 처리한다", async () => {
    vi.mocked(getApiV2AdminBoardsPostHistoryPostid).mockRejectedValue(new ApiError(404, "없음"));
    await expect(BoardHistoryDetailPage(props())).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("권한 오류를 빈 본문이나 404로 숨기지 않는다", async () => {
    const error = new ApiError(403, "접근 불가");
    vi.mocked(getApiV2AdminBoardsPostHistoryPostid).mockRejectedValue(error);
    await expect(BoardHistoryDetailPage(props())).rejects.toBe(error);
  });
});
