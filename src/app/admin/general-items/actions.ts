"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  patchApiAdminItemsId,
  postApiAdminItems,
  postApiAdminSales,
  postApiAdminImagesPurpose,
  type AdminSaleAnnouncementResponse,
  type ItemAdminResponse,
  type PostApiAdminItemsBodyExtraInfos,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { getImageSizeError } from "@/lib/image-upload";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { MAX_GENERAL_ITEM_IMAGE_SIZE_MB } from "./image-constraints";

export type GeneralItemFormState = {
  success: boolean;
  error?: string;
  values?: Record<string, string>;
  data?: ItemAdminResponse;
};

export type GeneralItemSaleFormState = {
  success: boolean;
  error?: string;
  values?: Record<string, string>;
  data?: AdminSaleAnnouncementResponse;
};

const ITEM_FORM_FIELD_NAMES = [
  "name",
  "description",
  "imageKey",
  "stockQuantity",
  "supplyPrice",
  "consumerPrice",
  "visible",
  "extraInfos",
] as const;

const SALE_FORM_FIELD_NAMES = [
  "productId",
  "title",
  "itemName",
  "salePrice",
  "totalQuantity",
  "availableQuantity",
  "maxOrderQuantity",
  "saleStatus",
  "saleStartAt",
  "saleEndAt",
] as const;

function extractValues(formData: FormData, fieldNames: readonly string[]) {
  const values: Record<string, string> = {};
  fieldNames.forEach((key) => {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  });
  return values;
}

const optionalText = z
  .string()
  .transform((value) => value.trim() || undefined)
  .optional();

const optionalNonNegativeNumber = (label: string) =>
  z
    .string()
    .transform((value) => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => value === undefined || !Number.isNaN(value), `${label}은(는) 숫자로 입력해주세요.`)
    .refine((value) => value === undefined || value >= 0, `${label}은(는) 0 이상이어야 합니다.`)
    .optional();

const requiredPositiveNumber = (label: string) =>
  z
    .string()
    .transform((value) => {
      const parsed = Number(value.trim());
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => !Number.isNaN(value), `${label}은(는) 숫자로 입력해주세요.`)
    .refine((value) => value > 0, `${label}은(는) 1 이상이어야 합니다.`);

const itemFormSchema = z.object({
  name: z.string().trim().min(1, "상품명은 필수입니다.").max(200, "상품명은 최대 200자까지 입력 가능합니다."),
  description: optionalText,
  imageKey: optionalText,
  stockQuantity: optionalNonNegativeNumber("재고 수량"),
  supplyPrice: optionalNonNegativeNumber("공급가"),
  consumerPrice: optionalNonNegativeNumber("소비자가"),
  visible: z.boolean(),
  extraInfos: optionalText,
});

const saleStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED", "SOLD_OUT"]);

const saleFormSchema = z.object({
  productId: requiredPositiveNumber("상품"),
  title: optionalText,
  itemName: optionalText,
  salePrice: requiredPositiveNumber("판매가"),
  totalQuantity: requiredPositiveNumber("총 판매 수량"),
  availableQuantity: optionalNonNegativeNumber("판매 가능 수량"),
  maxOrderQuantity: optionalNonNegativeNumber("1회 최대 주문 수량"),
  saleStatus: saleStatusSchema.catch("OPEN"),
  saleStartAt: optionalText,
  saleEndAt: optionalText,
});

function parseExtraInfos(raw: string | undefined): PostApiAdminItemsBodyExtraInfos | undefined {
  if (!raw) return undefined;

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("추가 정보 JSON 형식이 올바르지 않습니다.");
  }

  return parsed as PostApiAdminItemsBodyExtraInfos;
}

function extractUploadedKey(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  for (const key of ["key", "s3Key", "objectKey"]) {
    const value = obj[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return Object.values(obj).find((value): value is string => typeof value === "string" && value.length > 0);
}

async function resolveImageKey(formData: FormData, token: string, fallbackKey?: string) {
  const imageFile = formData.get("imageFile");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return fallbackKey;
  }

  const uploaded = await postApiAdminImagesPurpose("ITEM", { file: imageFile }, withToken(token));
  return extractUploadedKey(uploaded.data);
}

function validateImageFile(formData: FormData): string | undefined {
  const imageFile = formData.get("imageFile");
  if (!(imageFile instanceof File) || imageFile.size === 0) return undefined;
  return getImageSizeError(imageFile, MAX_GENERAL_ITEM_IMAGE_SIZE_MB);
}

export async function createGeneralItemFormAction(
  _prev: GeneralItemFormState,
  formData: FormData,
): Promise<GeneralItemFormState> {
  const values = extractValues(formData, ITEM_FORM_FIELD_NAMES);
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다.", values };
  }

  const parsed = itemFormSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    imageKey: formData.get("imageKey") ?? "",
    stockQuantity: formData.get("stockQuantity") ?? "",
    supplyPrice: formData.get("supplyPrice") ?? "",
    consumerPrice: formData.get("consumerPrice") ?? "",
    visible: formData.get("visible") === "on",
    extraInfos: formData.get("extraInfos") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.", values };
  }

  const imageSizeError = validateImageFile(formData);
  if (imageSizeError) {
    return { success: false, error: imageSizeError, values };
  }

  let extraInfos: PostApiAdminItemsBodyExtraInfos | undefined;
  try {
    extraInfos = parseExtraInfos(parsed.data.extraInfos);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "추가 정보 JSON 형식이 올바르지 않습니다.",
      values,
    };
  }

  try {
    const imageKey = await resolveImageKey(formData, token, parsed.data.imageKey);
    const result = await postApiAdminItems(
      {
        name: parsed.data.name,
        description: parsed.data.description,
        imageKey,
        stockQuantity: parsed.data.stockQuantity,
        supplyPrice: parsed.data.supplyPrice,
        consumerPrice: parsed.data.consumerPrice,
        visible: parsed.data.visible,
        extraInfos,
      },
      withToken(token),
    );

    revalidatePath("/admin/general-items");
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: getUserErrorMessage(error, "일반상품 등록에 실패했습니다."), values };
  }
}

