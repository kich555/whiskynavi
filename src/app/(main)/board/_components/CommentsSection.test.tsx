import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CommentsSection from "./CommentsSection";

const mocks = vi.hoisted(() => ({
  loadMoreCommentsAction: vi.fn(),
}));

vi.mock("../_lib/actions", () => ({
  loadMoreCommentsAction: mocks.loadMoreCommentsAction,
}));

vi.mock("./CommentForm", () => ({
  default: () => <div>댓글 입력 폼</div>,
}));

vi.mock("./CommentItem", () => ({
  default: ({ comment }: { comment: { id?: number; content?: string } }) => (
    <div data-testid={`comment-${comment.id}`}>{comment.content}</div>
  ),
}));

describe("CommentsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("다음 cursor로 댓글을 추가 조회하고 중복 댓글은 합치지 않는다", async () => {
    mocks.loadMoreCommentsAction.mockResolvedValue({
      success: true,
      page: {
        comments: [
          { id: 1, content: "중복 댓글" },
          { id: 2, content: "다음 댓글" },
        ],
        nextCursor: null,
        hasMore: false,
      },
    });

    render(
      <CommentsSection
        boardId="community"
        postId={10}
        initialPage={{
          comments: [{ id: 1, content: "첫 댓글", replies: [{ id: 11, content: "답글" }] }],
          nextCursor: "cursor-1",
          hasMore: true,
        }}
        currentUserId={20}
        isLoggedIn
      />,
    );

    expect(screen.getByText("(2+)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "댓글 더 보기" }));

    await waitFor(() => {
      expect(mocks.loadMoreCommentsAction).toHaveBeenCalledWith("community", 10, "cursor-1");
      expect(screen.getByText("(3)")).toBeInTheDocument();
    });
    expect(screen.getAllByTestId("comment-1")).toHaveLength(1);
    expect(screen.getByText("다음 댓글")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "댓글 더 보기" })).not.toBeInTheDocument();
  });

  it("추가 조회 실패 메시지를 표시하고 현재 댓글은 유지한다", async () => {
    mocks.loadMoreCommentsAction.mockResolvedValue({ success: false, error: "댓글 조회 실패" });

    render(
      <CommentsSection
        boardId="news"
        postId={11}
        initialPage={{ comments: [{ id: 3, content: "기존 댓글" }], nextCursor: "cursor-2", hasMore: true }}
        isLoggedIn={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "댓글 더 보기" }));

    expect(await screen.findByText("댓글 조회 실패")).toBeInTheDocument();
    expect(screen.getByText("기존 댓글")).toBeInTheDocument();
  });

  it("게시글의 전체 댓글 수가 있으면 페이지 일부가 아닌 전체 개수를 표시한다", () => {
    render(
      <CommentsSection
        boardId="community"
        postId={12}
        initialPage={{ comments: [{ id: 4, content: "첫 페이지" }], nextCursor: "cursor-3", hasMore: true }}
        totalCount={37}
        isLoggedIn={false}
      />,
    );

    expect(screen.getByText("(37)")).toBeInTheDocument();
    expect(screen.queryByText("(1+)")).not.toBeInTheDocument();
  });
});
