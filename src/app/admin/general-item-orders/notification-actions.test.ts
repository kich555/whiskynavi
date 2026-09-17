import {
  getApiV2AdminGuestNotifications,
  getApiV2AdminOrdersOrderIdGuestNotificationHistory,
  postApiV2AdminOrdersOrderIdGuestNotificationsIdRetry,
  postApiV2AdminOrdersOrderIdGuestTokenReissue,
} from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadGuestNotificationHistory, loadGuestNotifications, recoverGuestNotification } from "./notification-actions";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/apis/generated/api", () => ({
  getApiV2AdminGuestNotifications: vi.fn(),
  getApiV2AdminOrdersOrderIdGuestNotificationHistory: vi.fn(),
  postApiV2AdminOrdersOrderIdGuestNotificationsIdRetry: vi.fn(),
  postApiV2AdminOrdersOrderIdGuestTokenReissue: vi.fn(),
}));
const session = vi.mocked(getServerSession);
const retry = vi.mocked(postApiV2AdminOrdersOrderIdGuestNotificationsIdRetry);
const reissue = vi.mocked(postApiV2AdminOrdersOrderIdGuestTokenReissue);
describe("비회원 안내 관리자 액션", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue({ accessToken: "admin-token", user: { roles: ["ROLE_ADMIN"] } });
  });
  it("인증 만료와 일반 회원의 조회·변경 요청을 모두 거부한다", async () => {
    for (const value of [null, { accessToken: "member-token", user: { roles: ["ROLE_USER"] } }]) {
      session.mockResolvedValue(value);
      await expect(loadGuestNotifications()).rejects.toThrow();
      await expect(loadGuestNotificationHistory(1)).rejects.toThrow();
      expect((await recoverGuestNotification(1, { action: "retry", notificationId: 2, reason: "요청" })).success).toBe(
        false,
      );
      expect(
        (await recoverGuestNotification(1, { action: "reissue", identityConfirmed: true, reason: "확인" })).success,
      ).toBe(false);
    }
    expect(getApiV2AdminGuestNotifications).not.toHaveBeenCalled();
    expect(getApiV2AdminOrdersOrderIdGuestNotificationHistory).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    expect(reissue).not.toHaveBeenCalled();
  });
  it("재발급은 본인 확인과 사유를 요구한다", async () => {
    expect(await recoverGuestNotification(1, { action: "reissue", identityConfirmed: false, reason: "사유" })).toEqual({
      success: false,
      error: "주문자 본인 확인을 완료해 주세요.",
    });
    expect(
      (await recoverGuestNotification(1, { action: "reissue", identityConfirmed: true, reason: " " })).success,
    ).toBe(false);
    expect(reissue).not.toHaveBeenCalled();
    expect(
      await recoverGuestNotification(1, { action: "reissue", identityConfirmed: true, reason: " 확인 완료 " }),
    ).toEqual({ success: true });
    expect(reissue).toHaveBeenCalledWith(
      1,
      { reason: "확인 완료", identityConfirmed: true },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });
  it("채널별 재발송 요청은 코드나 변경 연락처를 보내지 않는다", async () => {
    await recoverGuestNotification(1, { action: "retry", notificationId: 2, reason: "고객 요청" });
    expect(retry).toHaveBeenCalledWith(
      1,
      2,
      { reason: "고객 요청" },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(reissue).not.toHaveBeenCalled();
  });
  it("발송 ID와 주문 ID 입력을 검증한다", async () => {
    expect(
      (await recoverGuestNotification(-1, { action: "retry", notificationId: 2, reason: "고객 요청" })).success,
    ).toBe(false);
    expect(
      (await recoverGuestNotification(1, { action: "retry", notificationId: NaN, reason: "고객 요청" })).success,
    ).toBe(false);
    expect(retry).not.toHaveBeenCalled();
  });
});