export async function updateGeneralItemFormAction(
  itemId: number,
  _prev: GeneralItemFormState,
  formData: FormData,
): Promise<GeneralItemFormState> {
  const values = extractValues(formData, ITEM_FORM_FIELD_NAMES);
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다.", values };
  }

  if (!Number.isFinite(itemId) || itemId <= 0) {
    return { success: false, error: "일반상품 ID가 올바르지 않습니다.", values };
  }

  const parsed = itemFormSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    imageKey: formData.get("imageKey") ?? "",
    stockQuantity: formData.get("stockQuantity") ?? "",
    supplyPrice: formData.get("supplyPrice") ?? "",
    consumerPrice: formData.get("consumerPrice") ?? "",
    visible: formData.get("visible") === "on",
    extraInfos: formData.get("extraInfos") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.", values };
  }

  const imageSizeError = validateImageFile(formData);
  if (imageSizeError) {
    return { success: false, error: imageSizeError, values };
  }

  let extraInfos: PostApiAdminItemsBodyExtraInfos | undefined;
  try {
    extraInfos = parseExtraInfos(parsed.data.extraInfos);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "추가 정보 JSON 형식이 올바르지 않습니다.",
      values,
    };
  }

  try {
    const imageKey = await resolveImageKey(formData, token, parsed.data.imageKey);
    const result = await patchApiAdminItemsId(
      itemId,
      {
        name: parsed.data.name,
        description: parsed.data.description,
        imageKey,
        stockQuantity: parsed.data.stockQuantity,
        supplyPrice: parsed.data.supplyPrice,
        consumerPrice: parsed.data.consumerPrice,
        visible: parsed.data.visible,
        extraInfos,
      },
      withToken(token),
    );

    revalidatePath("/admin/general-items");
    revalidatePath(`/admin/general-items/${itemId}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: getUserErrorMessage(error, "일반상품 수정에 실패했습니다."), values };
  }
}

export async function createGeneralItemSaleFormAction(
  _prev: GeneralItemSaleFormState,
  formData: FormData,
): Promise<GeneralItemSaleFormState> {
  const values = extractValues(formData, SALE_FORM_FIELD_NAMES);
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다.", values };
  }

  const parsed = saleFormSchema.safeParse({
    productId: formData.get("productId") ?? "",
    title: formData.get("title") ?? "",
    itemName: formData.get("itemName") ?? "",
    salePrice: formData.get("salePrice") ?? "",
    totalQuantity: formData.get("totalQuantity") ?? "",
    availableQuantity: formData.get("availableQuantity") ?? "",
    maxOrderQuantity: formData.get("maxOrderQuantity") ?? "",
    saleStatus: formData.get("saleStatus") ?? "OPEN",
    saleStartAt: formData.get("saleStartAt") ?? "",
    saleEndAt: formData.get("saleEndAt") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.", values };
  }

  const orderableRoles = formData
    .getAll("orderableRoles")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  try {
    const result = await postApiAdminSales(
      {
        productId: parsed.data.productId,
        productType: "ITEM",
        saleType: "GENERAL",
        title: parsed.data.title,
        itemName: parsed.data.itemName,
        salePrice: parsed.data.salePrice,
        totalQuantity: parsed.data.totalQuantity,
        availableQuantity: parsed.data.availableQuantity ?? parsed.data.totalQuantity,
        maxOrderQuantity: parsed.data.maxOrderQuantity,
        saleStatus: parsed.data.saleStatus,
        saleStartAt: parsed.data.saleStartAt,
        saleEndAt: parsed.data.saleEndAt,
        orderableRoles: orderableRoles.length > 0 ? orderableRoles : undefined,
      },
      withToken(token),
    );

    revalidatePath("/admin/general-items");
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: getUserErrorMessage(error, "일반상품판매공고 등록에 실패했습니다."), values };
  }
}
