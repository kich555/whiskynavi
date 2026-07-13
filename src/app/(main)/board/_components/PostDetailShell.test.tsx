import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PostDetailShell from "./PostDetailShell";

describe("PostDetailShell", () => {
  it("짧은 본문 아래에 불필요한 화면 높이를 강제하지 않는다", () => {
    const { container } = render(<PostDetailShell header={<h1>제목</h1>} content="짧은 본문" />);

    expect(container.firstElementChild).not.toHaveClass("min-h-screen");
  });

  it("여러 관리 버튼이 모바일 폭에서 줄바꿈될 수 있다", () => {
    render(
      <PostDetailShell header={<h1>제목</h1>} content="본문" actions={<button type="button">관리 작업</button>} />,
    );

    expect(screen.getByRole("button", { name: "관리 작업" }).parentElement).toHaveClass("flex-wrap");
  });
});
