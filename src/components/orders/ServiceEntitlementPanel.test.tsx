import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import ServiceEntitlementPanel from "./ServiceEntitlementPanel";
import { completeMyServiceEntitlement, lookupServiceEntitlements } from "./entitlement-actions";
vi.mock("./entitlement-actions", () => ({ lookupServiceEntitlements: vi.fn(), completeMyServiceEntitlement: vi.fn() }));
const lookup = vi.mocked(lookupServiceEntitlements);
beforeEach(() => vi.clearAllMocks());
it("수량별 상태와 부분 사용을 표시하고 비회원 코드로 조회한다", async () => {
  lookup.mockResolvedValue({
    success: true,
    data: [
      { id: 1, itemName: "입장권", unitNumber: 1, status: "USED", usedAt: "2026-09-20T10:00:00" },
      { id: 2, itemName: "입장권", unitNumber: 2, status: "AVAILABLE" },
      { id: 3, itemName: "입장권", unitNumber: 3, status: "EXPIRED" },
    ],
  });
  render(<ServiceEntitlementPanel orderId={10} guestOrderToken="code" />);
  expect(await screen.findByText("3장 중 1장 사용 · 배송 없음")).toBeInTheDocument();
  expect(screen.getByText("사용 완료")).toBeInTheDocument();
  expect(screen.getByText("만료")).toBeInTheDocument();
  expect(lookup).toHaveBeenCalledWith(10, "code");
});
it("조회 실패를 빈 이용권으로 숨기지 않고 재시도한다", async () => {
  lookup
    .mockResolvedValueOnce({ success: false, error: "인증을 확인해 주세요." })
    .mockResolvedValueOnce({ success: true, data: [] });
  render(<ServiceEntitlementPanel orderId={10} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("인증을 확인");
  fireEvent.click(screen.getByRole("button", { name: "이용권 새로고침" }));
  await waitFor(() => expect(lookup).toHaveBeenCalledTimes(2));
  expect(await screen.findByText(/아직 발급된 이용권/)).toBeInTheDocument();
});

it("본인 이용권을 확인 후 사용 완료하고 상태를 다시 조회한다", async () => {
  lookup
    .mockResolvedValueOnce({ success: true, data: [{ id: 2, status: "AVAILABLE" }] })
    .mockResolvedValueOnce({ success: true, data: [{ id: 2, status: "USED", usedAt: "2026-09-20T18:00:00" }] });
  vi.mocked(completeMyServiceEntitlement).mockResolvedValue({ success: true });
  render(<ServiceEntitlementPanel orderId={10} guestOrderToken="code" />);
  fireEvent.click(await screen.findByRole("button", { name: "사용 완료 처리" }));
  expect(completeMyServiceEntitlement).not.toHaveBeenCalled();
  expect(screen.getByText(/되돌릴 수 없으며/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "돌아가기" }));
  expect(completeMyServiceEntitlement).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "사용 완료 처리" }));
  fireEvent.click(screen.getByRole("button", { name: "확인 · 사용 완료" }));
  await waitFor(() => expect(completeMyServiceEntitlement).toHaveBeenCalledWith(10, 2, "code"));
  expect(await screen.findByText("1장 중 1장 사용 · 배송 없음")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "사용 완료 처리" })).not.toBeInTheDocument();
});
it("사용 불가능 상태에는 버튼이 없고 처리 오류를 표시한다", async () => {
  lookup.mockResolvedValue({
    success: true,
    data: [
      { id: 1, status: "AVAILABLE" },
      { id: 2, status: "NOT_YET_VALID" },
      { id: 3, status: "EXPIRED" },
      { id: 4, status: "CANCELED" },
      { id: 5, status: "SUSPENDED" },
    ],
  });
  vi.mocked(completeMyServiceEntitlement).mockResolvedValue({ success: false, error: "이용 기간이 지났습니다." });
  render(<ServiceEntitlementPanel orderId={10} />);
  expect(await screen.findAllByRole("button", { name: "사용 완료 처리" })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "사용 완료 처리" }));
  fireEvent.click(screen.getByRole("button", { name: "확인 · 사용 완료" }));
  expect(await screen.findByText("이용 기간이 지났습니다.")).toBeInTheDocument();
});
