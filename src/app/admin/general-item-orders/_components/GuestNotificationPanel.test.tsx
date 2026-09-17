import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recoverGuestNotification } from "../notification-actions";
import GuestNotificationPanel from "./GuestNotificationPanel";
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../notification-actions", () => ({ recoverGuestNotification: vi.fn() }));
const recover = vi.mocked(recoverGuestNotification);
const rows = [
  { id: 1, orderId: 10, channel: "EMAIL", status: "SENT", maskedRecipient: "g***@example.com", retryable: true },
  { id: 2, orderId: 10, channel: "SMS", status: "PENDING", maskedRecipient: "***-****-5678", retryable: false },
];
describe("비회원 안내 복구 화면", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recover.mockResolvedValue({ success: true });
  });
  it("대기 중인 채널의 중복 재발송을 비활성화한다", () => {
    render(<GuestNotificationPanel orderId={10} rows={rows} history={[]} />);
    const buttons = screen.getAllByRole("button", { name: "재발송" });
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();
    expect(screen.getByText("발송 접수")).toBeInTheDocument();
  });
  it("재발급은 본인 확인 체크와 사유 입력 후에만 요청할 수 있다", async () => {
    render(<GuestNotificationPanel orderId={10} rows={rows} history={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "조회 코드 재발급" }));
    const submit = screen.getByRole("button", { name: "발송 예약" });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("처리 사유"), { target: { value: "주문 정보와 등록 연락처 확인" } });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(submit);
    await waitFor(() =>
      expect(recover).toHaveBeenCalledWith(10, {
        action: "reissue",
        identityConfirmed: true,
        reason: "주문 정보와 등록 연락처 확인",
      }),
    );
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("기존 코드를 폐기"));
    expect(refresh).toHaveBeenCalled();
  });
  it("실패 시 모달에서 오류를 표시하고 성공으로 처리하지 않는다", async () => {
    recover.mockResolvedValue({ success: false, error: "관리자 권한이 필요합니다." });
    render(<GuestNotificationPanel orderId={10} rows={rows} history={[]} />);
    fireEvent.click(screen.getAllByRole("button", { name: "재발송" })[0]);
    fireEvent.change(screen.getByLabelText("처리 사유"), { target: { value: "고객 요청" } });
    fireEvent.click(screen.getByRole("button", { name: "발송 예약" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("관리자 권한"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("처리 중에는 중복 클릭과 모달 닫기를 막는다", async () => {
    let resolve!: (value: { success: true }) => void;
    recover.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<GuestNotificationPanel orderId={10} rows={rows} history={[]} />);
    fireEvent.click(screen.getAllByRole("button", { name: "재발송" })[0]);
    fireEvent.change(screen.getByLabelText("처리 사유"), { target: { value: "고객 요청" } });
    fireEvent.click(screen.getByRole("button", { name: "발송 예약" }));
    expect(screen.getByRole("button", { name: "처리 중…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
    resolve({ success: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
