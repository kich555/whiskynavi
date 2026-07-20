"use server";

import { ApiError, getUserErrorMessage } from "@/apis/errors";
import {
  patchApiOrdersOrderidCancel,
  postApiUsersBusinessesApplications,
  postApiUsersBusinessesApplicationsApplicationidCancel,
  postApiUsersMeEmailVerificationSend,
  postApiUsersMeEmailVerificationVerify,
  putApiAuthChangePassword,
  putApiUsersMeAgreements,
  putApiUsersMeEmail,
  putApiUsersMeNickname,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."),
    newPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다."),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export async function changePassword(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await putApiAuthChangePassword(
      {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
      withToken(token),
    );

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "비밀번호 변경에 실패했습니다."),
    };
  }
}

const cancelOrderSchema = z.object({
  orderId: z.number().positive(),
  reason: z.string().max(500).optional(),
});

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export async function cancelOrder(orderId: number, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const parsed = cancelOrderSchema.safeParse({ orderId, reason });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await patchApiOrdersOrderidCancel(parsed.data.orderId, { reason: parsed.data.reason }, withToken(token));

    revalidatePath("/my-page");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "주문 취소에 실패했습니다."),
    };
  }
}

export async function sendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    await postApiUsersMeEmailVerificationSend({ email }, withToken(token));
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "인증 코드 발송에 실패했습니다."),
    };
  }
}

export async function verifyEmailCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    await postApiUsersMeEmailVerificationVerify({ email, code }, withToken(token));
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "인증 코드가 올바르지 않습니다."),
    };
  }
}

const updateProfileSchema = z.object({
  username: z.string().min(2, "닉네임은 2자 이상이어야 합니다.").max(15),
  email: z.string().email("올바른 이메일을 입력해주세요.").max(100),
  originalUsername: z.string(),
  originalEmail: z.string(),
  emailVerified: z.string(),
  marketingAgree: z.enum(["true", "false"]),
  emailAgree: z.enum(["true", "false"]),
  smsAgree: z.enum(["true", "false"]),
  snsAgree: z.enum(["true", "false"]),
  originalMarketingAgree: z.enum(["true", "false"]),
  originalEmailAgree: z.enum(["true", "false"]),
  originalSmsAgree: z.enum(["true", "false"]),
  originalSnsAgree: z.enum(["true", "false"]),
});

type UpdateProfileState = {
  success: boolean;
  error?: string;
  updatedUsername?: string;
  updatedEmail?: string;
};

