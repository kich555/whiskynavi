"use server";

import {
  deleteApiBoardsBoardidPostsPostid,
  postApiBoardsBoardidPosts,
  putApiBoardsBoardidPostsPostid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { getUserErrorMessage } from "@/apis/errors";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { COMMUNITY_BOARD_ID } from "./_lib/constants";

export type FormState = {
  success: boolean;
  error?: string;
  values?: Record<string, string>;
};

const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요.")
    .max(200, "제목은 최대 200자까지 입력 가능합니다."),
  content: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요."),
});

export async function createPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values: Record<string, string> = {
    title: (formData.get("title") as string) ?? "",
    content: (formData.get("content") as string) ?? "",
  };

  // server-auth-actions: Server Action 내부에서 인증 재검증
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다.", values };
  }

  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false, error: firstMessage, values };
  }

  try {
    await postApiBoardsBoardidPosts(
      COMMUNITY_BOARD_ID,
      { title: parsed.data.title, content: parsed.data.content },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 작성에 실패했습니다."),
      values,
    };
  }

  revalidatePath("/community");
  redirect("/community");
}

export async function updatePostAction(
  postId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string> = {
    title: (formData.get("title") as string) ?? "",
    content: (formData.get("content") as string) ?? "",
  };

  // server-auth-actions: Server Action 내부에서 인증 재검증
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다.", values };
  }

  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false, error: firstMessage, values };
  }

  try {
    await putApiBoardsBoardidPostsPostid(
      COMMUNITY_BOARD_ID,
      postId,
      { title: parsed.data.title, content: parsed.data.content },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 수정에 실패했습니다."),
      values,
    };
  }

  revalidatePath(`/community/posts/${postId}`);
  redirect(`/community/posts/${postId}`);
}

export async function deletePostAction(
  postId: number,
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  try {
    await deleteApiBoardsBoardidPostsPostid(COMMUNITY_BOARD_ID, postId, withToken(token));
    revalidatePath("/community");
    redirect("/community");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 삭제에 실패했습니다."),
    };
  }
}