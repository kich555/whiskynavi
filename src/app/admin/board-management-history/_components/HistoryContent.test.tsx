import type { AdminBoardPostHistoryResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { historyHref, normalizeHistoryFilters } from "../_lib/history";
import HistoryContent from "./HistoryContent";

const post: AdminBoardPostHistoryResponse = {
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
  deletedAt: "2026-09-17T14:30:00",
};

describe("관리기록 화면", () => {
  it("닉네임을 표시하고 작성자·관리자별 정확한 이력을 연결한다", () => {
    render(<HistoryContent filters={normalizeHistoryFilters({})} records={[post]} total={1} />);
    for (const link of screen.getAllByRole("link", { name: "위스키팬" })) {
      expect(link).toHaveAttribute("href", historyHref({ mode: "posts", authorId: "12" }));
    }
    for (const link of screen.getAllByRole("link", { name: "운영내비" })) {
      expect(link).toHaveAttribute("href", historyHref({ deletedBy: "3" }));
    }
    expect(screen.getByLabelText("작성자 닉네임")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("직접 삭제한 사용자를 관리자로 표시하거나 관리자 삭제 링크로 연결하지 않는다", () => {
    render(
      <HistoryContent
        filters={normalizeHistoryFilters({ mode: "posts" })}
        records={[
          { ...post, authorNickname: undefined, deletedBy: 12, deletedByRole: "USER", deletedByNickname: "직접삭제자" },
        ]}
        total={1}
      />,
    );
    expect(screen.getAllByText("작성자 삭제").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "직접삭제자" })).not.toBeInTheDocument();
    expect(screen.getAllByText("닉네임 확인 불가").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("삭제 관리자 닉네임")).not.toBeInTheDocument();
  });

  it("상세와 다음 페이지에 현재 검색 조건을 유지한다", () => {
    const filters = normalizeHistoryFilters({ page: "2", limit: "10", keyword: "리뷰", authorId: "12" });
    render(<HistoryContent filters={filters} records={[post]} total={30} />);
    expect(screen.getByRole("link", { name: "다음" })).toHaveAttribute("href", historyHref({ ...filters, page: "3" }));
    const detail = screen.getAllByRole("link", { name: "삭제된 게시글" })[0];
    expect(detail.getAttribute("href")).toContain("/7?returnTo=");
    expect(decodeURIComponent(detail.getAttribute("href")!)).toContain("page=2");
  });
});
