import { putApiAdminShippingPolicy } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateShippingPolicyAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  putApiAdminShippingPolicy: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedUpdate = vi.mocked(putApiAdminShippingPolicy);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

function formDataFrom(entries: Record<string, string>) {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

describe("updateShippingPolicyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
  });

  it("rejects negative baseShippingFee and does not call update", async () => {
    const result = await updateShippingPolicyAction(
      { success: false },
      formDataFrom({
        enabled: "on",
        baseShippingFee: "-1",
        freeShippingThreshold: "50000",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "기본 배송비는 0원 이상이어야 합니다.",
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects negative freeShippingThreshold with the policy message", async () => {
    const result = await updateShippingPolicyAction(
      { success: false },
      formDataFrom({
        enabled: "on",
        baseShippingFee: "3000",
        freeShippingThreshold: "-1",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "무료배송 기준 금액은 0원 이상이어야 합니다.",
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects non-numeric freeShippingThreshold and does not call update", async () => {
    const result = await updateShippingPolicyAction(
      { success: false },
      formDataFrom({
        enabled: "on",
        baseShippingFee: "3000",
        freeShippingThreshold: "abc",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "무료배송 기준 금액을 입력해 주세요.",
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects decimal baseShippingFee and does not call update", async () => {
    const result = await updateShippingPolicyAction(
      { success: false },
      formDataFrom({
        enabled: "on",
        baseShippingFee: "3000.5",
        freeShippingThreshold: "50000",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "기본 배송비는 원 단위 정수로 입력해 주세요.",
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("calls update with parsed policy, auth header, and revalidates path", async () => {
    mockedUpdate.mockResolvedValue({
      data: {
        enabled: true,
        baseShippingFee: 3000,
        freeShippingThreshold: 50000,
      },
      status: 200,
      headers: new Headers(),
    });

    const result = await updateShippingPolicyAction(
      { success: false },
      formDataFrom({
        enabled: "on",
        baseShippingFee: "3000",
        freeShippingThreshold: "50000",
      }),
    );

    expect(result).toEqual({
      success: true,
      data: {
        enabled: true,
        baseShippingFee: 3000,
        freeShippingThreshold: 50000,
      },
    });
    expect(mockedUpdate).toHaveBeenCalledWith(
      {
        enabled: true,
        baseShippingFee: 3000,
        freeShippingThreshold: 50000,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/shipping-policy");
  });
});
