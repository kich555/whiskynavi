import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BusinessApplyForm from "./BusinessApplyForm";

vi.mock("../actions", () => ({
  submitBusinessApplication: vi.fn(),
}));

describe("BusinessApplyForm", () => {
  it("사업자 등록 폼에서 픽업매장 체크를 표시하지 않는다", () => {
    render(<BusinessApplyForm />);

    expect(screen.queryByRole("checkbox", { name: "픽업매장 등록" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("픽업매장 등록")).not.toBeInTheDocument();
  });
});
