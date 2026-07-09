"use server";

import { ApiError } from "@/apis/errors";
import {
  getApiAdminBottles,
  postApiAdminBottlesReservationsApplicationsApplicationidCancel,
  postApiAdminBottlesReservationsApplicationsApplicationidConfirm,
  postApiAdminBottlesReservationsApplicationsApplicationidReject,
  postApiAdminBottlesReservationsNotices,
  PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItemRequiredRole,
  postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel,
  postApiAdminBottlesReservationsNoticesNoticeidApplicationsRejectPending,
  postApiAdminBottlesReservationsNoticesNoticeidAutoConfirm,
  putApiAdminBottlesReservationsNoticesNoticeid,
  putApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessid,
  type PostApiAdminBottlesReservationsApplicationsApplicationidCancelBody,
  type PostApiAdminBottlesReservationsApplicationsApplicationidRejectBody,
  type PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItem,
  type PutApiAdminBottlesReservationsNoticesNoticeidBodyGradeConditionsItem,
  type PutApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessidBodyCarrierCode,
  type PutApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessidBodyDeliveryMethod,
  type PutApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessidBodyDeliveryStatus,
  type ReservationAllocationExcelFailureResponse,
  type ReservationAllocationExcelResponse,
  type PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItemRequiredRole as ReservationRequiredRole,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import {
  noticeCacheTag,
  NOTICES_LIST_CACHE_TAG,
  NOTICES_RECENT_ENDED_CACHE_TAG,
} from "@/app/(main)/reservation/_lib/cacheTags";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";

interface GradeConditionFormValue {
  applicableFrom: string;
  requiredRole: string;
}

export interface NoticeFormValues {
  bottleId: string;
  bottleName: string;
  price: string;
  availableQuantity: string;
  maxOrderQuantity: string;
  reservationStartAt: string;
  reservationEndAt: string;
  description: string;
  gradeConditions: GradeConditionFormValue[];
}

export type FormState = { success: boolean; error?: string; values?: NoticeFormValues };

export type ReservationAllocationExcelActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; failures?: ReservationAllocationExcelFailureResponse[] };

export interface UpdateNoticeAvailableQuantityInput {
  noticeId: number;
  bottleId: number;
  price: number;
  reservationStartAt: string;
  reservationEndAt: string;
  availableQuantity: number;
  maxOrderQuantity?: number;
  description?: string;
  gradeConditions?: PutApiAdminBottlesReservationsNoticesNoticeidBodyGradeConditionsItem[];
}

const DEFAULT_DELIVERY_CARRIER_CODE = "CJ_LOGISTICS";
const DEFAULT_RESERVATION_REQUIRED_ROLE =
  PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItemRequiredRole.ROLE_USER;

function isReservationRequiredRole(role: string): role is ReservationRequiredRole {
  return Object.values(PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItemRequiredRole).includes(
    role as ReservationRequiredRole,
  );
}

// ─── Zod 스키마 ──────────────────────────────────────────

const optionalPositiveInt = (fieldName: string) =>
  z.string().transform((v): number | undefined => {
    if (!v.trim()) return undefined;
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || !Number.isInteger(n))
      throw new Error(`${fieldName}은(는) 0 이상의 정수여야 합니다.`);
    return n;
  });

const noticeFormSchema = z.object({
  bottleId: z.string().transform((v) => {
    const n = Number(v);
    if (!v.trim() || Number.isNaN(n)) throw new Error("bottleId is required");
    return n;
  }),
  price: z.string().transform((v) => {
    const n = Number(v);
    if (!v.trim() || Number.isNaN(n) || n < 0) throw new Error("price must be >= 0");
    return n;
  }),
  availableQuantity: optionalPositiveInt("예약 받을 병수"),
  maxOrderQuantity: optionalPositiveInt("인당 최대 예약 가능 병수"),
  reservationStartAt: z.string().min(1, "예약 시작일은 필수입니다."),
  reservationEndAt: z.string().min(1, "예약 종료일은 필수입니다."),
  description: z.string().transform((v) => {
    if (!v.trim()) return undefined;
    if (v.length > 5000) throw new Error("설명은 5000자를 초과할 수 없습니다.");
    return v;
  }),
  gradeConditions: z.string().transform((v) => {
    if (!v.trim()) return undefined;
    try {
      const parsed = JSON.parse(v);
      if (!Array.isArray(parsed)) throw new Error();
      return parsed as GradeConditionFormValue[];
    } catch {
      throw new Error("등급 조건의 형식이 올바르지 않습니다.");
    }
  }),
});

