import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BusinessApplyForm from "./BusinessApplyForm";

describe("BusinessApplyForm", () => {
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
