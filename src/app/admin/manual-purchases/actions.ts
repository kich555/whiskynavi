"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  getGetApiAdminOrdersManualPurchasesImportTemplateUrl,
  postApiAdminOrdersManualPurchasesImport,
  type AdminManualPurchaseImportResponse,
  type PostApiAdminOrdersManualPurchasesImportMode,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type ManualPurchaseImportMode = PostApiAdminOrdersManualPurchasesImportMode;

type ManualPurchaseImportActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.whiskynavi.com";
async function fetchAdminBinaryAsBase64(path: string, token: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...withToken(token),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("관리자 파일 다운로드 요청이 실패했습니다.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

export async function downloadManualPurchaseImportTemplateAction(): Promise<
  ManualPurchaseImportActionResult<string>
> {
  try {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "인증이 필요합니다." };

    const data = await fetchAdminBinaryAsBase64(getGetApiAdminOrdersManualPurchasesImportTemplateUrl(), token);
    return { success: true, data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "Excel 템플릿 다운로드에 실패했습니다."),
    };
  }
}

export async function uploadManualPurchaseImportAction(
  file: File,
  mode: ManualPurchaseImportMode,
  dryRun: boolean,
): Promise<ManualPurchaseImportActionResult<AdminManualPurchaseImportResponse>> {
  try {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "인증이 필요합니다." };

    if (!file || file.size === 0) {
      return { success: false, error: "Excel 파일을 선택해주세요." };
    }

    const response = await postApiAdminOrdersManualPurchasesImport(
      { file },
      { mode, dryRun },
      withToken(token),
    );

    revalidatePath("/admin/manual-purchases/import");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/bottle-orders");
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "구매내역 Excel 업로드에 실패했습니다."),
    };
  }
}
