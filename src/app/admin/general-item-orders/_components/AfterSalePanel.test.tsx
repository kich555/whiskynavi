import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { mutateAfterSale } from "../after-sale-actions";
import AfterSalePanel from "./AfterSalePanel";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../after-sale-actions", () => ({ mutateAfterSale: vi.fn().mockResolvedValue({ success: true }) }));
it("미확인 환불은 추가 환불을 막고 동일 요청 재확인을 제공한다", async () => {
  const user = userEvent.setup();
  render(
    <AfterSalePanel
      orderId={1}
      orderItems={[{ orderItemId: 3, itemName: "잔", quantity: 2 }]}
      data={{
        paidAmount: 10000,
        refundedAmount: 0,
        cases: [{ id: 2, type: "RETURN", status: "OPEN", reason: "반품" }],
        items: [{ id: 4, caseId: 2, orderItemId: 3, quantity: 1, restoredQuantity: 0 }],
        refunds: [
          { id: 5, caseId: 2, status: "UNKNOWN", requestKey: "12345678-1234-4234-8234-123456789abc", amount: 1000 },
        ],
        events: [],
      }}
    />,
  );
  expect(screen.getByRole("button", { name: "입력 금액으로 토스 환불" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "검수한 수량 재고 복구" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "같은 환불 결과 재확인" }));
  expect(mutateAfterSale).toHaveBeenCalledWith(1, {
    kind: "retry",
    requestKey: "12345678-1234-4234-8234-123456789abc",
  });
});

it("기존 처리 상태를 유지하고 환불 확인을 취소하면 요청하지 않는다", async () => {
  vi.mocked(mutateAfterSale).mockClear();
  const confirm = vi.fn().mockReturnValue(false);
  vi.stubGlobal("confirm", confirm);
  const user = userEvent.setup();
  render(
    <AfterSalePanel orderId={1} orderItems={[]} data={{ cases: [{ id: 2, type: "RETURN", status: "INSPECTED" }] }} />,
  );
  expect(screen.getByLabelText("접수 2 처리 상태")).toHaveValue("INSPECTED");
  await user.type(screen.getByLabelText("접수 2 최종 환불액"), "1000");
  await user.type(screen.getByLabelText("접수 2 환불 사유"), "반품");
  await user.click(screen.getByRole("button", { name: "입력 금액으로 토스 환불" }));
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining("1,000"));
  expect(mutateAfterSale).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
