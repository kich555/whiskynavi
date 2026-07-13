import { getApiBoardsBoardidPosts } from "@/apis/generated/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getSession } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BoardContent from "./BoardContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/apis/generated/api", () => ({
  getApiBoardsBoardidPosts: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn(() => undefined),
}));

vi.mock("../_hooks/useIsMobile", () => ({
  useIsMobile: () => true,
}));

function renderBoard(totalPages: number) {
  render(
    <BoardContent
      boardId="community"
      tab="all"
      tabs={[{ key: "all", label: "전체" }]}
      resource="posts"
      currentPage={1}
      canWritePost={false}
      initialPosts={[{ id: 1, title: "첫 게시글" }]}
      initialAnnouncements={[]}
      allAnnouncements={[]}
      totalElements={totalPages * 10}
      totalPages={totalPages}
    />,
  );
}

describe("BoardContent 모바일 더보기", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(getApiBoardsBoardidPosts).mockResolvedValue({
      data: { content: [{ id: 2, title: "다음 게시글" }] },
      status: 200,
      headers: new Headers(),
    });
  });

  it("남은 페이지가 최대 횟수보다 적으면 실제 가능한 횟수를 표시한다", () => {
    renderBoard(3);

    expect(screen.getByRole("button", { name: "더보기 · 2회 남음" })).toBeInTheDocument();
  });

  it("마지막 페이지를 불러온 뒤 게시글을 유지하고 더보기 버튼을 숨긴다", async () => {
    renderBoard(2);

    fireEvent.click(screen.getByRole("button", { name: "더보기 · 1회 남음" }));

    await waitFor(() => {
      expect(screen.getByText("다음 게시글")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /더보기/ })).not.toBeInTheDocument();
    });
  });
});
