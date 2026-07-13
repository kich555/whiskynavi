import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BoardTabs from "./BoardTabs";

const tabs = [
  { key: "all", label: "전체" },
  { key: "review", label: "시음 후기" },
  { key: "question", label: "질문과 답변" },
  { key: "announcement", label: "공지사항" },
];

describe("BoardTabs", () => {
  it("좁은 화면에서도 탭을 줄이지 않고 가로로 넘길 수 있다", () => {
    render(<BoardTabs tabs={tabs} activeTab="all" onTabChange={vi.fn()} />);

    const tabList = screen.getByRole("navigation", { name: "게시판 분류" });
    expect(tabList).toHaveClass("min-w-0", "flex-1", "overflow-x-auto", "overscroll-x-contain");

    for (const tab of tabs) {
      expect(screen.getByRole("button", { name: tab.label })).toHaveClass("shrink-0", "whitespace-nowrap");
    }
  });

  it("선택한 탭 변경을 요청하고 현재 탭을 표시한다", () => {
    const onTabChange = vi.fn();
    render(<BoardTabs tabs={tabs} activeTab="question" onTabChange={onTabChange} />);

    expect(screen.getByRole("button", { name: "질문과 답변" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "공지사항" }));

    expect(onTabChange).toHaveBeenCalledWith("announcement");
  });
});
