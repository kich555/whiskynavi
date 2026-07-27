import {
  postApiAdminReservationsBusinessPickupLocationClear,
  putApiAdminReservationsBusinessPickupLocation,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearBusinessPickupSettingAction, updateBusinessPickupSettingAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  postApiAdminReservationsBusinessPickupLocationClear: vi.fn(),
  putApiAdminReservationsBusinessPickupLocation: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("business pickup setting actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthToken).mockResolvedValue("admin-token");
  });

  it("업장 지정 시 사업장과 필수 변경 사유를 전송한다", async () => {
    vi.mocked(putApiAdminReservationsBusinessPickupLocation).mockResolvedValue({
      data: {
        assignmentType: "ADMIN_DESIGNATED",
        businessId: 30,
      },
      status: 200,
      headers: new Headers(),
    });

    await expect(updateBusinessPickupSettingAction(30, "물류센터 변경")).resolves.toMatchObject({
      success: true,
    });
    expect(putApiAdminReservationsBusinessPickupLocation).toHaveBeenCalledWith(
      { businessId: 30, reason: "물류센터 변경" },
      { token: "admin-token" },
    );
  });

  it("해제 사유가 비어 있으면 API를 호출하지 않는다", async () => {
    await expect(clearBusinessPickupSettingAction(" ")).resolves.toEqual({
      success: false,
      error: "변경 사유를 입력해 주세요.",
    });
    expect(postApiAdminReservationsBusinessPickupLocationClear).not.toHaveBeenCalled();
  });
});
