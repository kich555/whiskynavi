import type { PostSummaryResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PostItem from "./PostItem";

function post(overrides: Partial<PostSummaryResponse> = {}): PostSummaryResponse {
  return {
    id: 1,
    title: "이미지가 있는 게시글",
    authorNickname: "작성자",
    commentCount: 3,
    viewCount: 10,
    hasImage: true,
    ...overrides,
  };
}

describe("PostItem", () => {
  it.each([true, false])("글 분류를 제목 앞에 표시한다", (isMobile) => {
    render(
      <PostItem
        post={post({ postType: { code: "question", name: "질문" } })}
        isMobile={isMobile}
        boardId="community"
      />,
    );

    const postType = screen.getByText("질문");
    const title = screen.getByText("이미지가 있는 게시글");

    expect(postType.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("글 분류명이 없으면 분류 라벨을 표시하지 않는다", () => {
    render(<PostItem post={post({ postType: { code: "question" } })} isMobile boardId="community" />);

    expect(screen.queryByText("질문")).not.toBeInTheDocument();
    expect(screen.getByText("이미지가 있는 게시글")).toBeInTheDocument();
  });

  it.each([true, false])("이미지가 있으면 제목과 댓글 수 사이에 아이콘을 표시한다", (isMobile) => {
    render(<PostItem post={post()} isMobile={isMobile} boardId="community" />);

    const title = screen.getByText("이미지가 있는 게시글");
    const imageIcon = screen.getByRole("img", { name: "이미지 첨부됨" });
    const commentCount = screen.getByText("[3]");

    expect(title.compareDocumentPosition(imageIcon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(imageIcon.compareDocumentPosition(commentCount) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("이미지가 없으면 이미지 아이콘을 표시하지 않는다", () => {
    render(<PostItem post={post({ hasImage: false })} isMobile boardId="community" />);

    expect(screen.queryByRole("img", { name: "이미지 첨부됨" })).not.toBeInTheDocument();
  });
});
