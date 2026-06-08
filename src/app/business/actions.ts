"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  deleteApiUsersBusinessesBusinessidMembersUserid,
  patchApiUsersBusinessesMeBusinessidPrimary,
  postApiUsersBusinessesBusinessidMembers,
  postApiUsersBusinessesBusinessidOwnershipTransfer,
  type PostApiUsersBusinessesBusinessidMembersBody,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type BusinessActionResult = {
  success: boolean;
  error?: string;
};

const BUSINESS_REVALIDATE_PATHS = [
  "/business",
  "/business/pickup-reservations",
  "/business/pickup-reservations/applications",
  "/business/statistics",
  "/business/members",
];

async function getOptions(): Promise<RequestInit | null> {
  const token = await getAuthToken();
  return token ? (withToken(token) ?? null) : null;
}

function revalidateBusinessPaths() {
  BUSINESS_REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

export async function setPrimaryBusinessAction(businessId: number): Promise<BusinessActionResult> {
  const options = await getOptions();
  if (!options) return { success: false, error: "인증이 필요합니다." };

  try {
    await patchApiUsersBusinessesMeBusinessidPrimary(businessId, options);
    revalidateBusinessPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "기본 사업장 변경에 실패했습니다."),
    };
  }
}

export async function addBusinessManagerAction(
  businessId: number,
  input: PostApiUsersBusinessesBusinessidMembersBody,
): Promise<BusinessActionResult> {
  const options = await getOptions();
  if (!options) return { success: false, error: "인증이 필요합니다." };

  const email = input.email?.trim();
  const body: PostApiUsersBusinessesBusinessidMembersBody = input.userId != null ? { userId: input.userId } : {};
  if (email) body.email = email;

  if (body.userId == null && !body.email) {
    return { success: false, error: "추가할 사용자 이메일을 입력해 주세요." };
  }

  try {
    await postApiUsersBusinessesBusinessidMembers(businessId, body, options);
    revalidateBusinessPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "매니저 추가에 실패했습니다."),
    };
  }
}

export async function removeBusinessManagerAction(businessId: number, userId: number): Promise<BusinessActionResult> {
  const options = await getOptions();
  if (!options) return { success: false, error: "인증이 필요합니다." };

  try {
    await deleteApiUsersBusinessesBusinessidMembersUserid(businessId, userId, options);
    revalidateBusinessPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "매니저 삭제에 실패했습니다."),
    };
  }
}

export async function transferBusinessOwnershipAction(
  businessId: number,
  targetUserId: number,
): Promise<BusinessActionResult> {
  const options = await getOptions();
  if (!options) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiUsersBusinessesBusinessidOwnershipTransfer(businessId, { targetUserId }, options);
    revalidateBusinessPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "소유권 이전에 실패했습니다."),
    };
  }
}
