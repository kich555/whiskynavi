import { ApiError } from "@/apis/errors";
import { getApiAdminSalesSaleid, patchApiAdminSalesSaleid } from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateGeneralItemSale } from "./actions";

vi.mock("@/apis/generated/api", () => ({ getApiAdminSalesSaleid: vi.fn(), patchApiAdminSalesSaleid: vi.fn() }));
vi.mock("@/apis/mutator", () => ({
  withToken: (token: string) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const sale = {
  id: 3,
  productType: "ITEM" as const,
  saleType: "GENERAL" as const,
  title: "공고",
  totalQuantity: 10,
  availableQuantity: 5,
};
function form(stock = false) {
  const data = new FormData();
  Object.entries({
    title: "수정 공고",
    salePrice: "5000",
    saleStatus: "OPEN",
    saleStartAt: "2026-10-01T10:00",
    saleEndAt: "2026-10-02T10:00",
  }).forEach(([key, value]) => data.set(key, value));
  if (stock)
    Object.entries({
      adjustStock: "on",
      totalQuantity: "12",
      availableQuantity: "7",
      expectedAvailableQuantity: "5",
      stockAdjustmentReason: "추가 입고",
    }).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ accessToken: "test-token", user: { roles: ["ROLE_ADMIN"] } });
  vi.mocked(getApiAdminSalesSaleid).mockResolvedValue({ data: sale, status: 200, headers: new Headers() });
  vi.mocked(patchApiAdminSalesSaleid).mockResolvedValue({ data: sale, status: 200, headers: new Headers() });
});
describe("일반상품 공고 수정", () => {
  it("일반 정보 수정은 재고 필드를 전송하지 않는다", async () => {
    expect((await updateGeneralItemSale(3, form())).success).toBe(true);
    const body = vi.mocked(patchApiAdminSalesSaleid).mock.calls[0][1];
    expect(body).not.toHaveProperty("availableQuantity");
    expect(body).not.toHaveProperty("totalQuantity");
    expect(body.orderableRoles).toEqual([]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/general-item-sales/3");
    expect(revalidatePath).toHaveBeenCalledWith("/general-items/3");
  });
  it("수량 변경은 화면에서 조회한 수량과 사유를 보내며 최신 조회값으로 바꾸지 않는다", async () => {
    vi.mocked(getApiAdminSalesSaleid).mockResolvedValue({
      data: { ...sale, availableQuantity: 4 },
      status: 200,
      headers: new Headers(),
    });
    await updateGeneralItemSale(3, form(true));
    expect(patchApiAdminSalesSaleid).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        availableQuantity: 7,
        totalQuantity: 12,
        expectedAvailableQuantity: 5,
        stockAdjustmentReason: "추가 입고",
      }),
      expect.anything(),
    );
  });
  it.each([null, { user: { roles: ["ROLE_ADMIN"] } }, { accessToken: "token", user: { roles: ["ROLE_USER"] } }])(
    "인증이나 권한이 없으면 수정하지 않는다",
    async (session) => {
      vi.mocked(getServerSession).mockResolvedValue(session);
      expect((await updateGeneralItemSale(3, form())).success).toBe(false);
      expect(patchApiAdminSalesSaleid).not.toHaveBeenCalled();
      expect(getApiAdminSalesSaleid).not.toHaveBeenCalled();
    },
  );
  it("다른 유형의 공고를 수정하지 않는다", async () => {
    vi.mocked(getApiAdminSalesSaleid).mockResolvedValue({
      data: { ...sale, saleType: "RESERVATION" },
      status: 200,
      headers: new Headers(),
    });
    expect((await updateGeneralItemSale(3, form())).success).toBe(false);
    expect(patchApiAdminSalesSaleid).not.toHaveBeenCalled();
  });
  it.each(["expectedAvailableQuantity", "stockAdjustmentReason"])("재고 변경 필수값 %s를 검증한다", async (field) => {
    const data = form(true);
    data.delete(field);
    expect((await updateGeneralItemSale(3, data)).success).toBe(false);
    expect(patchApiAdminSalesSaleid).not.toHaveBeenCalled();
  });
  it("재고 충돌 오류를 사용자에게 돌려준다", async () => {
    vi.mocked(patchApiAdminSalesSaleid).mockRejectedValue(
      new ApiError(400, JSON.stringify({ message: "재고가 변경되었습니다. 새로 조회해 주세요." })),
    );
    expect(await updateGeneralItemSale(3, form(true))).toMatchObject({
      success: false,
      error: "재고가 변경되었습니다. 새로 조회해 주세요.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it("역전된 판매 기간을 거부한다", async () => {
    const data = form();
    data.set("saleEndAt", "2026-09-01T10:00");
    expect((await updateGeneralItemSale(3, data)).success).toBe(false);
    expect(patchApiAdminSalesSaleid).not.toHaveBeenCalled();
  });
});
