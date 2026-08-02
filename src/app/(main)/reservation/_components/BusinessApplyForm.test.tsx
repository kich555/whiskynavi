import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BusinessApplyForm from "./BusinessApplyForm";

describe("BusinessApplyForm", () => {
  it("사업장 선택값과 선택 목록에 업장명과 주소를 함께 표시한다", async () => {
    const user = userEvent.setup();
    render(
      <BusinessApplyForm
        businesses={[
          {
            businessId: 20,
            businessName: "신청 사업장",
            pickupAddress: "서울특별시 중구 세종대로 110",
          },
        ]}
        selectedBusinessId={20}
        onBusinessChange={vi.fn()}
        onApply={vi.fn()}
        isPending={false}
      />,
    );

    const selector = screen.getByRole("combobox", { name: "신청 사업장" });
    expect(selector).toHaveTextContent("신청 사업장 · 서울특별시 중구 세종대로 110");

    await user.click(selector);

    const option = screen.getByRole("option", {
      name: "신청 사업장 서울특별시 중구 세종대로 110",
    });
    expect(option).toBeInTheDocument();
  });

  it("빈 값과 소수 수량은 제출하지 않고 유효한 정수만 전달한다", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <BusinessApplyForm
        businesses={[{ businessId: 20, businessName: "신청 사업장" }]}
        selectedBusinessId={20}
        onBusinessChange={vi.fn()}
        onApply={onApply}
        isPending={false}
        maxQuantity={3}
      />,
    );

    const input = screen.getByLabelText("신청 수량");
    const submit = screen.getByRole("button", { name: "예약하기" });

    fireEvent.change(input, { target: { value: "" } });
    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: "1.5" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: "2" } });
    await user.click(submit);

    expect(onApply).toHaveBeenCalledWith(2);
  });
});
