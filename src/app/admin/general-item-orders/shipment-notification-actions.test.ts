import {
  getApiV2AdminOrdersOrderIdShipmentNotificationHistory,
  getApiV2AdminShipmentNotifications,
  postApiV2AdminOrdersOrderIdShipmentNotificationsIdRetry,
} from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadShipmentNotificationHistory,
  loadShipmentNotifications,
  recoverShipmentNotification,
} from "./shipment-notification-actions";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/apis/generated/api", () => ({
  getApiV2AdminShipmentNotifications: vi.fn(),
  getApiV2AdminOrdersOrderIdShipmentNotificationHistory: vi.fn(),
  postApiV2AdminOrdersOrderIdShipmentNotificationsIdRetry: vi.fn(),
}));
const session = vi.mocked(getServerSession);
const retry = vi.mocked(postApiV2AdminOrdersOrderIdShipmentNotificationsIdRetry);
describe("출고 알림 관리자 액션", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue({ accessToken: "admin-token", user: { roles: ["ROLE_ADMIN"] } });
  });
  it("인증 만료와 일반 회원의 조회·변경 요청을 모두 거부한다", async () => {
    for (const value of [null, { accessToken: "member-token", user: { roles: ["ROLE_USER"] } }]) {
      session.mockResolvedValue(value);
      await expect(loadShipmentNotifications()).rejects.toThrow();
      await expect(loadShipmentNotificationHistory(1)).rejects.toThrow();
      expect((await recoverShipmentNotification(1, { notificationId: 2, reason: "요청" })).success).toBe(false);
    }
    expect(getApiV2AdminShipmentNotifications).not.toHaveBeenCalled();
    expect(getApiV2AdminOrdersOrderIdShipmentNotificationHistory).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
  });
  it("빈 사유와 너무 긴 사유를 거부한다", async () => {
    for (const reason of [" ", "가".repeat(201)]) {
      expect((await recoverShipmentNotification(1, { notificationId: 2, reason })).success).toBe(false);
    }
    expect(retry).not.toHaveBeenCalled();
  });
  it("채널별 재발송 요청은 코드나 변경 연락처를 보내지 않는다", async () => {
    await recoverShipmentNotification(1, { notificationId: 2, reason: "고객 요청" });
    expect(retry).toHaveBeenCalledWith(
      1,
      2,
      { reason: "고객 요청" },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });
  it("발송 ID와 주문 ID 입력을 검증한다", async () => {
    expect((await recoverShipmentNotification(-1, { notificationId: 2, reason: "고객 요청" })).success).toBe(false);
    expect((await recoverShipmentNotification(1, { notificationId: NaN, reason: "고객 요청" })).success).toBe(false);
    expect(retry).not.toHaveBeenCalled();
  });
});