function extractNoticeFormValues(formData: FormData): NoticeFormValues {
  const gradeConditionsRaw = (formData.get("gradeConditions") as string) ?? "";
  let gradeConditions: GradeConditionFormValue[] = [];

  try {
    const parsed = gradeConditionsRaw.trim() ? JSON.parse(gradeConditionsRaw) : [];
    gradeConditions = Array.isArray(parsed) ? (parsed as GradeConditionFormValue[]) : [];
  } catch {
    gradeConditions = [];
  }

  return {
    bottleId: (formData.get("bottleId") as string) ?? "",
    bottleName: (formData.get("bottleName") as string) ?? "",
    price: (formData.get("price") as string) ?? "",
    availableQuantity: (formData.get("availableQuantity") as string) ?? "",
    maxOrderQuantity: (formData.get("maxOrderQuantity") as string) ?? "",
    reservationStartAt: (formData.get("reservationStartAt") as string) ?? "",
    reservationEndAt: (formData.get("reservationEndAt") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    gradeConditions,
  };
}

function parseNoticeFormData(formData: FormData) {
  const values = extractNoticeFormValues(formData);
  const raw: Record<string, string> = {};
  for (const key of Object.keys(noticeFormSchema.shape)) {
    raw[key] = (formData.get(key) as string) ?? "";
  }
  const result = noticeFormSchema.safeParse(raw);
  if (!result.success) {
    return { success: false as const, error: result.error.message, values };
  }

  const { reservationStartAt, reservationEndAt, gradeConditions, availableQuantity, maxOrderQuantity } = result.data;

  const start = new Date(reservationStartAt).getTime();
  const end = new Date(reservationEndAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return {
      success: false as const,
      error: "예약 시작일 또는 종료일이 유효하지 않습니다.",
      values,
    };
  }

  if (availableQuantity != null && maxOrderQuantity != null && maxOrderQuantity > availableQuantity) {
    return {
      success: false as const,
      error: "인당 최대 예약 병수는 전체 예약 받을 병수를 초과할 수 없습니다.",
      values,
    };
  }

  if (gradeConditions?.length) {
    for (const gc of gradeConditions) {
      if (!gc.requiredRole || !gc.applicableFrom) {
        return {
          success: false as const,
          error: "등급 조건에는 역할과 적용 시작일을 모두 입력해야 합니다.",
          values,
        };
      }
      if (!isReservationRequiredRole(gc.requiredRole)) {
        return {
          success: false as const,
          error: "등급 조건의 회원 등급 값이 올바르지 않습니다.",
          values,
        };
      }
      const t = new Date(gc.applicableFrom).getTime();
      if (Number.isNaN(t) || t < start || t > end) {
        return {
          success: false as const,
          error: "등급 조건의 적용 시작일은 예약 기간 내에 있어야 합니다.",
          values,
        };
      }
    }

    const hasStartCondition = gradeConditions.some((gc) => new Date(gc.applicableFrom).getTime() === start);
    if (!hasStartCondition) {
      return {
        success: false as const,
        error:
          "등급 조건에는 예약 시작 시각과 동일한 적용 시작일 조건이 1개 필요합니다. 예약 시작 즉시 신청 가능한 최소 회원 등급을 지정하는 조건입니다.",
        values,
      };
    }
  }

  return { success: true as const, data: result.data, values };
}

function buildGradeConditions(
  data: z.infer<typeof noticeFormSchema>,
): PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItem[] {
  const startAt = new Date(data.reservationStartAt).toISOString();
  const gradeConditions =
    data.gradeConditions?.map(
      (condition): PostApiAdminBottlesReservationsNoticesBodyGradeConditionsItem => ({
        applicableFrom: new Date(condition.applicableFrom).toISOString(),
        requiredRole: condition.requiredRole as ReservationRequiredRole,
      }),
    ) ?? [];

  if (gradeConditions.length > 0) {
    return gradeConditions;
  }

  return [
    {
      applicableFrom: startAt,
      requiredRole: DEFAULT_RESERVATION_REQUIRED_ROLE,
    },
  ];
}

function buildNoticeBody(data: z.infer<typeof noticeFormSchema>) {
  return {
    bottleId: data.bottleId,
    price: data.price,
    reservationStartAt: new Date(data.reservationStartAt).toISOString(),
    reservationEndAt: new Date(data.reservationEndAt).toISOString(),
    gradeConditions: buildGradeConditions(data),
    availableQuantity: data.availableQuantity,
    maxOrderQuantity: data.maxOrderQuantity,
    description: data.description,
  };
}

function parseReservationAllocationExcelError(error: unknown):
  | {
      message?: string;
      failures?: ReservationAllocationExcelFailureResponse[];
    }
  | undefined {
  if (!(error instanceof ApiError) || error.status !== 400 || !error.detail) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(error.detail) as {
      message?: unknown;
      failures?: unknown;
    };
    return {
      message: typeof parsed.message === "string" ? parsed.message : undefined,
      failures: Array.isArray(parsed.failures) ? (parsed.failures as ReservationAllocationExcelFailureResponse[]) : [],
    };
  } catch {
    return undefined;
  }
}

