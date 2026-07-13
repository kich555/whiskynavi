import type { PostResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PostDetailContent from "./PostDetailContent";

vi.mock("../_lib/actions", () => ({
  deletePostAction: vi.fn(),
}));

vi.mock("./AdminPostDeleteDialog", () => ({
  default: () => <button type="button">관리자 삭제</button>,
}));

vi.mock("./CommentsSection", () => ({
  default: () => null,
}));

function post(overrides: Partial<PostResponse> = {}): PostResponse {
  return {
    id: 10,
    boardId: 1,
    authorId: 20,
    title: "게시글 제목",
    content: "게시글 본문",
    ...overrides,
  };
}

describe("PostDetailContent", () => {
  it("관리자가 자기 글을 보면 작성자용 수정과 일반 삭제 버튼을 표시한다", () => {
    render(<PostDetailContent post={post()} boardId="community" currentUserId={20} comments={[]} isLoggedIn isAdmin />);

    expect(screen.getByRole("link", { name: "수정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "관리자 삭제" })).not.toBeInTheDocument();
  });

  it("관리자가 다른 사용자의 글을 보면 관리자 삭제 버튼만 표시한다", () => {
    render(<PostDetailContent post={post()} boardId="community" currentUserId={30} comments={[]} isLoggedIn isAdmin />);

    expect(screen.getByRole("button", { name: "관리자 삭제" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "수정" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
  });

  it("관리자가 작성한 글에는 관리자 표식을 표시한다", () => {
    render(
      <PostDetailContent
        post={post({ authorNickname: "운영자", authorAdmin: true })}
        boardId="community"
        comments={[]}
        isLoggedIn={false}
        isAdmin={false}
      />,
    );

    expect(screen.getByText("운영자")).toBeInTheDocument();
    expect(screen.getByLabelText("관리자 작성자")).toBeInTheDocument();
  });
});
