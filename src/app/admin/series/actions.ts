"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  deleteApiV2AdminBottleSeriesSeriesid,
  postApiV2AdminBottleSeries,
  putApiV2AdminBottleSeriesSeriesid,
  type AdminBottleSeriesRequest,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type SeriesFormState = { success: boolean; error?: string };

const optionalText = (v: string) => v.trim() || undefined;

function parseSeriesForm(formData: FormData): AdminBottleSeriesRequest {
  const brand = optionalText((formData.get("brand") as string) ?? "");
  const series = optionalText((formData.get("series") as string) ?? "");
  const description = optionalText((formData.get("description") as string) ?? "");
  const imageKey = optionalText((formData.get("imageKey") as string) ?? "");
  const repIdRaw = (formData.get("representativeBottleId") as string) ?? "";

  if (!brand || !series) {
    throw new Error("브랜드명과 시리즈명은 필수입니다.");
  }

  const repId = Number(repIdRaw);
  return {
    brand,
    series,
    visible: (formData.get("visible") as string) === "on",
    description,
    imageKey,
    representativeBottleId: repIdRaw !== "" && !Number.isNaN(repId) ? repId : undefined,
  };
}

export async function updateSeriesAction(
  id: number,
  _prev: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  let body: AdminBottleSeriesRequest;
  try {
    body = parseSeriesForm(formData);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "입력값을 확인해주세요." };
  }

  try {
    await putApiV2AdminBottleSeriesSeriesid(id, body, withToken(token));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: getUserErrorMessage(error, "시리즈 저장에 실패했습니다.") };
  }

  revalidatePath("/admin/series");
  revalidatePath(`/admin/series/${id}`);
  redirect(`/admin/series/${id}`);
}

export async function createSeriesAction(
  _prev: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  let body: AdminBottleSeriesRequest;
  try {
    body = parseSeriesForm(formData);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "입력값을 확인해주세요." };
  }

  try {
    const res = await postApiV2AdminBottleSeries(body, withToken(token));
    const id = res.data?.id;
    revalidatePath("/admin/series");
    redirect(id ? `/admin/series/${id}` : "/admin/series");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: getUserErrorMessage(error, "시리즈 등록에 실패했습니다.") };
  }
}

export async function deleteSeriesAction(id: number) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }
  try {
    await deleteApiV2AdminBottleSeriesSeriesid(id, withToken(token));
    revalidatePath("/admin/series");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "시리즈 삭제에 실패했습니다."),
    };
  }
}
