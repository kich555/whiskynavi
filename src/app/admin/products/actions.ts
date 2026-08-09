"use server";

import { ApiError, getUserErrorMessage } from "@/apis/errors";
import {
  deleteApiAdminBottlesId,
  patchApiAdminBottlesId,
  patchApiV2AdminBottlesBottleidManualPurchasesStatus,
  postApiAdminBottles,
  postApiAdminImagesPurpose,
  type AdminManualPurchaseBulkStatusUpdateRequestOrderStatus,
  type PostApiAdminBottlesBodyExtraInfos,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { getImageValidationError } from "@/lib/image-upload";
import { richTextHasContent, sanitizeRichTextContent } from "@/lib/rich-text";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { MAX_BOTTLE_IMAGE_SIZE_MB } from "./image-constraints";

function logActionError(label: string, error: unknown) {
  if (error instanceof ApiError) {
    console.error(`[${label}] ApiError`, {
      status: error.status,
      detail: error.detail,
      userMessage: error.userMessage,
    });
    return;
  }
  console.error(`[${label}] error`, error);
}

export type FormState = {
  success: boolean;
  error?: string;
  values?: Record<string, string>;
};

const FORM_FIELD_NAMES = [
  "name",
  "company",
  "brand",
  "series",
  "distillery",
  "maltType",
  "caskType",
  "caskNumber",
  "distillationDate",
  "bottledDate",
  "description",
  "additionalImageKeys",
  "extraInfos",
  "abv",
  "capacity",
  "stockQuantity",
  "supplyPrice",
  "consumerPrice",
  "visible",
] as const;

const REQUIRED_BOTTLE_FIELDS = [
  ["name", "제품명"],
  ["brand", "브랜드"],
  ["series", "시리즈"],
  ["company", "회사"],
  ["distillery", "증류소"],
  ["maltType", "몰트 타입"],
  ["abv", "알코올 도수"],
  ["capacity", "용량"],
] as const;

function extractFormValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of FORM_FIELD_NAMES) {
    const v = formData.get(key);
    if (typeof v === "string") values[key] = v;
  }
  values.visible = formData.getAll("visible").includes("on") ? "on" : "off";
  return values;
}

const optionalText = z
  .string()
  .transform((v) => v.trim() || undefined)
  .optional();

// 백엔드 @maxLength 제약을 Korean 레이블과 함께 선검증한다.
// 여기서 걸리면 "잘못된 요청 본문입니다." 대신 "브랜드는 최대 50자입니다." 같은 메시지가 나간다.
const bounded = (max: number, label: string) =>
  z
    .string()
    .transform((v) => v.trim() || undefined)
    .optional()
    .refine((v) => v === undefined || v.length <= max, {
      message: `${label}은(는) 최대 ${max}자까지 입력 가능합니다.`,
    });

const optionalNum = z
  .string()
  .transform((v) => {
    const n = Number(v);
    return v.trim() && !Number.isNaN(n) ? n : undefined;
  })
  .optional();

const additionalImageKeys = z.string().transform((value, context): string[] | undefined => {
  if (!value.trim()) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    context.addIssue({
      code: "custom",
      message: "추가 이미지 정보의 형식이 올바르지 않습니다.",
    });
    return z.NEVER;
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length > 9 ||
    parsed.some((key) => typeof key !== "string" || key.trim().length === 0) ||
    new Set(parsed).size !== parsed.length
  ) {
    context.addIssue({
      code: "custom",
      message: "추가 이미지는 중복 없이 최대 9장까지 등록할 수 있습니다.",
    });
    return z.NEVER;
  }

  return parsed;
});

const bottleFormSchema = z.object({
  name: bounded(200, "제품명"),
  company: bounded(50, "회사"),
  brand: bounded(50, "브랜드"),
  series: bounded(50, "시리즈"),
  distillery: bounded(50, "증류소"),
  maltType: bounded(50, "몰트 타입"),
  caskType: bounded(50, "캐스크 타입"),
  caskNumber: bounded(50, "캐스크 번호"),
  distillationDate: optionalText,
  bottledDate: optionalText,
  description: z.string().transform((value) => {
    if (!richTextHasContent(value)) return undefined;
    return sanitizeRichTextContent(value);
  }),
  additionalImageKeys,
  extraInfos: optionalText,
  abv: optionalNum,
  capacity: optionalNum,
  stockQuantity: optionalNum,
  supplyPrice: optionalNum,
  consumerPrice: optionalNum,
  visible: z.boolean(),
});

function parseBottleFormData(formData: FormData) {
  const raw: Record<string, string | boolean> = {};
  for (const key of Object.keys(bottleFormSchema.shape)) {
    raw[key] = key === "visible" ? formData.getAll("visible").includes("on") : ((formData.get(key) as string) ?? "");
  }
  const result = bottleFormSchema.safeParse(raw);
  if (!result.success) {
    const firstMessage = result.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false as const, error: firstMessage };
  }
  return { success: true as const, data: result.data };
}

