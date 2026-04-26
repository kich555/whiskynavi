"use server";

import {
  postApiAdminBusinessesApplicationsApplicationidApprove,
  postApiAdminBusinessesApplicationsApplicationidReject,
  type PostApiAdminBusinessesApplicationsApplicationidRejectBody,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveApplicationAction(applicationId: number) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiAdminBusinessesApplicationsApplicationidApprove(
      applicationId,
      withToken(token),
    );
    revalidatePath(`/admin/businesses/applications/${applicationId}`);
    revalidatePath("/admin/businesses/applications");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "승인에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function rejectApplicationAction(
  applicationId: number,
  data: PostApiAdminBusinessesApplicationsApplicationidRejectBody,
) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiAdminBusinessesApplicationsApplicationidReject(
      applicationId,
      data,
      withToken(token),
    );
    revalidatePath(`/admin/businesses/applications/${applicationId}`);
    revalidatePath("/admin/businesses/applications");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "반려에 실패했습니다.";
    return { success: false, error: message };
  }
}
