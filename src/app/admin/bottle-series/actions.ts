"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  deleteApiV2AdminBottleSeriesSeriesid,
  postApiAdminImagesPurpose,
  postApiV2AdminBottleSeries,
  putApiV2AdminBottleSeriesSeriesid,
  type AdminBottleSeriesResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { getImageValidationError } from "@/lib/image-upload";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { MAX_BOTTLE_IMAGE_SIZE_MB } from "../products/image-constraints";

export type BottleSeriesFormState = {
  success: boolean;
  error?: string;
  data?: AdminBottleSeriesResponse;
};

export type BottleSeriesDeleteResult = {
  success: boolean;
  error?: string;
};

const optionalText = z
  .string()
  .transform((value) => value.trim() || undefined)
  .optional();

const bottleSeriesSchema = z.object({
  brand: z.string().trim().min(1, "브랜드명은 필수입니다.").max(50, "브랜드명은 최대 50자까지 입력 가능합니다."),
  series: z.string().trim().min(1, "시리즈명은 필수입니다.").max(50, "시리즈명은 최대 50자까지 입력 가능합니다."),
  description: optionalText,
  imageKey: z
    .string()
    .trim()
    .max(500, "이미지 키는 최대 500자까지 입력 가능합니다.")
    .transform((value) => value || undefined),
  representativeBottleId: z
    .string()
    .trim()
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => value === undefined || (Number.isInteger(value) && value > 0), {
      message: "대표 보틀 ID는 1 이상의 정수로 입력해주세요.",
    }),
  visible: z.boolean(),
});

function extractUploadedKey(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const response = data as Record<string, unknown>;
  for (const key of ["key", "s3Key", "objectKey"]) {
    const value = response[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

async function resolveImageKey(formData: FormData, token: string, currentKey?: string) {
  const imageFile = formData.get("imageFile");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return formData.get("removeImage") === "on" ? undefined : currentKey;
  }

  const uploaded = await postApiAdminImagesPurpose("BOTTLE", { file: imageFile }, withToken(token));
  const imageKey = extractUploadedKey(uploaded.data);
  if (!imageKey) throw new Error("업로드된 이미지 키를 확인할 수 없습니다.");
  return imageKey;
}

export async function saveBottleSeriesAction(
  seriesId: number | null,
  _previousState: BottleSeriesFormState,
  formData: FormData,
): Promise<BottleSeriesFormState> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  if (seriesId !== null && (!Number.isInteger(seriesId) || seriesId <= 0)) {
    return { success: false, error: "보틀 시리즈 ID가 올바르지 않습니다." };
  }

  const parsed = bottleSeriesSchema.safeParse({
    brand: formData.get("brand") ?? "",
    series: formData.get("series") ?? "",
    description: formData.get("description") ?? "",
    imageKey: formData.get("imageKey") ?? "",
    representativeBottleId: formData.get("representativeBottleId") ?? "",
    visible: formData.get("visible") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
    };
  }

  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    const validationError = getImageValidationError(imageFile, MAX_BOTTLE_IMAGE_SIZE_MB);
    if (validationError) return { success: false, error: validationError };
  }

  try {
    const imageKey = await resolveImageKey(formData, token, parsed.data.imageKey);
    const body = {
      brand: parsed.data.brand,
      series: parsed.data.series,
      description: parsed.data.description,
      imageKey,
      representativeBottleId: parsed.data.representativeBottleId,
      visible: parsed.data.visible,
    };
    const response =
      seriesId === null
        ? await postApiV2AdminBottleSeries(body, withToken(token))
        : await putApiV2AdminBottleSeriesSeriesid(seriesId, body, withToken(token));

    revalidatePath("/admin/bottle-series");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(
        error,
        seriesId === null ? "보틀 시리즈 등록에 실패했습니다." : "보틀 시리즈 수정에 실패했습니다.",
      ),
    };
  }
}

export async function deleteBottleSeriesAction(seriesId: number): Promise<BottleSeriesDeleteResult> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };
  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return { success: false, error: "보틀 시리즈 ID가 올바르지 않습니다." };
  }

  try {
    await deleteApiV2AdminBottleSeriesSeriesid(seriesId, withToken(token));
    revalidatePath("/admin/bottle-series");
    return { success: true };
  } catch (error) {
    return { success: false, error: getUserErrorMessage(error, "보틀 시리즈 삭제에 실패했습니다.") };
  }
}
