import { postApiAdminOrdersUsersUseridManualPurchases } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createManualPurchaseAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  postApiAdminOrdersUsersUseridManualPurchases: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: (token: string | null) => ({ headers: { Authorization: `Bearer ${token}` } }),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedCreateManualPurchase = vi.mocked(postApiAdminOrdersUsersUseridManualPurchases);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("createManualPurchaseAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("token");
    mockedCreateManualPurchase.mockResolvedValue({ data: {}, status: 200, headers: new Headers() });
  });

  it("비정상 payload는 API 호출 없이 입력 오류를 반환한다", async () => {
    const result = await createManualPurchaseAction(10, null as never);

    expect(result).toEqual({ success: false, error: "보틀을 선택해 주세요." });
    expect(mockedCreateManualPurchase).not.toHaveBeenCalled();
  });

  it("정상 payload를 생성 API로 전달하고 사용자 상세를 갱신한다", async () => {
    const result = await createManualPurchaseAction(10, {
      bottleId: 20,
      unitPrice: 150000,
      requestedQuantity: 2,
      orderNote: "  현장 구매  ",
    });

    expect(result).toEqual({ success: true });
    expect(mockedCreateManualPurchase).toHaveBeenCalledWith(
      10,
      {
        bottleId: 20,
        unitPrice: 150000,
        requestedQuantity: 2,
        orderNote: "현장 구매",
      },
      { headers: { Authorization: "Bearer token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/users/10");
  });
});
