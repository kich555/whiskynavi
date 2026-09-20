import { postApiV2OrdersEntitlementsUse } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, expect, it, vi } from "vitest";
import { completeMyServiceEntitlement } from "./entitlement-actions";
vi.mock("@/apis/generated/api", () => ({
  postApiV2OrdersEntitlementsLookup: vi.fn(),
  postApiV2OrdersEntitlementsUse: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getAuthToken: vi.fn() }));
vi.mock("@/apis/mutator", () => ({ withToken: (token: string) => ({ headers: { Authorization: token } }) }));
vi.mock("@/apis/errors", () => ({ getUserErrorMessage: (_error: unknown, fallback: string) => fallback }));
beforeEach(() => vi.resetAllMocks());
it("인증이나 조회 코드가 없거나 식별자가 잘못되면 호출하지 않는다", async () => {
  vi.mocked(getAuthToken).mockResolvedValue(undefined);
  expect((await completeMyServiceEntitlement(10, 1)).success).toBe(false);
  expect((await completeMyServiceEntitlement(-1, 1, "code")).success).toBe(false);
  expect((await completeMyServiceEntitlement(10, 0, "code")).success).toBe(false);
  expect(postApiV2OrdersEntitlementsUse).not.toHaveBeenCalled();
});
it("회원 인증과 비회원 코드를 백엔드에 전달한다", async () => {
  vi.mocked(getAuthToken).mockResolvedValue("token");
  expect((await completeMyServiceEntitlement(10, 1)).success).toBe(true);
  expect(postApiV2OrdersEntitlementsUse).toHaveBeenLastCalledWith(
    { orderId: 10, entitlementId: 1, guestOrderToken: undefined },
    expect.objectContaining({ headers: { Authorization: "token" } }),
  );
  vi.mocked(getAuthToken).mockResolvedValue(undefined);
  expect((await completeMyServiceEntitlement(10, 2, "code")).success).toBe(true);
  expect(postApiV2OrdersEntitlementsUse).toHaveBeenLastCalledWith(
    { orderId: 10, entitlementId: 2, guestOrderToken: "code" },
    expect.anything(),
  );
});
it("권한 거부나 만료 오류를 성공으로 숨기지 않는다", async () => {
  vi.mocked(getAuthToken).mockResolvedValue("token");
  vi.mocked(postApiV2OrdersEntitlementsUse).mockRejectedValue(new Error("denied"));
  expect(await completeMyServiceEntitlement(10, 1)).toEqual({
    success: false,
    error: "사용 완료 처리에 실패했습니다.",
  });
});
