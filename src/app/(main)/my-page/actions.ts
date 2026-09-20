"use server";

import { ApiError, getUserErrorMessage } from "@/apis/errors";
import {
  patchApiOrdersOrderidCancel,
  patchApiV2OrdersOrderidReceipt,
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
import {
  getStructuredApiErrorDetails,
  type BusinessApplicationActionResult,
  type BusinessApplicationErrorDetails,
} from "./_lib/business-application";

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

const completeReceiptSchema = z.object({
  orderId: z.number().positive(),
});

export async function completeReceipt(orderId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const parsed = completeReceiptSchema.safeParse({ orderId });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await patchApiV2OrdersOrderidReceipt(parsed.data.orderId, withToken(token));

    revalidatePath("/my-page");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "수령 완료 처리에 실패했습니다."),
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
