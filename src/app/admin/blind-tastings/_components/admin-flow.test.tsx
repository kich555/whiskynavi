import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { runOperation } from "../actions";
import NoticeDetail from "./NoticeDetail";
import OperationButton from "./OperationButton";
import Overview from "./Overview";
vi.mock("../actions", () => ({ runOperation: vi.fn(), searchBottles: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/blind-tastings",
}));
vi.mock("../../_components/AdminLayoutClient", () => ({ useSidebar: () => ({ toggle: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it("빈 회차에서도 공고 생성과 준비 메뉴가 보인다", () => {
  render(<Overview section="notices" result={{ success: true, kind: "notices", data: [] }} />);
  expect(screen.getByText("표시할 내역이 없습니다.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "공고 만들기" })).toBeEnabled();
  expect(screen.getByRole("link", { name: "리뷰 보틀" })).toHaveAttribute("href", "/admin/blind-tastings/bottles");
});
it("제출 JSON은 실행하지 않고 원문을 표시하며 수정 버튼이 없다", () => {
  const json = ' {"감상":"<script>alert(1)</script>"} ';
  render(
    <NoticeDetail
      id={1}
      tab="reviews"
      query={{}}
      result={{
        success: true,
        kind: "reviews",
        serverTime: 0,
        notice: { id: 1, title: "테스트", version: 0, visibility: "PRIVATE", reviewDeadlineAt: "2020-01-01T00:00:00Z" },
        samples: [{ id: 2, blindCode: "A" }],
        reviews: [{ review: { id: 3, answersJson: json, version: 1 }, blindCode: "A", nickname: "참가자" }],
        reviewStatus: [],
        summary: { submittedCount: 1 },
      }}
    />,
  );
  expect(document.querySelector("pre")?.textContent).toBe(json);
  expect(document.querySelector("pre script")).toBeNull();
  expect(screen.queryByRole("button", { name: "리뷰 수정" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "결과·통계 추출" })).toBeEnabled();
});
it("최초 발송 이후에는 회차 취소를 제공하지 않는다", () => {
  render(
    <NoticeDetail
      id={1}
      tab="settings"
      query={{}}
      result={{
        success: true,
        kind: "settings",
        serverTime: 0,
        notice: { id: 1, firstShippedAt: "2026-01-01T00:00:00Z", status: "FULFILLMENT" },
        samples: [],
        availableSamples: [],
      }}
    />,
  );
  expect(screen.getByRole("button", { name: "회차 취소" })).toBeDisabled();
});
it("충돌 시 재실행을 막고 최신 상태를 요청한다", async () => {
  vi.mocked(runOperation).mockResolvedValue({ success: false, error: "버전 충돌", conflict: true });
  render(<OperationButton operation="confirm" label="전체 배분 확정" id={1} version={2} />);
  fireEvent.click(screen.getByRole("button", { name: "전체 배분 확정" }));
  fireEvent.submit(screen.getByRole("button", { name: "전체 배분 확정 실행" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("버전 충돌"));
  expect(screen.queryByRole("button", { name: "전체 배분 확정 실행" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "최신 상태 불러오기" })).toBeInTheDocument();
});
