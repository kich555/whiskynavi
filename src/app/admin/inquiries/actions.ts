"use server";

import { getUserErrorMessage } from "@/apis/errors";
import { close, reopen, reply } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type AdminInquiryActionState = {
  success: boolean;
  error?: string;
};

const replySchema = z.object({
  content: z.string().trim().min(1, "답변 내용을 입력해주세요."),
});

async function getAdminOptions() {
  const token = await getAuthToken();
  return token ? withToken(token) : null;
}

function revalidateInquiryPages(inquiryId: number) {
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
}

export async function replyInquiryAction(
  inquiryId: number,
  _previousState: AdminInquiryActionState,
  formData: FormData,
): Promise<AdminInquiryActionState> {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    const parsed = replySchema.safeParse({ content: formData.get("content") });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await reply(inquiryId, { content: parsed.data.content, hasImage: false }, options);
    revalidateInquiryPages(inquiryId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "답변을 등록하지 못했습니다."),
    };
  }
}

export async function closeInquiryAction(inquiryId: number): Promise<AdminInquiryActionState> {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    await close(inquiryId, options);
    revalidateInquiryPages(inquiryId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "문의를 종료하지 못했습니다."),
    };
  }
}

export async function reopenInquiryAction(inquiryId: number): Promise<AdminInquiryActionState> {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    await reopen(inquiryId, options);
    revalidateInquiryPages(inquiryId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "문의를 다시 열지 못했습니다."),
    };
  }
}
