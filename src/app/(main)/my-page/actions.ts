"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  patchApiOrdersOrderidCancel,
  postApiUsersBusinessesApplications,
  postApiUsersBusinessesApplicationsApplicationidCancel,
  postApiUsersMeEmailVerificationSend,
  postApiUsersMeEmailVerificationVerify,
  putApiAuthChangePassword,
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
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { username, email, originalUsername, originalEmail, emailVerified } = parsed.data;

    const nicknameChanged = username !== originalUsername;
    const emailChanged = email !== originalEmail;

    if (!nicknameChanged && !emailChanged) {
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

export async function submitBusinessApplication(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
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
      error: getUserErrorMessage(error, "사업자 등록 신청에 실패했습니다."),
    };
  }
}

export async function cancelBusinessApplication(applicationId: number): Promise<{ success: boolean; error?: string }> {
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
      error: getUserErrorMessage(error, "사업자 등록 취소에 실패했습니다."),
    };
  }
}
