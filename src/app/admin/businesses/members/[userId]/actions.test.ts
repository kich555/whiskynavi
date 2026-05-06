import { ApiError } from "@/apis/errors";
import {
  patchApiAdminBusinessesMembersUseridBusiness,
  postApiAdminBusinessesMembersUseridRolesRoleGrant,
  postApiAdminBusinessesMembersUseridRolesRoleRevoke,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { grantPickupRoleAction, revokePickupRoleAction, updateBusinessAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  patchApiAdminBusinessesMembersUseridBusiness: vi.fn(),
  postApiAdminBusinessesMembersUseridRolesRoleGrant: vi.fn(),
  postApiAdminBusinessesMembersUseridRolesRoleRevoke: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn(() => ({ headers: { Authorization: "Bearer mocked" } })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedPatchBusiness = vi.mocked(patchApiAdminBusinessesMembersUseridBusiness);
const mockedGrantPickup = vi.mocked(postApiAdminBusinessesMembersUseridRolesRoleGrant);
const mockedRevokePickup = vi.mocked(postApiAdminBusinessesMembersUseridRolesRoleRevoke);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedWithToken = vi.mocked(withToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("admin business member actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("token");
  });

  it("returns auth error when update is called without token", async () => {
    mockedGetAuthToken.mockResolvedValue(undefined);

    await expect(
      updateBusinessAction(10, {
        businessName: "테스트 주류",
        businessRegistrationNumber: "123-45-67890",
        businessType: "HOUSEHOLD",
        contact: "010-1234-5678",
        pickupAddress: "서울시 강남구",
      }),
    ).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });

    expect(mockedPatchBusiness).not.toHaveBeenCalled();
  });

  it("calls patch api and revalidates both paths on update success", async () => {
    mockedPatchBusiness.mockResolvedValue({
      data: { userId: 10 },
      status: 200,
      headers: new Headers(),
    });

    await expect(
      updateBusinessAction(10, {
        businessName: "수정된 상호",
        businessRegistrationNumber: "123-45-67890",
        businessType: "ENTERTAINMENT",
        contact: "",
        pickupAddress: "서울시 송파구",
      }),
    ).resolves.toEqual({ success: true });

    expect(mockedWithToken).toHaveBeenCalledWith("token");
    expect(mockedPatchBusiness).toHaveBeenCalledWith(
      10,
      {
        businessName: "수정된 상호",
        businessRegistrationNumber: "123-45-67890",
        businessType: "ENTERTAINMENT",
        contact: "",
        pickupAddress: "서울시 송파구",
      },
      { headers: { Authorization: "Bearer mocked" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/businesses/members/10");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/businesses/members");
    expect(mockedRevalidatePath).toHaveBeenCalledTimes(2);
  });

  it("returns fallback message when update fails unexpectedly", async () => {
    mockedPatchBusiness.mockRejectedValue(new Error("boom"));

    await expect(
      updateBusinessAction(10, {
        businessName: "수정된 상호",
        businessRegistrationNumber: "123-45-67890",
        businessType: "HOUSEHOLD",
        contact: "010-1234-5678",
        pickupAddress: "서울시 강남구",
      }),
    ).resolves.toEqual({
      success: false,
      error: "사업자 정보 수정에 실패했습니다.",
    });
  });

  it("returns backend user message when update api throws ApiError", async () => {
    mockedPatchBusiness.mockRejectedValue(new ApiError(400, '{"message":"사업자등록번호 형식이 올바르지 않습니다."}'));

    await expect(
      updateBusinessAction(10, {
        businessName: "수정된 상호",
        businessRegistrationNumber: "invalid",
        businessType: "HOUSEHOLD",
        contact: "010-1234-5678",
        pickupAddress: "서울시 강남구",
      }),
    ).resolves.toEqual({
      success: false,
      error: "사업자등록번호 형식이 올바르지 않습니다.",
    });
  });

  it("calls grant api and revalidates on success", async () => {
    mockedGrantPickup.mockResolvedValue({
      data: {},
      status: 200,
      headers: new Headers(),
    });

    await expect(grantPickupRoleAction(10)).resolves.toEqual({ success: true });

    expect(mockedGrantPickup).toHaveBeenCalledWith(10, "ROLE_PICK_UP_BUSINESS", {
      headers: { Authorization: "Bearer mocked" },
    });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/businesses/members/10");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/businesses/members");
    expect(mockedRevalidatePath).toHaveBeenCalledTimes(2);
  });

  it("returns auth error when grant is called without token", async () => {
    mockedGetAuthToken.mockResolvedValue(undefined);

    await expect(grantPickupRoleAction(10)).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });

    expect(mockedGrantPickup).not.toHaveBeenCalled();
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns fallback message when grant fails unexpectedly", async () => {
    mockedGrantPickup.mockRejectedValue("boom");

    await expect(grantPickupRoleAction(10)).resolves.toEqual({
      success: false,
      error: "픽업 권한 부여에 실패했습니다.",
    });

    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns backend user message when grant api throws ApiError", async () => {
    mockedGrantPickup.mockRejectedValue(new ApiError(409, '{"message":"이미 처리된 요청입니다."}'));

    await expect(grantPickupRoleAction(10)).resolves.toEqual({
      success: false,
      error: "이미 처리된 요청입니다.",
    });

    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("calls revoke api and revalidates on success", async () => {
    mockedRevokePickup.mockResolvedValue({
      data: {},
      status: 200,
      headers: new Headers(),
    });

    await expect(revokePickupRoleAction(10)).resolves.toEqual({
      success: true,
    });

    expect(mockedRevokePickup).toHaveBeenCalledWith(10, "ROLE_PICK_UP_BUSINESS", {
      headers: { Authorization: "Bearer mocked" },
    });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/businesses/members/10");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/businesses/members");
    expect(mockedRevalidatePath).toHaveBeenCalledTimes(2);
  });

  it("returns auth error when revoke is called without token", async () => {
    mockedGetAuthToken.mockResolvedValue(undefined);

    await expect(revokePickupRoleAction(10)).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });

    expect(mockedRevokePickup).not.toHaveBeenCalled();
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns fallback message when revoke fails unexpectedly", async () => {
    mockedRevokePickup.mockRejectedValue("boom");

    await expect(revokePickupRoleAction(10)).resolves.toEqual({
      success: false,
      error: "픽업 권한 회수에 실패했습니다.",
    });

    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns backend user message when revoke api throws ApiError", async () => {
    mockedRevokePickup.mockRejectedValue(new ApiError(409, '{"message":"이미 처리된 요청입니다."}'));

    await expect(revokePickupRoleAction(10)).resolves.toEqual({
      success: false,
      error: "이미 처리된 요청입니다.",
    });

    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });
});
