import {
  postApiV2AdminOrdersOrderIdAfterSalesCaseIdRefunds,
  postApiV2AdminOrdersOrderIdAfterSalesCaseIdRestock,
} from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { beforeEach, expect, it, vi } from "vitest";
import { mutateAfterSale } from "./after-sale-actions";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/apis/mutator", () => ({
  withToken: (token: string) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));
vi.mock("@/apis/generated/api", () => ({
  getApiV2AdminOrdersOrderIdAfterSales: vi.fn(),
  postApiV2AdminOrdersOrderIdAfterSales: vi.fn(),
  patchApiV2AdminOrdersOrderIdAfterSalesCaseId: vi.fn(),
  postApiV2AdminOrdersOrderIdAfterSalesCaseIdRefunds: vi.fn(),
  postApiV2AdminOrdersOrderIdAfterSalesCaseIdRestock: vi.fn(),
  postApiV2AdminOrdersOrderIdRefundsRequestKeyRetry: vi.fn(),
}));
const requestKey = "12345678-1234-4234-8234-123456789abc";
beforeEach(() => vi.clearAllMocks());
it("인증 만료·일반 회원의 환불과 재고 변경을 거부한다", async () => {
  for (const session of [null, { accessToken: "token", user: { roles: ["ROLE_USER"] } }]) {
    vi.mocked(getServerSession).mockResolvedValue(session);
    expect(
      (await mutateAfterSale(1, { kind: "refund", caseId: 2, amount: 100, reason: "환불", requestKey })).success,
    ).toBe(false);
    expect(
      (
        await mutateAfterSale(1, {
          kind: "restore",
          caseId: 2,
          orderItemId: 3,
          quantity: 1,
          reason: "검수",
          requestKey,
        })
      ).success,
    ).toBe(false);
  }
  expect(postApiV2AdminOrdersOrderIdAfterSalesCaseIdRefunds).not.toHaveBeenCalled();
  expect(postApiV2AdminOrdersOrderIdAfterSalesCaseIdRestock).not.toHaveBeenCalled();
});
it("관리자 금액·요청키 검증 후 원 요청키로 호출한다", async () => {
  vi.mocked(getServerSession).mockResolvedValue({ accessToken: "token", user: { roles: ["ROLE_ADMIN"] } });
  expect((await mutateAfterSale(1, { kind: "refund", caseId: 2, amount: 0, reason: "사유", requestKey })).success).toBe(
    false,
  );
  expect(postApiV2AdminOrdersOrderIdAfterSalesCaseIdRefunds).not.toHaveBeenCalled();
  expect(
    (await mutateAfterSale(1, { kind: "refund", caseId: 2, amount: 1234, reason: " 사유 ", requestKey })).success,
  ).toBe(true);
  expect(postApiV2AdminOrdersOrderIdAfterSalesCaseIdRefunds).toHaveBeenCalledWith(
    1,
    2,
    { amount: 1234, reason: "사유", requestKey },
    expect.objectContaining({ headers: { Authorization: "Bearer token" } }),
  );
});
