import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { markServiceEntitlementUsed } from "../general-item-orders/entitlement-actions";
import ServiceEntitlementsContent from "./ServiceEntitlementsContent";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../general-item-orders/entitlement-actions", () => ({ markServiceEntitlementUsed: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("구매자·기록·상태를 표시하고 검색 조건을 다음 목록에 유지한다", async () => {
  vi.mocked(markServiceEntitlementUsed).mockResolvedValue({ success: true });
  render(
    <ServiceEntitlementsContent
      params={{ keyword: "시음", status: "EXPIRED", beforeId: "99" }}
      result={{
        success: true,
        data: {
          items: [
            {
              id: 3,
              orderId: 10,
              orderNumber: "ORD-10",
              itemName: "시음권",
              customerName: "구매자",
              customerPhone: "01012345678",
              status: "EXPIRED",
            },
            {
              id: 2,
              orderId: 11,
              itemName: "시음권",
              status: "USED",
              usedAt: "2026-09-20T18:00:00",
              usedBy: 99,
              useReason: "현장 확인",
            },
            { id: 1, orderId: 12, status: "CANCELED" },
          ],
          hasMore: true,
          nextBeforeId: 1,
        },
      }}
    />,
  );
  expect(screen.getByText(/01012345678/)).toHaveTextContent("구매자");
  expect(screen.getByText("사유: 현장 확인")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "ORD-10" })).toHaveAttribute("href", "/admin/general-item-orders/10");
  const next = screen.getByRole("link", { name: "다음 50건" }).getAttribute("href")!;
  expect(new URL(next, "http://localhost").searchParams.get("keyword")).toBe("시음");
  expect(next).toContain("beforeId=1");
  expect(next).toContain("status=EXPIRED");
  expect(screen.getByRole("link", { name: "처음 목록" }).getAttribute("href")).not.toContain("beforeId");
  expect(screen.getAllByRole("button", { name: "사용 처리" })).toHaveLength(1);
  fireEvent.change(screen.getByLabelText("이용 확인 사유"), { target: { value: "만료 후 확인" } });
  fireEvent.click(screen.getByRole("button", { name: "사용 처리" }));
  await waitFor(() => expect(markServiceEntitlementUsed).toHaveBeenCalledWith(10, 3, "만료 후 확인"));
  expect(await screen.findByText("사용 처리했습니다.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "사용 처리" })).not.toBeInTheDocument();
});
it("조회 실패는 오류와 새로고침을 표시한다", () => {
  render(<ServiceEntitlementsContent params={{}} result={{ success: false, error: "인증이 만료되었습니다." }} />);
  expect(screen.getByRole("alert")).toHaveTextContent("인증이 만료");
  expect(screen.queryByText(/조건에 맞는 이용권이 없습니다/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "새로고침" }));
  expect(refresh).toHaveBeenCalled();
});
it("마지막 빈 목록에는 다음 페이지를 표시하지 않는다", () => {
  render(<ServiceEntitlementsContent params={{}} result={{ success: true, data: { items: [], hasMore: false } }} />);
  expect(screen.getByText(/조건에 맞는 이용권이 없습니다/)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "다음 50건" })).not.toBeInTheDocument();
});