// ─── Bottle Search ───────────────────────────────────────

export interface BottleOption {
  id: number;
  name: string;
  stockQuantity: number | null;
}

export type SearchBottlesResult = { success: true; data: BottleOption[] } | { success: false; error: string };

export async function searchBottlesAction(keyword: string): Promise<SearchBottlesResult> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    const trimmed = keyword.trim().slice(0, 100);
    const res = await getApiAdminBottles(
      {
        keyword: trimmed || undefined,
        size: 20,
      },
      withToken(token),
    );
    const data: BottleOption[] =
      res.data.content
        ?.filter((b): b is typeof b & { id: number; name: string } => b.id != null && b.name != null)
        .map((b) => ({
          id: b.id,
          name: b.name,
          stockQuantity: b.stockQuantity ?? null,
        })) ?? [];
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "제품 검색에 실패했습니다.";
    return { success: false, error: message };
  }
}

// ─── Notice CRUD ──────────────────────────────────────────

export async function createNoticeFormAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  const parsed = parseNoticeFormData(formData);
  if (!parsed.success) return { success: false, error: parsed.error, values: parsed.values };

  try {
    await postApiAdminBottlesReservationsNotices(buildNoticeBody(parsed.data), withToken(token));
  } catch (error) {
    const message = error instanceof Error ? error.message : "공고 생성에 실패했습니다.";
    return { success: false, error: message, values: parsed.values };
  }

  revalidateTag(NOTICES_LIST_CACHE_TAG, "max");
  revalidateTag(NOTICES_RECENT_ENDED_CACHE_TAG, "max");
  revalidatePath("/admin/reservations");
  redirect("/admin/reservations");
}

export async function updateNoticeFormAction(
  noticeId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  const parsed = parseNoticeFormData(formData);
  if (!parsed.success) return { success: false, error: parsed.error, values: parsed.values };

  try {
    await putApiAdminBottlesReservationsNoticesNoticeid(noticeId, buildNoticeBody(parsed.data), withToken(token));
  } catch (error) {
    const message = error instanceof Error ? error.message : "공고 수정에 실패했습니다.";
    return { success: false, error: message, values: parsed.values };
  }

  revalidateTag(noticeCacheTag(noticeId), "max");
  revalidateTag(NOTICES_LIST_CACHE_TAG, "max");
  revalidatePath("/admin/reservations");
  redirect(`/admin/reservations/${noticeId}`);
}

export async function updateNoticeAvailableQuantityAction(input: UpdateNoticeAvailableQuantityInput) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  if (!Number.isInteger(input.availableQuantity) || input.availableQuantity < 0) {
    return { success: false, error: "예약 받을 병수는 0 이상의 정수여야 합니다." };
  }

  try {
    await putApiAdminBottlesReservationsNoticesNoticeid(
      input.noticeId,
      {
        bottleId: input.bottleId,
        price: input.price,
        reservationStartAt: new Date(input.reservationStartAt).toISOString(),
        reservationEndAt: new Date(input.reservationEndAt).toISOString(),
        availableQuantity: input.availableQuantity,
        maxOrderQuantity: input.maxOrderQuantity,
        description: input.description?.trim() || undefined,
        gradeConditions: input.gradeConditions,
      },
      withToken(token),
    );
    revalidateTag(noticeCacheTag(input.noticeId), "max");
    revalidateTag(NOTICES_LIST_CACHE_TAG, "max");
    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${input.noticeId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "예약 받을 병수 수정에 실패했습니다.";
    return { success: false, error: message };
  }
}

