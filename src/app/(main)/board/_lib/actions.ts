"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  deleteApiBoardsBoardidPostsPostid,
  deleteApiBoardsBoardidPostsPostidCommentsCommentid,
  getApiBoardsBoardidPostsPostid,
  getApiBoardsBoardidPostsPostidComments,
  postApiBoardsBoardidPosts,
  postApiBoardsBoardidPostsPostidComments,
  putApiBoardsBoardidPostsPostid,
  putApiBoardsBoardidPostsPostidCommentsCommentid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { z } from "zod/v4";

export type FormState = {
  success: boolean;
  error?: string;
  values?: Record<string, string>;
};

const postSchema = z.object({
  postTypeCode: z.string().trim().min(1, "분류를 선택해주세요.").max(50, "올바른 분류를 선택해주세요."),
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(200, "제목은 최대 200자까지 입력 가능합니다."),
  content: z.string().trim().min(1, "내용을 입력해주세요."),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, "댓글 내용을 입력해주세요.").max(1000, "댓글은 최대 1000자까지 입력 가능합니다."),
  parentCommentId: z.number().int().positive().optional(),
});

export type CommentFormState = {
  success: boolean;
  error?: string;
  values?: { content?: string; parentCommentId?: number };
};

async function verifyCommentOwnership(
  boardId: string,
  postId: number,
  commentId: number,
  token: string,
): Promise<{ ok: true; authorId: number } | { ok: false; error: string }> {
  try {
    const res = await getApiBoardsBoardidPostsPostidComments(boardId, postId, withToken(token));
    const target = res.data?.find((c) => c.id === commentId || c.replies?.some((r) => r.id === commentId));
    if (!target) {
      return { ok: false, error: "댓글을 찾을 수 없습니다." };
    }
    const authorId =
      target.id === commentId ? target.authorId : target.replies?.find((r) => r.id === commentId)?.authorId;
    if (authorId === undefined) {
      return { ok: false, error: "댓글 작성자를 확인할 수 없습니다." };
    }
    return { ok: true, authorId };
  } catch {
    return { ok: false, error: "댓글 정보를 불러올 수 없습니다." };
  }
}

export async function createPostAction(
  boardId: string,
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string> = {
    postTypeCode: (formData.get("postTypeCode") as string) ?? "",
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

  // HTML sanitize: TipTap 에디터에서 출력된 HTML을 정화
  const sanitized = sanitizeHtml(parsed.data.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https"],
  });

  try {
    await postApiBoardsBoardidPosts(
      boardId,
      { title: parsed.data.title, content: sanitized, postTypeCode: parsed.data.postTypeCode },
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

  revalidatePath(`/board/${boardId}`);
  redirect(`/board/${boardId}`);
}

export async function updatePostAction(
  boardId: string,
  postId: number,
  _prev: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string> = {
    postTypeCode: (formData.get("postTypeCode") as string) ?? "",
    title: (formData.get("title") as string) ?? "",
    content: (formData.get("content") as string) ?? "",
  };

  // server-auth-actions: Server Action 내부에서 인증 재검증
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다.", values };
  }

  // server-auth-actions: 게시글 작성자 확인 (defense-in-depth)
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  if (currentUserId) {
    try {
      const post = await getApiBoardsBoardidPostsPostid(boardId, postId, withToken(token));
      if (post.data.authorId !== currentUserId) {
        return { success: false, error: "수정 권한이 없습니다.", values };
      }
    } catch {
      return { success: false, error: "게시글을 찾을 수 없습니다.", values };
    }
  }

  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false, error: firstMessage, values };
  }

  // HTML sanitize: TipTap 에디터에서 출력된 HTML을 정화
  const sanitized = sanitizeHtml(parsed.data.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https"],
  });

  try {
    await putApiBoardsBoardidPostsPostid(
      boardId,
      postId,
      { title: parsed.data.title, content: sanitized, postTypeCode: parsed.data.postTypeCode },
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

  revalidatePath(`/board/${boardId}/posts/${postId}`);
  redirect(`/board/${boardId}/posts/${postId}`);
}

export async function deletePostAction(boardId: string, postId: number): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // server-auth-actions: 게시글 작성자 확인 (defense-in-depth)
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  if (currentUserId) {
    try {
      const post = await getApiBoardsBoardidPostsPostid(boardId, postId, withToken(token));
      if (post.data.authorId !== currentUserId) {
        return { success: false, error: "삭제 권한이 없습니다." };
      }
    } catch {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }
  }

  try {
    await deleteApiBoardsBoardidPostsPostid(boardId, postId, withToken(token));
    revalidatePath(`/board/${boardId}`);
    redirect(`/board/${boardId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 삭제에 실패했습니다."),
    };
  }
}

export async function createCommentAction(
  boardId: string,
  postId: number,
  _prev: CommentFormState | null,
  formData: FormData,
): Promise<CommentFormState> {
  const values: { content?: string; parentCommentId?: number } = {
    content: (formData.get("content") as string) ?? "",
  };
  const parentRaw = formData.get("parentCommentId");
  if (parentRaw) {
    const parsed = Number(parentRaw);
    if (Number.isFinite(parsed) && parsed > 0) values.parentCommentId = parsed;
  }

  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다.", values };
  }

  const parsed = commentSchema.safeParse(values);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false, error: firstMessage, values };
  }

  try {
    await postApiBoardsBoardidPostsPostidComments(
      boardId,
      postId,
      {
        content: parsed.data.content,
        parentCommentId: parsed.data.parentCommentId,
      },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "댓글 작성에 실패했습니다."),
      values,
    };
  }

  revalidatePath(`/board/${boardId}/posts/${postId}`);
  return { success: true };
}

export async function updateCommentAction(
  boardId: string,
  postId: number,
  commentId: number,
  _prev: CommentFormState | null,
  formData: FormData,
): Promise<CommentFormState> {
  const values: { content?: string } = {
    content: (formData.get("content") as string) ?? "",
  };

  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다.", values };
  }

  // 작성자 확인 (defense-in-depth)
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;
  if (currentUserId !== undefined) {
    const owner = await verifyCommentOwnership(boardId, postId, commentId, token);
    if (!owner.ok) {
      return { success: false, error: owner.error, values };
    }
    if (owner.authorId !== currentUserId) {
      return { success: false, error: "수정 권한이 없습니다.", values };
    }
  }

  const parsed = commentSchema.shape.content.safeParse(values.content);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false, error: firstMessage, values };
  }

  try {
    await putApiBoardsBoardidPostsPostidCommentsCommentid(
      boardId,
      postId,
      commentId,
      { content: parsed.data },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "댓글 수정에 실패했습니다."),
      values,
    };
  }

  revalidatePath(`/board/${boardId}/posts/${postId}`);
  return { success: true };
}

export async function deleteCommentAction(
  boardId: string,
  postId: number,
  commentId: number,
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 작성자 확인 (defense-in-depth)
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;
  if (currentUserId !== undefined) {
    const owner = await verifyCommentOwnership(boardId, postId, commentId, token);
    if (!owner.ok) {
      return { success: false, error: owner.error };
    }
    if (owner.authorId !== currentUserId) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }
  }

  try {
    await deleteApiBoardsBoardidPostsPostidCommentsCommentid(boardId, postId, commentId, withToken(token));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "댓글 삭제에 실패했습니다."),
    };
  }

  revalidatePath(`/board/${boardId}/posts/${postId}`);
  return { success: true };
}
