import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitBusinessApplication } from "../_lib/submit-business-application";
import BusinessApplyForm from "./BusinessApplyForm";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../_lib/submit-business-application", () => ({ submitBusinessApplication: vi.fn() }));

describe("BusinessApplyForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("사업자 등록 폼에서 픽업매장 체크를 표시하지 않는다", () => {
    render(<BusinessApplyForm />);

    expect(screen.queryByRole("checkbox", { name: "픽업매장 등록" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("픽업매장 등록")).not.toBeInTheDocument();
  });

  it("10MB 초과 파일을 선택하면 입력 내용을 유지하고 제출을 차단한다", () => {
    const onClose = vi.fn();
    render(<BusinessApplyForm onClose={onClose} />);
    const name = screen.getByLabelText("사업자 이름 *");
    fireEvent.change(name, { target: { value: "테스트 사업장" } });
    const input = screen.getByLabelText("사업자 등록증 *");
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf")] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("사업자 등록증은 10MB 이하로 업로드해주세요.");
    expect(screen.getByRole("button", { name: "등록 신청" })).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(fireEvent.submit(input.closest("form")!)).toBe(false);
    expect(name).toHaveValue("테스트 사업장");
    expect(onClose).not.toHaveBeenCalled();
    expect(submitBusinessApplication).not.toHaveBeenCalled();
  });

  it("초과 파일을 10MB 파일로 교체하면 오류를 해제하고 다시 제출할 수 있다", () => {
    render(<BusinessApplyForm />);
    const input = screen.getByLabelText("사업자 등록증 *");
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(5 * 10210 * 1024)], "large.pdf")] },
    });
    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(10 * 1024 * 1024)], "valid.pdf")] },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "등록 신청" })).toBeEnabled();
    expect(screen.getByText("valid.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF, JPG, PNG (최대 10MB)")).toBeInTheDocument();
  });

  it("선택 이벤트를 거치지 않아도 제출 직전에 초과 파일을 차단한다", () => {
    render(<BusinessApplyForm />);
    const input = screen.getByLabelText("사업자 등록증 *");
    Object.defineProperty(input, "files", {
      value: [new File([new Uint8Array(5 * 10210 * 1024)], "large.pdf")],
    });

    expect(fireEvent.submit(input.closest("form")!)).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("사업자 등록증은 10MB 이하로 업로드해주세요.");
  });

  it("첨부파일이 없으면 전송하지 않고 폼에 안내한다", () => {
    render(<BusinessApplyForm />);
    const input = screen.getByLabelText("사업자 등록증 *");

    expect(fireEvent.submit(input.closest("form")!)).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("사업자 등록증을 첨부해주세요.");
  });

  it("백엔드의 오류 메시지, 해결 안내와 문의 코드를 표시하고 입력을 유지한다", async () => {
    vi.mocked(submitBusinessApplication).mockResolvedValue({
      success: false,
      error: "요청한 사업자 등록 신청을 찾을 수 없습니다.",
      hint: "신청 내역을 새로고침해 주세요.",
      requestId: "request-123",
    });

    render(<BusinessApplyForm />);

    const name = screen.getByLabelText("사업자 이름 *");
    fireEvent.change(name, { target: { value: "테스트 사업장" } });
    const input = screen.getByLabelText("사업자 등록증 *");
    fireEvent.change(input, { target: { files: [new File(["pdf"], "valid.pdf")] } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("요청한 사업자 등록 신청을 찾을 수 없습니다.");
    expect(name).toHaveValue("테스트 사업장");
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("신청 내역을 새로고침해 주세요.");
    expect(screen.getByText("고객센터 문의 코드: request-123")).toBeInTheDocument();
  });
  it("정상 파일 제출 성공 시 목록을 갱신하고 폼을 닫는다", async () => {
    vi.mocked(submitBusinessApplication).mockResolvedValue({ success: true });
    const onClose = vi.fn();
    render(<BusinessApplyForm onClose={onClose} />);
    const input = screen.getByLabelText("사업자 등록증 *");
    fireEvent.change(input, { target: { files: [new File(["pdf"], "valid.pdf")] } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(refresh).toHaveBeenCalledOnce();
  });
});
