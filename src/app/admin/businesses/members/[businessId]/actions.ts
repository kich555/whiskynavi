"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  patchApiAdminBusinessesBusinessesBusinessid,
  postApiAdminBusinessesBusinessesBusinessidRolesRoleGrant,
  postApiAdminBusinessesBusinessesBusinessidRolesRoleRevoke,
  type PatchApiAdminBusinessesBusinessesBusinessidBody,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type BusinessMemberActionResult = {
  success: boolean;
  error?: string;
};

export type UpdateBusinessInput = PatchApiAdminBusinessesBusinessesBusinessidBody;
export type BusinessMemberRole = Extract<
  Parameters<typeof postApiAdminBusinessesBusinessesBusinessidRolesRoleGrant>[1],
  "ROLE_BUSINESS" | "ROLE_TRAILNTALE_BUSINESS" | "ROLE_COMMUNITY_BUSINESS" | "ROLE_PICK_UP_BUSINESS"
>;

async function getAuthorizedOptions() {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  return withToken(token);
}

function revalidateBusinessMemberPaths(businessId: number) {
  revalidatePath(`/admin/businesses/members/${businessId}`);
  revalidatePath("/admin/businesses/members");
}

export async function updateBusinessAction(
  businessId: number,
  input: UpdateBusinessInput,
): Promise<BusinessMemberActionResult> {
  const options = await getAuthorizedOptions();

  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await patchApiAdminBusinessesBusinessesBusinessid(businessId, input, options);
    revalidateBusinessMemberPaths(businessId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "사업자 정보 수정에 실패했습니다."),
    };
  }
}

export async function grantPickupRoleAction(businessId: number): Promise<BusinessMemberActionResult> {
  return grantBusinessRoleAction(businessId, "ROLE_PICK_UP_BUSINESS");
}

export async function revokePickupRoleAction(businessId: number): Promise<BusinessMemberActionResult> {
  return revokeBusinessRoleAction(businessId, "ROLE_PICK_UP_BUSINESS");
}

export async function grantBusinessRoleAction(
  businessId: number,
  role: BusinessMemberRole,
): Promise<BusinessMemberActionResult> {
  const options = await getAuthorizedOptions();

  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBusinessesBusinessesBusinessidRolesRoleGrant(businessId, role, options);
    revalidateBusinessMemberPaths(businessId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "사업자 권한 부여에 실패했습니다."),
    };
  }
}

export async function revokeBusinessRoleAction(
  businessId: number,
  role: BusinessMemberRole,
): Promise<BusinessMemberActionResult> {
  const options = await getAuthorizedOptions();

  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBusinessesBusinessesBusinessidRolesRoleRevoke(businessId, role, options);
    revalidateBusinessMemberPaths(businessId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "사업자 권한 회수에 실패했습니다."),
    };
  }
}
