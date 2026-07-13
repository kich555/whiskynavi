import type { CommentResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CommentItem from "./CommentItem";

vi.mock("../_lib/actions", () => ({
  deleteCommentAction: vi.fn(),
}));

function comment(overrides: Partial<CommentResponse> = {}): CommentResponse {
  return {
    id: 1,
    authorId: 10,
    authorNickname: "작성자",
    content: "댓글 내용",
    replies: [],
    ...overrides,
  };
}

describe("CommentItem", () => {
  it("관리자가 작성한 댓글에는 관리자 표식을 표시한다", () => {
    render(<CommentItem comment={comment({ authorAdmin: true })} boardId="community" postId={1} />);

    expect(screen.getByLabelText("관리자 작성자")).toBeInTheDocument();
  });

  it("일반 사용자가 작성한 댓글에는 관리자 표식을 표시하지 않는다", () => {
    render(<CommentItem comment={comment({ authorAdmin: false })} boardId="community" postId={1} />);

    expect(screen.queryByLabelText("관리자 작성자")).not.toBeInTheDocument();
  });
});
