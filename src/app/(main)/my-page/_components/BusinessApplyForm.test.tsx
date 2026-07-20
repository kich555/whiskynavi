import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessApplyForm from "./BusinessApplyForm";

const mockedActionState = vi.hoisted(() => ({
  value: { success: false } as {
    success: boolean;
    error?: string;
    hint?: string;
    requestId?: string;
  },
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: () => [mockedActionState.value, vi.fn(), false],
  };
});

vi.mock("../actions", () => ({
  submitBusinessApplication: vi.fn(),
}));

describe("BusinessApplyForm", () => {
  beforeEach(() => {
    mockedActionState.value = { success: false };
  });

  it("사업자 등록 폼에서 픽업매장 체크를 표시하지 않는다", () => {
    render(<BusinessApplyForm />);

    expect(screen.queryByRole("checkbox", { name: "픽업매장 등록" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("픽업매장 등록")).not.toBeInTheDocument();
  });

  it("백엔드의 오류 메시지, 해결 안내와 문의 코드를 표시한다", () => {
    mockedActionState.value = {
      success: false,
      error: "요청한 사업자 등록 신청을 찾을 수 없습니다.",
      hint: "신청 내역을 새로고침해 주세요.",
      requestId: "request-123",
    };

    render(<BusinessApplyForm />);

    expect(screen.getByRole("alert")).toHaveTextContent("요청한 사업자 등록 신청을 찾을 수 없습니다.");
    expect(screen.getByRole("status")).toHaveTextContent("신청 내역을 새로고침해 주세요.");
    expect(screen.getByText("고객센터 문의 코드: request-123")).toBeInTheDocument();
  });
});
