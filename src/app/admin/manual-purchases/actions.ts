"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  getGetApiAdminOrdersManualPurchasesImportTemplateUrl,
  postApiAdminOrdersManualPurchasesImport,
  type AdminManualPurchaseImportResponse,
  type AdminManualPurchaseImportResponseMode,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type ManualPurchaseImportMode = AdminManualPurchaseImportResponseMode;

type ManualPurchaseImportActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.whiskynavi.com";
const MANUAL_PURCHASE_IMPORT_MODES = new Set<ManualPurchaseImportMode>([
  "ONE_USER_MANY_BOTTLES",
  "ONE_BOTTLE_MANY_USERS",
  "MANY_USERS_MANY_BOTTLES",
]);

function normalizeMode(mode: string): ManualPurchaseImportMode {
  return MANUAL_PURCHASE_IMPORT_MODES.has(mode as ManualPurchaseImportMode)
    ? (mode as ManualPurchaseImportMode)
    : "MANY_USERS_MANY_BOTTLES";
}

function isXlsxFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx");
}

export async function downloadManualPurchaseImportTemplateAction(): Promise<
  ManualPurchaseImportActionResult<string>
> {
  try {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "인증이 필요합니다." };

    const response = await fetch(`${API_BASE_URL}${getGetApiAdminOrdersManualPurchasesImportTemplateUrl()}`, {
      ...withToken(token),
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Excel 템플릿 다운로드에 실패했습니다." };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { success: true, data: buffer.toString("base64") };
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
  mode: string,
  dryRun: boolean,
): Promise<ManualPurchaseImportActionResult<AdminManualPurchaseImportResponse>> {
  try {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "인증이 필요합니다." };

    if (!file || file.size === 0) {
      return { success: false, error: "Excel 파일을 선택해주세요." };
    }
    if (!isXlsxFile(file)) {
      return { success: false, error: "xlsx Excel 파일만 업로드할 수 있습니다." };
    }

    const response = await postApiAdminOrdersManualPurchasesImport(
      { file },
      { mode: normalizeMode(mode), dryRun },
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
