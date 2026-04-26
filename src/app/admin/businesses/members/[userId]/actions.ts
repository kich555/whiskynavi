"use server";

import {
  postApiAdminBusinessesMembersUseridPickupGrant,
  postApiAdminBusinessesMembersUseridPickupRevoke,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function grantPickupRoleAction(userId: number) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiAdminBusinessesMembersUseridPickupGrant(
      userId,
      withToken(token),
    );
    revalidatePath(`/admin/businesses/members/${userId}`);
    revalidatePath("/admin/businesses/members");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "픽업 권한 부여에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function revokePickupRoleAction(userId: number) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiAdminBusinessesMembersUseridPickupRevoke(
      userId,
      withToken(token),
    );
    revalidatePath(`/admin/businesses/members/${userId}`);
    revalidatePath("/admin/businesses/members");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "픽업 권한 회수에 실패했습니다.";
    return { success: false, error: message };
  }
}
