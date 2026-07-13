"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  addMessage as addInquiryMessage,
  create as createInquiry,
  _delete as deleteInquiry,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";

export type InquiryActionState = {
  success: boolean;
  error?: string;
};

const createInquirySchema = z.object({
  title: z.string().trim().min(1, "문의 제목을 입력해주세요.").max(200, "문의 제목은 200자 이하여야 합니다."),
  content: z.string().trim().min(1, "문의 내용을 입력해주세요."),
});

const messageSchema = z.object({
  content: z.string().trim().min(1, "추가 문의 내용을 입력해주세요."),
});

export async function createInquiryAction(
  _previousState: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  try {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "로그인이 필요합니다." };

    const parsed = createInquirySchema.safeParse({
      title: formData.get("title"),
      content: formData.get("content"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const response = await createInquiry({ ...parsed.data, hasImage: false }, withToken(token));
    const inquiryId = response.data.inquiry?.id;
    if (!inquiryId) {
      return { success: false, error: "생성된 문의를 확인할 수 없습니다." };
    }

    revalidatePath("/my-page/inquiries");
    redirect(`/my-page/inquiries/${inquiryId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "문의를 등록하지 못했습니다."),
    };
  }
}

export async function addInquiryMessageAction(
  inquiryId: number,
  _previousState: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  try {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "로그인이 필요합니다." };

    const parsed = messageSchema.safeParse({ content: formData.get("content") });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await addInquiryMessage(inquiryId, { content: parsed.data.content, hasImage: false }, withToken(token));
    revalidatePath("/my-page/inquiries");
    revalidatePath(`/my-page/inquiries/${inquiryId}`);
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "추가 문의를 등록하지 못했습니다."),
    };
  }
}

export async function deleteInquiryAction(inquiryId: number): Promise<InquiryActionState> {
  try {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "로그인이 필요합니다." };

    await deleteInquiry(inquiryId, withToken(token));
    revalidatePath("/my-page/inquiries");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "문의를 삭제하지 못했습니다."),
    };
  }
}