export async function updateProfile(_prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const parsed = updateProfileSchema.safeParse({
      username: formData.get("username"),
      email: formData.get("email"),
      originalUsername: formData.get("originalUsername"),
      originalEmail: formData.get("originalEmail"),
      emailVerified: formData.get("emailVerified"),
      marketingAgree: formData.get("marketingAgree"),
      emailAgree: formData.get("emailAgree"),
      smsAgree: formData.get("smsAgree"),
      snsAgree: formData.get("snsAgree"),
      originalMarketingAgree: formData.get("originalMarketingAgree"),
      originalEmailAgree: formData.get("originalEmailAgree"),
      originalSmsAgree: formData.get("originalSmsAgree"),
      originalSnsAgree: formData.get("originalSnsAgree"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const {
      username,
      email,
      originalUsername,
      originalEmail,
      emailVerified,
      marketingAgree,
      emailAgree,
      smsAgree,
      snsAgree,
      originalMarketingAgree,
      originalEmailAgree,
      originalSmsAgree,
      originalSnsAgree,
    } = parsed.data;

    const nicknameChanged = username !== originalUsername;
    const emailChanged = email !== originalEmail;
    const agreementsChanged =
      marketingAgree !== originalMarketingAgree ||
      emailAgree !== originalEmailAgree ||
      smsAgree !== originalSmsAgree ||
      snsAgree !== originalSnsAgree;

    if (!nicknameChanged && !emailChanged && !agreementsChanged) {
      return { success: false, error: "변경된 정보가 없습니다." };
    }

    if (emailChanged && emailVerified !== "true") {
      return { success: false, error: "이메일 인증을 완료해주세요." };
    }

    if (nicknameChanged) {
      await putApiUsersMeNickname({ nickname: username }, withToken(token));
    }

    if (emailChanged) {
      await putApiUsersMeEmail({ newEmail: email }, withToken(token));
    }

    if (agreementsChanged) {
      await putApiUsersMeAgreements(
        {
          marketingAgree: marketingAgree === "true",
          emailAgree: emailAgree === "true",
          smsAgree: smsAgree === "true",
          snsAgree: snsAgree === "true",
        },
        withToken(token),
      );
    }

    revalidatePath("/my-page");
    return {
      success: true,
      updatedUsername: nicknameChanged ? username : undefined,
      updatedEmail: emailChanged ? email : undefined,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "프로필 수정에 실패했습니다."),
    };
  }
}

const businessApplySchema = z.object({
  businessName: z.string().min(1, "사업자 이름을 입력해주세요."),
  contact: z.string().min(1, "연락처를 입력해주세요."),
  businessRegistrationNumber: z.string().min(1, "사업자 등록번호를 입력해주세요."),
  businessType: z.enum(["HOUSEHOLD", "ENTERTAINMENT"], {
    message: "사업자 구분을 선택해주세요.",
  }),
  pickupAddress: z.string().optional().default(""),
  openingDate: z.string().min(1, "개업일을 입력해주세요.").refine(isValidDateString, {
    message: "개업일은 yyyy-MM-dd 형식의 올바른 날짜여야 합니다.",
  }),
  representativeName: z.string().min(1, "대표자 이름을 입력해주세요."),
});

const BUSINESS_VERIFICATION_INPUT_REVIEW_MESSAGE =
  "국세청 사업자 검증에 실패했습니다. 입력하신 사업자등록번호, 개업일자, 대표자명을 다시 확인해주세요.";

const BUSINESS_APPLICATION_NOT_FOUND_MESSAGE =
  "사업자 등록 신청 페이지에 연결할 수 없습니다. 서비스가 업데이트 중이거나 신청 주소가 변경되었을 수 있습니다. 잠시 후 다시 시도하고, 계속되면 고객센터에 문의해주세요.";

const BUSINESS_APPLICATION_FORBIDDEN_MESSAGE =
  "현재 계정으로는 사업자 등록을 신청할 수 없습니다. 로그인 계정의 상태와 본인 인증 여부를 확인한 뒤 다시 시도해주세요.";

const BUSINESS_APPLICATION_CONFLICT_MESSAGE =
  "동일한 사업자등록번호로 접수되었거나 이미 처리 중인 신청이 있습니다. 마이페이지의 사업자 신청 내역을 확인해주세요.";

export interface BusinessApplicationActionResult {
  success: boolean;
  error?: string;
  hint?: string;
  code?: string;
  requestId?: string;
}

type BusinessApplicationErrorDetails = Omit<BusinessApplicationActionResult, "success">;

const getStructuredApiErrorDetails = (error: ApiError): BusinessApplicationErrorDetails => ({
  error: error.userMessage,
  ...(error.hint ? { hint: error.hint } : {}),
  ...(error.code ? { code: error.code } : {}),
  ...(error.requestId ? { requestId: error.requestId } : {}),
});

const getBusinessApplicationErrorDetails = (error: unknown): BusinessApplicationErrorDetails => {
  if (error instanceof ApiError) {
    if (error.code) return getStructuredApiErrorDetails(error);

    if (error.status === 400 && error.userMessage.startsWith("사업자 등록 신청 검증에 실패했습니다.")) {
      return { error: BUSINESS_VERIFICATION_INPUT_REVIEW_MESSAGE };
    }

    if (error.status === 403) return { error: BUSINESS_APPLICATION_FORBIDDEN_MESSAGE };
    if (error.status === 404) return { error: BUSINESS_APPLICATION_NOT_FOUND_MESSAGE };
    if (error.status === 409) return { error: BUSINESS_APPLICATION_CONFLICT_MESSAGE };
    if (error.status === 413) {
      return { error: "첨부 파일이 너무 큽니다. 사업자 등록증은 10MB 이하로 업로드해주세요." };
    }
    if (error.status === 415) {
      return { error: "첨부 파일 형식을 지원하지 않습니다. PDF, JPG 또는 PNG 파일을 선택해주세요." };
    }
    if (error.status === 429) {
      return { error: "사업자 등록 신청 요청이 너무 많습니다. 잠시 후 다시 제출해주세요." };
    }
    if (error.status >= 500) {
      return {
        error:
          "사업자 등록 신청을 처리하는 서버에 일시적인 문제가 발생했습니다. 입력 내용은 유지한 채 잠시 후 다시 시도해주세요.",
      };
    }
  }

  return { error: getUserErrorMessage(error, "사업자 등록 신청에 실패했습니다.") };
};

const getBusinessApplicationCancelErrorDetails = (error: unknown): BusinessApplicationErrorDetails => {
  if (error instanceof ApiError) {
    if (error.code) return getStructuredApiErrorDetails(error);

    if (error.status === 404) {
      return {
        error:
          "취소할 사업자 등록 신청을 찾을 수 없습니다. 이미 취소되었거나 심사가 완료되었을 수 있으니 신청 내역을 새로고침해주세요.",
      };
    }
    if (error.status === 409) {
      return { error: "이미 처리된 사업자 등록 신청은 취소할 수 없습니다. 최신 신청 상태를 확인해주세요." };
    }
  }

  return { error: getUserErrorMessage(error, "사업자 등록 취소에 실패했습니다.") };
};

export async function submitBusinessApplication(
  _prevState: BusinessApplicationActionResult,
  formData: FormData,
): Promise<BusinessApplicationActionResult> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const parsed = businessApplySchema.safeParse({
      businessName: formData.get("businessName"),
      contact: formData.get("contact"),
      businessRegistrationNumber: formData.get("businessRegistrationNumber"),
      businessType: formData.get("businessType"),
      pickupAddress: formData.get("pickupAddress"),
      openingDate: formData.get("openingDate"),
      representativeName: formData.get("representativeName"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const document = formData.get("document") as File | null;
    if (!document || document.size === 0) {
      return { success: false, error: "사업자 등록증을 첨부해주세요." };
    }

    if (document.size > 10 * 1024 * 1024) {
      return { success: false, error: "파일 크기는 10MB 이하여야 합니다." };
    }

    await postApiUsersBusinessesApplications(
      { document },
      {
        businessName: parsed.data.businessName,
        contact: parsed.data.contact,
        businessRegistrationNumber: parsed.data.businessRegistrationNumber,
        businessType: parsed.data.businessType,
        pickupAddress: parsed.data.pickupAddress || "",
        openingDate: parsed.data.openingDate,
        representativeName: parsed.data.representativeName,
      } as Parameters<typeof postApiUsersBusinessesApplications>[1] & {
        businessType: "HOUSEHOLD" | "ENTERTAINMENT";
      },
      withToken(token),
    );

    revalidatePath("/my-page");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      ...getBusinessApplicationErrorDetails(error),
    };
  }
}

export async function cancelBusinessApplication(applicationId: number): Promise<BusinessApplicationActionResult> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    await postApiUsersBusinessesApplicationsApplicationidCancel(
      applicationId,
      { cancelReason: "사용자 직접 취소" },
      withToken(token),
    );

    revalidatePath("/my-page");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      ...getBusinessApplicationCancelErrorDetails(error),
    };
  }
}