function validateRequiredBottleFields(data: z.infer<typeof bottleFormSchema>): string | undefined {
  for (const [field, label] of REQUIRED_BOTTLE_FIELDS) {
    if (data[field] === undefined) {
      return `${label}은(는) 필수입니다.`;
    }
  }
}

function parseExtraInfos(raw: string | undefined): PostApiAdminBottlesBodyExtraInfos | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
    }
  } catch {
    // fall through
  }
  return undefined;
}

// 구버전 응답까지 처리할 수 있도록 key 후보를 순서대로 확인한다.
function extractLabelImgKey(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  for (const candidate of ["key", "s3Key", "objectKey"]) {
    const v = obj[candidate];
    if (typeof v === "string" && v.length > 0) return v;
  }
  for (const v of Object.values(obj)) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

export async function createBottleFormAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = extractFormValues(formData);

  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "인증이 필요합니다.", values };
  }

  const parsed = parseBottleFormData(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error, values };
  }

  const requiredError = validateRequiredBottleFields(parsed.data);
  if (requiredError) {
    return { success: false, error: requiredError, values };
  }

  const labelImg = formData.get("labelImg") as File | null;
  if (!labelImg || labelImg.size === 0) {
    return { success: false, error: "라벨 이미지는 필수입니다.", values };
  }
  const imageValidationError = getImageValidationError(labelImg, MAX_BOTTLE_IMAGE_SIZE_MB);
  if (imageValidationError) {
    return { success: false, error: imageValidationError, values };
  }

  let labelImgKey: string | undefined;
  try {
    const uploaded = await postApiAdminImagesPurpose("BOTTLE", { file: labelImg }, withToken(token));
    labelImgKey = extractLabelImgKey(uploaded.data);
    if (!labelImgKey) {
      return {
        success: false,
        error: "라벨 이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
        values,
      };
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logActionError("createBottleFormAction:s3Upload", error);
    return {
      success: false,
      error: getUserErrorMessage(error, "라벨 이미지 업로드에 실패했습니다."),
      values,
    };
  }

  const { extraInfos: rawExtraInfos, ...rest } = parsed.data;
  try {
    await postApiAdminBottles(
      {
        ...rest,
        name: parsed.data.name!,
        labelImgKey: labelImgKey!,
        extraInfos: parseExtraInfos(rawExtraInfos),
      },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logActionError("createBottleFormAction", error);
    return {
      success: false,
      error: getUserErrorMessage(error, "제품 생성에 실패했습니다."),
      values,
    };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateBottleFormAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = extractFormValues(formData);

  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "인증이 필요합니다.", values };
  }

  const parsed = parseBottleFormData(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error, values };
  }

  const requiredError = validateRequiredBottleFields(parsed.data);
  if (requiredError) {
    return { success: false, error: requiredError, values };
  }

  const labelImg = formData.get("labelImg") as File | null;
  let labelImgKey: string | undefined;

  if (labelImg && labelImg.size > 0) {
    const imageValidationError = getImageValidationError(labelImg, MAX_BOTTLE_IMAGE_SIZE_MB);
    if (imageValidationError) {
      return { success: false, error: imageValidationError, values };
    }
    try {
      const uploaded = await postApiAdminImagesPurpose("BOTTLE", { file: labelImg }, withToken(token));
      labelImgKey = extractLabelImgKey(uploaded.data);
      if (!labelImgKey) {
        return {
          success: false,
          error: "라벨 이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
          values,
        };
      }
    } catch (error) {
      if (isRedirectError(error)) throw error;
      logActionError("updateBottleFormAction:s3Upload", error);
      return {
        success: false,
        error: getUserErrorMessage(error, "라벨 이미지 업로드에 실패했습니다."),
        values,
      };
    }
  }

  const { extraInfos: rawExtraInfos, ...rest } = parsed.data;
  try {
    await patchApiAdminBottlesId(
      id,
      {
        ...rest,
        labelImgKey,
        extraInfos: parseExtraInfos(rawExtraInfos),
      },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logActionError("updateBottleFormAction", error);
    return {
      success: false,
      error: getUserErrorMessage(error, "제품 수정에 실패했습니다."),
      values,
    };
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${id}`);
}

export async function deleteBottleAction(id: number) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await deleteApiAdminBottlesId(id, withToken(token));
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "제품 삭제에 실패했습니다."),
    };
  }
}

export async function updateManualPurchaseStatusesAction(
  bottleId: number,
  orderStatus: AdminManualPurchaseBulkStatusUpdateRequestOrderStatus,
) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false as const, error: "인증이 필요합니다." };
  }

  try {
    const response = await patchApiV2AdminBottlesBottleidManualPurchasesStatus(
      bottleId,
      { orderStatus },
      withToken(token),
    );

    revalidatePath(`/admin/products/${bottleId}`);
    revalidatePath("/admin/bottle-orders");

    return {
      success: true as const,
      updatedCount: response.data.updatedCount ?? 0,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logActionError("updateManualPurchaseStatusesAction", error);
    return {
      success: false as const,
      error: getUserErrorMessage(error, "수동 구매내역 상태 변경에 실패했습니다."),
    };
  }
}
