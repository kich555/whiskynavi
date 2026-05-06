"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  patchApiAdminBusinessesMembersUseridBusiness,
  postApiAdminBusinessesMembersUseridRolesRoleGrant,
  postApiAdminBusinessesMembersUseridRolesRoleRevoke,
  type PatchApiAdminBusinessesMembersUseridBusinessBody,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type BusinessMemberActionResult = {
  success: boolean;
  error?: string;
};

export type UpdateBusinessInput = PatchApiAdminBusinessesMembersUseridBusinessBody;

async function getAuthorizedOptions() {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  return withToken(token);
}

function revalidateBusinessMemberPaths(userId: number) {
  revalidatePath(`/admin/businesses/members/${userId}`);
  revalidatePath("/admin/businesses/members");
}

export async function updateBusinessAction(
  userId: number,
  input: UpdateBusinessInput,
): Promise<BusinessMemberActionResult> {
  const options = await getAuthorizedOptions();

  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await patchApiAdminBusinessesMembersUseridBusiness(userId, input, options);
    revalidateBusinessMemberPaths(userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "사업자 정보 수정에 실패했습니다."),
    };
  }
}

export async function grantPickupRoleAction(userId: number): Promise<BusinessMemberActionResult> {
  const options = await getAuthorizedOptions();

  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBusinessesMembersUseridRolesRoleGrant(userId, "ROLE_PICK_UP_BUSINESS", options);
    revalidateBusinessMemberPaths(userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "픽업 권한 부여에 실패했습니다."),
    };
  }
}

export async function revokePickupRoleAction(userId: number): Promise<BusinessMemberActionResult> {
  const options = await getAuthorizedOptions();

  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBusinessesMembersUseridRolesRoleRevoke(userId, "ROLE_PICK_UP_BUSINESS", options);
    revalidateBusinessMemberPaths(userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "픽업 권한 회수에 실패했습니다."),
    };
  }
}