// ─── Application Actions ──────────────────────────────────

export async function confirmApplicationAction(applicationId: number, confirmedQuantity: number) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiAdminBottlesReservationsApplicationsApplicationidConfirm(
      applicationId,
      { confirmedQuantity },
      withToken(token),
    );
    revalidatePath("/admin/reservations");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "확정에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function rejectApplicationAction(
  applicationId: number,
  data: PostApiAdminBottlesReservationsApplicationsApplicationidRejectBody,
) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiAdminBottlesReservationsApplicationsApplicationidReject(applicationId, data, withToken(token));
    revalidatePath("/admin/reservations");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "거절에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function cancelApplicationAction(
  applicationId: number,
  data: PostApiAdminBottlesReservationsApplicationsApplicationidCancelBody,
) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiAdminBottlesReservationsApplicationsApplicationidCancel(applicationId, data, withToken(token));
    revalidatePath("/admin/reservations");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "취소에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function autoConfirmApplicationsAction(noticeId: number) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    const res = await postApiAdminBottlesReservationsNoticesNoticeidAutoConfirm(noticeId, {}, withToken(token));
    revalidateTag(noticeCacheTag(noticeId), "max");
    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${noticeId}`);
    return { success: true, data: res.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "자동 승인배정에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function rejectPendingApplicationsAction(noticeId: number) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    const res = await postApiAdminBottlesReservationsNoticesNoticeidApplicationsRejectPending(
      noticeId,
      withToken(token),
    );
    revalidateTag(noticeCacheTag(noticeId), "max");
    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${noticeId}`);
    return { success: true, data: res.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "미처리 신청 일괄 거절에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function uploadReservationAllocationExcelAction(
  noticeId: number,
  file: File,
): Promise<ReservationAllocationExcelActionResult<ReservationAllocationExcelResponse>> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  if (!file || file.size <= 0) {
    return { success: false, error: "Excel 파일을 선택해주세요." };
  }

  try {
    const res = await postApiAdminBottlesReservationsNoticesNoticeidAllocationExcel(
      noticeId,
      { file },
      withToken(token),
    );
    revalidatePath("/admin/reservations");
    revalidatePath(`/admin/reservations/${noticeId}`);
    return { success: true, data: res.data };
  } catch (error) {
    const allocationError = parseReservationAllocationExcelError(error);
    if (allocationError) {
      return {
        success: false,
        error: allocationError.message || "예약 할당 Excel 업로드에 실패했습니다.",
        failures: allocationError.failures ?? [],
      };
    }

    const message = error instanceof Error ? error.message : "예약 신청 할당 Excel 업로드에 실패했습니다.";
    return { success: false, error: message };
  }
}

// ─── 예약 공고 배송 액션 ─────────────────────────────────

export async function updateReservationDeliveryAction({
  noticeId,
  businessId,
  deliveryMethod,
  carrierCode,
  trackingNumber,
  deliveryStatus,
  deliveryMemo,
}: {
  noticeId: number;
  businessId: number;
  deliveryMethod: string;
  carrierCode?: string;
  trackingNumber?: string;
  deliveryStatus?: string;
  deliveryMemo?: string;
}) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  const isPrivateCargo = deliveryMethod === "PRIVATE_CARGO";

  try {
    await putApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessid(
      noticeId,
      businessId,
      {
        deliveryMethod:
          deliveryMethod as PutApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessidBodyDeliveryMethod,
        ...(isPrivateCargo
          ? {}
          : {
              carrierCode: (carrierCode ||
                DEFAULT_DELIVERY_CARRIER_CODE) as PutApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessidBodyCarrierCode,
              trackingNumber: trackingNumber?.trim() || undefined,
            }),
        deliveryStatus: deliveryStatus
          ? (deliveryStatus as PutApiAdminReservationDeliveriesNoticesNoticeidBusinessesBusinessidBodyDeliveryStatus)
          : undefined,
        deliveryMemo: deliveryMemo?.trim() || undefined,
      },
      withToken(token),
    );
    revalidatePath(`/admin/reservations/${noticeId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "배송정보 수정에 실패했습니다.";
    return { success: false, error: message };
  }
}
