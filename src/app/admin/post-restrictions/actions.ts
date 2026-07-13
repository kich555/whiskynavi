"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  deleteApiAdminUsersIdPostCreationRestriction,
  putApiAdminUsersIdPostCreationRestriction,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const HOUR_MS = 60 * 60 * 1000;

const postRestrictionSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "게시글 작성 제한 사유를 입력해주세요.")
      .max(1000, "게시글 작성 제한 사유는 1000자를 초과할 수 없습니다."),
    startAt: z.string().min(1, "시작 시각을 선택해주세요."),
    endAt: z.string().min(1, "종료 시각을 선택해주세요."),
  })
  .superRefine((value, ctx) => {
    const startAt = new Date(value.startAt);
    const endAt = new Date(value.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      ctx.addIssue({ code: "custom", message: "제한 기간이 올바르지 않습니다." });
      return;
    }
    if (endAt.getTime() - startAt.getTime() < HOUR_MS) {
      ctx.addIssue({ code: "custom", message: "게시글 작성 제한 기간은 최소 1시간이어야 합니다." });
    }
    const maximumEndAt = new Date(startAt);
    maximumEndAt.setFullYear(maximumEndAt.getFullYear() + 9999);
    if (endAt > maximumEndAt) {
      ctx.addIssue({ code: "custom", message: "게시글 작성 제한 기간은 최대 9999년입니다." });
    }
  });

export type PostRestrictionInput = z.input<typeof postRestrictionSchema>;

export async function setPostCreationRestrictionAction(userId: number, input: PostRestrictionInput) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." } as const;

  const parsed = postRestrictionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message } as const;
  }

  try {
    await putApiAdminUsersIdPostCreationRestriction(userId, parsed.data, withToken(token));
    revalidatePath("/admin/post-restrictions");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 작성 제한 저장에 실패했습니다."),
    } as const;
  }
}

export async function releasePostCreationRestrictionAction(userId: number) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." } as const;

  try {
    await deleteApiAdminUsersIdPostCreationRestriction(userId, withToken(token));
    revalidatePath("/admin/post-restrictions");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 작성 제한 해제에 실패했습니다."),
    } as const;
  }
}
