import { getApiV2AdminServiceEntitlements } from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { beforeEach, expect, it, vi } from "vitest";
import { loadServiceEntitlements } from "./actions";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/apis/generated/api", () => ({ getApiV2AdminServiceEntitlements: vi.fn() }));
vi.mock("@/apis/mutator", () => ({
  withToken: (token: string) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));
vi.mock("@/apis/errors", () => ({ getUserErrorMessage: (_e: unknown, fallback: string) => fallback }));
beforeEach(() => vi.resetAllMocks());
it("관리자 인증 없이는 전체 이용권 정보를 조회하지 않는다", async () => {
  vi.mocked(getServerSession)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ accessToken: "token", user: { roles: ["ROLE_USER"] } });
  expect((await loadServiceEntitlements({})).success).toBe(false);
  expect((await loadServiceEntitlements({})).success).toBe(false);
  expect(getApiV2AdminServiceEntitlements).not.toHaveBeenCalled();
});
it("필터·페이지 커서를 검증하고 인증된 요청을 전달한다", async () => {
  vi.mocked(getServerSession).mockResolvedValue({ accessToken: "token", user: { roles: ["ROLE_ADMIN"] } });
  for (const params of [
    { status: "UNKNOWN" },
    { status: "__proto__" },
    { entitlementId: "-1" },
    { orderId: "1.5" },
    { beforeId: "0" },
    { keyword: "가".repeat(101) },
  ]) {
    expect((await loadServiceEntitlements(params)).success).toBe(false);
  }
  expect(getApiV2AdminServiceEntitlements).not.toHaveBeenCalled();
  vi.mocked(getApiV2AdminServiceEntitlements).mockResolvedValue({
    data: { items: [], hasMore: false },
    status: 200,
    headers: new Headers(),
  });
  expect(
    (
      await loadServiceEntitlements({
        keyword: " 입장권 ",
        status: "EXPIRED",
        beforeId: "51",
        orderId: "10",
        entitlementId: "50",
      })
    ).success,
  ).toBe(true);
  expect(getApiV2AdminServiceEntitlements).toHaveBeenCalledWith(
    { keyword: "입장권", status: "EXPIRED", beforeId: 51, orderId: 10, entitlementId: 50 },
    expect.objectContaining({ cache: "no-store", headers: { Authorization: "Bearer token" } }),
  );
});
it("API 실패를 빈 목록으로 숨기지 않는다", async () => {
  vi.mocked(getServerSession).mockResolvedValue({ accessToken: "token", user: { roles: ["ROLE_ADMIN"] } });
  vi.mocked(getApiV2AdminServiceEntitlements).mockRejectedValue(new Error("offline"));
  expect(await loadServiceEntitlements({})).toEqual({
    success: false,
    error: "이용권 목록을 불러오지 못했습니다. 다시 시도해 주세요.",
  });
});
