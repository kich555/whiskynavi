import { postApiV2AdminOrdersOrderIdEntitlementsIdUse } from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { beforeEach, expect, it, vi } from "vitest";
import { markServiceEntitlementUsed } from "./entitlement-actions";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/apis/generated/api", () => ({
  getApiV2AdminOrdersOrderIdEntitlements: vi.fn(),
  postApiV2AdminOrdersOrderIdEntitlementsIdUse: vi.fn(),
}));
vi.mock("@/apis/mutator", () => ({
  withToken: (token: string) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("인증 만료와 일반 회원의 관리자 사용 요청을 API 호출 전에 거부한다", async () => {
  vi.mocked(getServerSession)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ accessToken: "token", user: { roles: ["ROLE_USER"] } });
  expect((await markServiceEntitlementUsed(10, 1, "확인")).success).toBe(false);
  expect((await markServiceEntitlementUsed(10, 1, "확인")).success).toBe(false);
  expect(postApiV2AdminOrdersOrderIdEntitlementsIdUse).not.toHaveBeenCalled();
});
it("관리자 요청은 유효한 ID와 사유를 검증한다", async () => {
  vi.mocked(getServerSession).mockResolvedValue({ accessToken: "token", user: { roles: ["ROLE_ADMIN"] } });
  expect((await markServiceEntitlementUsed(10, 1, " ")).success).toBe(false);
  expect((await markServiceEntitlementUsed(-1, 1, "확인")).success).toBe(false);
  expect(postApiV2AdminOrdersOrderIdEntitlementsIdUse).not.toHaveBeenCalled();
  expect((await markServiceEntitlementUsed(10, 1, " 입장 확인 ")).success).toBe(true);
  expect(postApiV2AdminOrdersOrderIdEntitlementsIdUse).toHaveBeenCalledWith(
    10,
    1,
    { reason: "입장 확인" },
    expect.objectContaining({ headers: { Authorization: "Bearer token" } }),
  );
});
