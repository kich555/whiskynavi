import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { markServiceEntitlementUsed } from "../entitlement-actions";
import ServiceEntitlementAdminPanel from "./ServiceEntitlementAdminPanel";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../entitlement-actions", () => ({ markServiceEntitlementUsed: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("시작 전·만료 후도 처리하되 사용·취소·정지 이용권은 제외한다", async () => {
  vi.mocked(markServiceEntitlementUsed).mockResolvedValue({ success: true });
  render(
    <ServiceEntitlementAdminPanel
      orderId={10}
      rows={[
        { id: 1, status: "AVAILABLE" },
        { id: 2, status: "USED" },
        { id: 3, status: "CANCELED" },
        { id: 4, status: "EXPIRED" },
        { id: 5, status: "NOT_YET_VALID" },
        { id: 6, status: "SUSPENDED" },
      ]}
    />,
  );
  expect(screen.getAllByRole("button", { name: "사용 처리" })).toHaveLength(3);
  fireEvent.change(screen.getAllByLabelText("이용 확인 사유")[1], { target: { value: "현장 입장 확인" } });
  fireEvent.click(screen.getAllByRole("button", { name: "사용 처리" })[1]);
  await waitFor(() => expect(markServiceEntitlementUsed).toHaveBeenCalledWith(10, 4, "현장 입장 확인"));
  expect(refresh).toHaveBeenCalled();
});
